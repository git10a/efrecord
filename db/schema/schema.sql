-- データベーススキーマ定義（最新版）

-- ユーザープロフィールテーブル
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 対戦相手チームテーブル
CREATE TABLE opponents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 試合記録テーブル
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

-- ユーザー統計キャッシュテーブル
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_matches INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_draws INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0, -- 正: 連勝、負: 連敗
  best_win_streak INTEGER DEFAULT 0,
  worst_loss_streak INTEGER DEFAULT 0,
  team_name TEXT DEFAULT 'マイチーム',
  last_match_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 対戦相手別統計キャッシュテーブル
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

-- 選手テーブル
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  position VARCHAR(10) NOT NULL CHECK (position IN ('GK', 'DF', 'MF', 'FW')),
  number INTEGER CHECK (number >= 1 AND number <= 99),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- フォーメーション設定テーブル
CREATE TABLE formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  formation_pattern VARCHAR(20) NOT NULL, -- 例: "4-4-2", "3-5-2"
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- フォーメーション内の選手配置テーブル
CREATE TABLE formation_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID REFERENCES formations(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  position_x INTEGER NOT NULL, -- ピッチ上のX座標（0-100）
  position_y INTEGER NOT NULL, -- ピッチ上のY座標（0-100）
  display_position VARCHAR(10) NOT NULL, -- 表示用ポジション（GK, CB, SB, DMF, OMF, FW等）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(formation_id, player_id)
);

-- 試合での得点記録テーブル
CREATE TABLE match_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  goal_time INTEGER, -- 得点時間（分）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_opponents_created_by ON opponents(created_by);
CREATE INDEX idx_matches_user_id ON matches(user_id);
CREATE INDEX idx_matches_opponent_id ON matches(opponent_id);
CREATE INDEX idx_matches_date ON matches(match_date DESC);
CREATE INDEX idx_matches_user_date ON matches(user_id, match_date DESC);
CREATE INDEX idx_opponent_stats_user ON opponent_stats(user_id);
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_players_active ON players(is_active);
CREATE INDEX idx_formations_user_id ON formations(user_id);
CREATE INDEX idx_formations_default ON formations(is_default);
CREATE INDEX idx_formation_positions_formation_id ON formation_positions(formation_id);
CREATE INDEX idx_formation_positions_player_id ON formation_positions(player_id);
CREATE INDEX idx_match_goals_match_id ON match_goals(match_id);
CREATE INDEX idx_match_goals_player_id ON match_goals(player_id);

-- Row Level Security (RLS) ポリシー

-- profiles
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- opponents
CREATE POLICY "Users can view only their own opponents" 
  ON opponents FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND 
    created_by = auth.uid()
  );

CREATE POLICY "Authenticated users can create opponents" 
  ON opponents FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own opponents" 
  ON opponents FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL AND 
    created_by = auth.uid()
  );

CREATE POLICY "Users can delete their own opponents" 
  ON opponents FOR DELETE 
  USING (
    auth.uid() IS NOT NULL AND 
    created_by = auth.uid()
  );

-- matches
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

-- user_stats
CREATE POLICY "Users can view all stats" 
  ON user_stats FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own stats" 
  ON user_stats FOR ALL 
  USING (auth.uid() = user_id);

-- opponent_stats
CREATE POLICY "Users can view all opponent stats" 
  ON opponent_stats FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own opponent stats" 
  ON opponent_stats FOR ALL 
  USING (auth.uid() = user_id);

-- players
CREATE POLICY "Users can view own players" 
  ON players FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own players" 
  ON players FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own players" 
  ON players FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own players" 
  ON players FOR DELETE 
  USING (auth.uid() = user_id);

-- formations
CREATE POLICY "Users can view own formations" 
  ON formations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own formations" 
  ON formations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own formations" 
  ON formations FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own formations" 
  ON formations FOR DELETE 
  USING (auth.uid() = user_id);

-- formation_positions
CREATE POLICY "Users can view own formation positions" 
  ON formation_positions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM formations f 
      WHERE f.id = formation_positions.formation_id 
      AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own formation positions" 
  ON formation_positions FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM formations f 
      WHERE f.id = formation_positions.formation_id 
      AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own formation positions" 
  ON formation_positions FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM formations f 
      WHERE f.id = formation_positions.formation_id 
      AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own formation positions" 
  ON formation_positions FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM formations f 
      WHERE f.id = formation_positions.formation_id 
      AND f.user_id = auth.uid()
    )
  );

-- match_goals
CREATE POLICY "Users can view own match goals" 
  ON match_goals FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM matches m 
      WHERE m.id = match_goals.match_id 
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own match goals" 
  ON match_goals FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches m 
      WHERE m.id = match_goals.match_id 
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own match goals" 
  ON match_goals FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM matches m 
      WHERE m.id = match_goals.match_id 
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own match goals" 
  ON match_goals FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM matches m 
      WHERE m.id = match_goals.match_id 
      AND m.user_id = auth.uid()
    )
  );

-- 関数・トリガー

-- 試合結果自動判定関数
CREATE OR REPLACE FUNCTION calculate_match_result()
RETURNS TRIGGER AS $
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
$ LANGUAGE plpgsql;

-- 試合結果自動判定トリガー
CREATE TRIGGER set_match_result
  BEFORE INSERT OR UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION calculate_match_result();

-- 統計再計算関数
CREATE OR REPLACE FUNCTION recalculate_user_stats(user_id_param UUID)
RETURNS VOID AS $
DECLARE
    total_matches_count INT;
    total_wins_count INT;
    total_draws_count INT;
    total_losses_count INT;
    current_streak_value INT;
    best_win_streak_value INT;
    worst_loss_streak_value INT;
BEGIN
    -- 基本統計を計算
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE result = 'win'),
        COUNT(*) FILTER (WHERE result = 'draw'),
        COUNT(*) FILTER (WHERE result = 'loss')
    INTO total_matches_count, total_wins_count, total_draws_count, total_losses_count
    FROM matches 
    WHERE user_id = user_id_param;

    -- 現在の連勝/連敗記録を計算
    WITH recent_matches AS (
        SELECT result, ROW_NUMBER() OVER (ORDER BY match_date DESC, created_at DESC) as rn
        FROM matches 
        WHERE user_id = user_id_param
        ORDER BY match_date DESC, created_at DESC
    ),
    streak_calc AS (
        SELECT 
            result,
            ROW_NUMBER() OVER (ORDER BY rn) as streak_count
        FROM recent_matches 
        WHERE rn <= (
            SELECT MIN(rn) - 1
            FROM recent_matches r2
            WHERE r2.result != (SELECT result FROM recent_matches WHERE rn = 1)
            AND r2.rn > 1
        )
        OR (
            SELECT COUNT(*) FROM recent_matches r3 
            WHERE r3.result != (SELECT result FROM recent_matches WHERE rn = 1)
        ) = 0
    )
    SELECT 
        CASE 
            WHEN (SELECT result FROM recent_matches WHERE rn = 1) = 'win' THEN 
                COALESCE((SELECT MAX(streak_count) FROM streak_calc), 0)
            WHEN (SELECT result FROM recent_matches WHERE rn = 1) = 'loss' THEN 
                -COALESCE((SELECT MAX(streak_count) FROM streak_calc), 0)
            ELSE 0
        END
    INTO current_streak_value;

    -- 最高連勝記録を計算
    WITH match_sequence AS (
        SELECT 
            result,
            ROW_NUMBER() OVER (ORDER BY match_date, created_at) as rn
        FROM matches 
        WHERE user_id = user_id_param
    ),
    win_groups AS (
        SELECT 
            result,
            rn,
            rn - ROW_NUMBER() OVER (ORDER BY rn) as grp
        FROM match_sequence
        WHERE result = 'win'
    ),
    win_streaks AS (
        SELECT COUNT(*) as streak_length
        FROM win_groups
        GROUP BY grp
    )
    SELECT COALESCE(MAX(streak_length), 0)
    INTO best_win_streak_value
    FROM win_streaks;

    -- 最悪連敗記録を計算
    WITH match_sequence AS (
        SELECT 
            result,
            ROW_NUMBER() OVER (ORDER BY match_date, created_at) as rn
        FROM matches 
        WHERE user_id = user_id_param
    ),
    loss_groups AS (
        SELECT 
            result,
            rn,
            rn - ROW_NUMBER() OVER (ORDER BY rn) as grp
        FROM match_sequence
        WHERE result = 'loss'
    ),
    loss_streaks AS (
        SELECT COUNT(*) as streak_length
        FROM loss_groups
        GROUP BY grp
    )
    SELECT COALESCE(MAX(streak_length), 0)
    INTO worst_loss_streak_value
    FROM loss_streaks;

    -- user_statsに結果を保存（UPSERT）
    INSERT INTO user_stats (
        user_id, 
        total_matches, 
        total_wins, 
        total_draws, 
        total_losses,
        current_streak,
        best_win_streak,
        worst_loss_streak,
        updated_at
    ) VALUES (
        user_id_param,
        total_matches_count,
        total_wins_count,
        total_draws_count,
        total_losses_count,
        current_streak_value,
        best_win_streak_value,
        worst_loss_streak_value,
        NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        total_matches = EXCLUDED.total_matches,
        total_wins = EXCLUDED.total_wins,
        total_draws = EXCLUDED.total_draws,
        total_losses = EXCLUDED.total_losses,
        current_streak = EXCLUDED.current_streak,
        best_win_streak = EXCLUDED.best_win_streak,
        worst_loss_streak = EXCLUDED.worst_loss_streak,
        updated_at = EXCLUDED.updated_at;
END;
$ LANGUAGE plpgsql;

-- 統計更新トリガー関数
CREATE OR REPLACE FUNCTION trigger_recalculate_user_stats()
RETURNS TRIGGER AS $
BEGIN
    -- INSERT/UPDATE の場合は NEW.user_id を使用
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM recalculate_user_stats(NEW.user_id);
        
        -- UPDATEの場合、user_idが変更されていたら古いuser_idの統計も更新
        IF TG_OP = 'UPDATE' AND OLD.user_id != NEW.user_id THEN
            PERFORM recalculate_user_stats(OLD.user_id);
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- DELETE の場合は OLD.user_id を使用
    IF TG_OP = 'DELETE' THEN
        PERFORM recalculate_user_stats(OLD.user_id);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$ LANGUAGE plpgsql;

-- 統計更新トリガー
CREATE TRIGGER matches_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalculate_user_stats();

-- デフォルトフォーメーション作成関数
CREATE OR REPLACE FUNCTION create_default_formation(p_user_id UUID)
RETURNS UUID AS $
DECLARE
  v_formation_id UUID;
BEGIN
  -- デフォルトフォーメーションを作成
  INSERT INTO formations (user_id, name, formation_pattern, is_default)
  VALUES (p_user_id, 'デフォルト', '4-4-2', true)
  RETURNING id INTO v_formation_id;
  
  RETURN v_formation_id;
END;
$ LANGUAGE plpgsql;