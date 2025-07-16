-- フォーメーション機能のためのテーブル作成

-- 1. 選手テーブル
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

-- 2. フォーメーション設定テーブル
CREATE TABLE formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  formation_pattern VARCHAR(20) NOT NULL, -- 例: "4-4-2", "3-5-2"
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. フォーメーション内の選手配置テーブル
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

-- 4. 試合での得点記録テーブル
CREATE TABLE match_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  goal_time INTEGER, -- 得点時間（分）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_players_active ON players(is_active);
CREATE INDEX idx_formations_user_id ON formations(user_id);
CREATE INDEX idx_formations_default ON formations(is_default);
CREATE INDEX idx_formation_positions_formation_id ON formation_positions(formation_id);
CREATE INDEX idx_formation_positions_player_id ON formation_positions(player_id);
CREATE INDEX idx_match_goals_match_id ON match_goals(match_id);
CREATE INDEX idx_match_goals_player_id ON match_goals(player_id);

-- RLS ポリシー

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

-- デフォルトフォーメーション作成用の関数
CREATE OR REPLACE FUNCTION create_default_formation(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_formation_id UUID;
BEGIN
  -- デフォルトフォーメーションを作成
  INSERT INTO formations (user_id, name, formation_pattern, is_default)
  VALUES (p_user_id, 'デフォルト', '4-4-2', true)
  RETURNING id INTO v_formation_id;
  
  RETURN v_formation_id;
END;
$$ LANGUAGE plpgsql;

-- サンプルデータ挿入用の関数
CREATE OR REPLACE FUNCTION insert_sample_players(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_gk_id UUID;
  v_df1_id UUID;
  v_df2_id UUID;
  v_df3_id UUID;
  v_df4_id UUID;
  v_mf1_id UUID;
  v_mf2_id UUID;
  v_mf3_id UUID;
  v_mf4_id UUID;
  v_fw1_id UUID;
  v_fw2_id UUID;
  v_formation_id UUID;
BEGIN
  -- サンプル選手を挿入
  INSERT INTO players (user_id, name, position, number) VALUES
    (p_user_id, 'GK選手', 'GK', 1) RETURNING id INTO v_gk_id,
    (p_user_id, 'DF選手1', 'DF', 2) RETURNING id INTO v_df1_id,
    (p_user_id, 'DF選手2', 'DF', 3) RETURNING id INTO v_df2_id,
    (p_user_id, 'DF選手3', 'DF', 4) RETURNING id INTO v_df3_id,
    (p_user_id, 'DF選手4', 'DF', 5) RETURNING id INTO v_df4_id,
    (p_user_id, 'MF選手1', 'MF', 6) RETURNING id INTO v_mf1_id,
    (p_user_id, 'MF選手2', 'MF', 7) RETURNING id INTO v_mf2_id,
    (p_user_id, 'MF選手3', 'MF', 8) RETURNING id INTO v_mf3_id,
    (p_user_id, 'MF選手4', 'MF', 9) RETURNING id INTO v_mf4_id,
    (p_user_id, 'FW選手1', 'FW', 10) RETURNING id INTO v_fw1_id,
    (p_user_id, 'FW選手2', 'FW', 11) RETURNING id INTO v_fw2_id;
  
  -- デフォルトフォーメーションを作成
  SELECT create_default_formation(p_user_id) INTO v_formation_id;
  
  -- フォーメーション配置を挿入（4-4-2）
  INSERT INTO formation_positions (formation_id, player_id, position_x, position_y, display_position) VALUES
    (v_formation_id, v_gk_id, 50, 90, 'GK'),
    (v_formation_id, v_df1_id, 20, 70, 'SB'),
    (v_formation_id, v_df2_id, 35, 70, 'CB'),
    (v_formation_id, v_df3_id, 65, 70, 'CB'),
    (v_formation_id, v_df4_id, 80, 70, 'SB'),
    (v_formation_id, v_mf1_id, 20, 50, 'MF'),
    (v_formation_id, v_mf2_id, 35, 50, 'MF'),
    (v_formation_id, v_mf3_id, 65, 50, 'MF'),
    (v_formation_id, v_mf4_id, 80, 50, 'MF'),
    (v_formation_id, v_fw1_id, 35, 30, 'FW'),
    (v_formation_id, v_fw2_id, 65, 30, 'FW');
END;
$$ LANGUAGE plpgsql; 