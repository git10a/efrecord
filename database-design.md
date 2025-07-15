# データベース設計（Supabase）

## テーブル構成

### 1. profiles（ユーザープロフィール）
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. opponents（対戦相手マスタ）
```sql
CREATE TABLE opponents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_shared BOOLEAN DEFAULT true, -- 他のユーザーも使えるか
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_opponents_created_by ON opponents(created_by);
```

### 3. matches（試合記録）
```sql
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

-- インデックス
CREATE INDEX idx_matches_user_id ON matches(user_id);
CREATE INDEX idx_matches_opponent_id ON matches(opponent_id);
CREATE INDEX idx_matches_date ON matches(match_date DESC);
CREATE INDEX idx_matches_user_date ON matches(user_id, match_date DESC);
```

### 4. user_stats（ユーザー統計キャッシュ）
```sql
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_matches INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_draws INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0, -- 正: 連勝、負: 連敗
  best_win_streak INTEGER DEFAULT 0,
  worst_loss_streak INTEGER DEFAULT 0,
  last_match_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. opponent_stats（対戦相手別統計キャッシュ）
```sql
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

-- インデックス
CREATE INDEX idx_opponent_stats_user ON opponent_stats(user_id);
```

## Row Level Security (RLS) ポリシー

### profiles
```sql
-- 誰でも閲覧可能
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

-- 自分のプロフィールのみ更新可能
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);
```

### matches
```sql
-- 誰でも閲覧可能（公開記録）
CREATE POLICY "Matches are viewable by everyone" 
  ON matches FOR SELECT 
  USING (true);

-- 自分の試合記録のみ作成可能
CREATE POLICY "Users can create own matches" 
  ON matches FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 自分の試合記録のみ更新可能
CREATE POLICY "Users can update own matches" 
  ON matches FOR UPDATE 
  USING (auth.uid() = user_id);

-- 自分の試合記録のみ削除可能
CREATE POLICY "Users can delete own matches" 
  ON matches FOR DELETE 
  USING (auth.uid() = user_id);
```

### opponents
```sql
-- 誰でも閲覧可能
CREATE POLICY "Opponents are viewable by everyone" 
  ON opponents FOR SELECT 
  USING (true);

-- ログインユーザーは作成可能
CREATE POLICY "Authenticated users can create opponents" 
  ON opponents FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);
```

## 関数・トリガー

### 1. 試合結果自動判定トリガー
```sql
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

CREATE TRIGGER set_match_result
  BEFORE INSERT OR UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION calculate_match_result();
```

### 2. 統計更新関数
```sql
CREATE OR REPLACE FUNCTION update_user_stats(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_current_streak INTEGER;
  v_last_result VARCHAR(10);
BEGIN
  -- 統計を再計算
  WITH match_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE result = 'win') as wins,
      COUNT(*) FILTER (WHERE result = 'draw') as draws,
      COUNT(*) FILTER (WHERE result = 'loss') as losses,
      MAX(match_date) as last_date
    FROM matches
    WHERE user_id = p_user_id
  ),
  streak_calc AS (
    SELECT 
      result,
      ROW_NUMBER() OVER (ORDER BY match_date DESC, created_at DESC) as rn
    FROM matches
    WHERE user_id = p_user_id
    ORDER BY match_date DESC, created_at DESC
    LIMIT 1
  )
  INSERT INTO user_stats (
    user_id, total_matches, total_wins, total_draws, total_losses, last_match_date
  )
  SELECT 
    p_user_id, 
    ms.total, 
    ms.wins, 
    ms.draws, 
    ms.losses,
    ms.last_date
  FROM match_stats ms
  ON CONFLICT (user_id) DO UPDATE SET
    total_matches = EXCLUDED.total_matches,
    total_wins = EXCLUDED.total_wins,
    total_draws = EXCLUDED.total_draws,
    total_losses = EXCLUDED.total_losses,
    last_match_date = EXCLUDED.last_match_date,
    updated_at = NOW();
    
  -- 連勝・連敗の計算（別途実装）
END;
$$ LANGUAGE plpgsql;
```

### 3. 試合記録後の統計更新トリガー
```sql
CREATE OR REPLACE FUNCTION trigger_update_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- ユーザー統計を更新
  PERFORM update_user_stats(NEW.user_id);
  
  -- 対戦相手別統計を更新
  INSERT INTO opponent_stats (
    user_id, opponent_id, matches, wins, draws, losses, goals_for, goals_against
  )
  SELECT 
    NEW.user_id,
    NEW.opponent_id,
    1,
    CASE WHEN NEW.result = 'win' THEN 1 ELSE 0 END,
    CASE WHEN NEW.result = 'draw' THEN 1 ELSE 0 END,
    CASE WHEN NEW.result = 'loss' THEN 1 ELSE 0 END,
    NEW.user_score,
    NEW.opponent_score
  ON CONFLICT (user_id, opponent_id) DO UPDATE SET
    matches = opponent_stats.matches + 1,
    wins = opponent_stats.wins + CASE WHEN NEW.result = 'win' THEN 1 ELSE 0 END,
    draws = opponent_stats.draws + CASE WHEN NEW.result = 'draw' THEN 1 ELSE 0 END,
    losses = opponent_stats.losses + CASE WHEN NEW.result = 'loss' THEN 1 ELSE 0 END,
    goals_for = opponent_stats.goals_for + NEW.user_score,
    goals_against = opponent_stats.goals_against + NEW.opponent_score,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stats_after_match
  AFTER INSERT ON matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_stats();
```