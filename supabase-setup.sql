-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create opponents table
CREATE TABLE opponents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_shared BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  opponent_id UUID REFERENCES opponents(id) ON DELETE RESTRICT,
  user_score INTEGER NOT NULL CHECK (user_score >= 0),
  opponent_score INTEGER NOT NULL CHECK (opponent_score >= 0),
  result VARCHAR(10) NOT NULL CHECK (result IN ('win', 'draw', 'loss')),
  match_date DATE NOT NULL DEFAULT CURRENT_DATE,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_stats table
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_matches INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_draws INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_win_streak INTEGER DEFAULT 0,
  worst_loss_streak INTEGER DEFAULT 0,
  last_match_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create opponent_stats table
CREATE TABLE opponent_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  opponent_id UUID REFERENCES opponents(id) ON DELETE CASCADE,
  matches INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, opponent_id)
);

-- Create indexes
CREATE INDEX idx_opponents_created_by ON opponents(created_by);
CREATE INDEX idx_matches_user_id ON matches(user_id);
CREATE INDEX idx_matches_opponent_id ON matches(opponent_id);
CREATE INDEX idx_matches_date ON matches(match_date DESC);
CREATE INDEX idx_matches_user_date ON matches(user_id, match_date DESC);
CREATE INDEX idx_opponent_stats_user ON opponent_stats(user_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE opponents ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE opponent_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- RLS Policies for opponents
CREATE POLICY "Opponents are viewable by everyone" 
  ON opponents FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create opponents" 
  ON opponents FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for matches
CREATE POLICY "Matches are viewable by everyone" 
  ON matches FOR SELECT 
  USING (true);

CREATE POLICY "Users can create own matches" 
  ON matches FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own matches" 
  ON matches FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own matches" 
  ON matches FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for user_stats
CREATE POLICY "Users can view all stats" 
  ON user_stats FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own stats" 
  ON user_stats FOR ALL 
  USING (auth.uid() = user_id);

-- RLS Policies for opponent_stats
CREATE POLICY "Users can view all opponent stats" 
  ON opponent_stats FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own opponent stats" 
  ON opponent_stats FOR ALL 
  USING (auth.uid() = user_id);

-- Function to calculate match result
CREATE OR REPLACE FUNCTION calculate_match_result()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_score > NEW.opponent_score THEN
    NEW.result := 'win';
  ELSIF NEW.user_score = NEW.opponent_score THEN
    NEW.result := 'draw';
  ELSE
    NEW.result := 'loss';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate result
CREATE TRIGGER set_match_result
  BEFORE INSERT OR UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION calculate_match_result();

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats_after_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user_stats
  INSERT INTO user_stats (
    user_id, total_matches, total_wins, total_draws, total_losses, last_match_date, updated_at
  )
  SELECT 
    NEW.user_id,
    COUNT(*),
    COUNT(*) FILTER (WHERE result = 'win'),
    COUNT(*) FILTER (WHERE result = 'draw'),
    COUNT(*) FILTER (WHERE result = 'loss'),
    MAX(match_date),
    NOW()
  FROM matches
  WHERE user_id = NEW.user_id
  ON CONFLICT (user_id) DO UPDATE SET
    total_matches = EXCLUDED.total_matches,
    total_wins = EXCLUDED.total_wins,
    total_draws = EXCLUDED.total_draws,
    total_losses = EXCLUDED.total_losses,
    last_match_date = EXCLUDED.last_match_date,
    updated_at = EXCLUDED.updated_at;

  -- Insert or update opponent_stats
  INSERT INTO opponent_stats (
    user_id, opponent_id, matches, wins, draws, losses, goals_for, goals_against, updated_at
  )
  SELECT 
    NEW.user_id,
    NEW.opponent_id,
    COUNT(*),
    COUNT(*) FILTER (WHERE result = 'win'),
    COUNT(*) FILTER (WHERE result = 'draw'),
    COUNT(*) FILTER (WHERE result = 'loss'),
    SUM(user_score),
    SUM(opponent_score),
    NOW()
  FROM matches
  WHERE user_id = NEW.user_id AND opponent_id = NEW.opponent_id
  ON CONFLICT (user_id, opponent_id) DO UPDATE SET
    matches = EXCLUDED.matches,
    wins = EXCLUDED.wins,
    draws = EXCLUDED.draws,
    losses = EXCLUDED.losses,
    goals_for = EXCLUDED.goals_for,
    goals_against = EXCLUDED.goals_against,
    updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats after match insert
CREATE TRIGGER update_stats_after_match_insert
  AFTER INSERT ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_after_match();

-- Insert some sample opponents
INSERT INTO opponents (name, created_by, is_shared) VALUES
  ('田中', NULL, true),
  ('佐藤', NULL, true),
  ('山田', NULL, true),
  ('鈴木', NULL, true);