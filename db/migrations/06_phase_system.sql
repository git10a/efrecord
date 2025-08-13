-- フェーズ制システムの実装
-- 2025-01-XX

-- 1. phasesテーブルの作成
CREATE TABLE phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. matchesテーブルにphase_idカラムを追加
ALTER TABLE matches ADD COLUMN phase_id UUID REFERENCES phases(id);

-- 3. phase_statsテーブルの作成（フェーズ別統計）
CREATE TABLE phase_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES phases(id) ON DELETE CASCADE,
  matches INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, phase_id)
);

-- 4. インデックスの作成
CREATE INDEX idx_matches_phase_id ON matches(phase_id);
CREATE INDEX idx_phase_stats_user ON phase_stats(user_id);
CREATE INDEX idx_phase_stats_phase ON phase_stats(phase_id);
CREATE INDEX idx_phases_active ON phases(is_active);
CREATE INDEX idx_phases_dates ON phases(start_date, end_date);

-- 5. 初期フェーズデータの挿入
-- フェーズ1: 今日までの記録（既存データ用）
INSERT INTO phases (name, start_date, end_date, is_active) 
VALUES ('フェーズ1', '2020-01-01', CURRENT_DATE, true);

-- フェーズ2: 2025/08/14から4週間（木曜始まり木曜終わり）
INSERT INTO phases (name, start_date, end_date, is_active) 
VALUES ('フェーズ2', '2025-08-14', '2025-09-11', false);

-- 6. 既存の試合記録をフェーズ1に割り当て
UPDATE matches SET phase_id = (SELECT id FROM phases WHERE name = 'フェーズ1' LIMIT 1)
WHERE phase_id IS NULL;

-- 7. フェーズ別統計の初期化（既存データ用）
INSERT INTO phase_stats (user_id, phase_id, matches, wins, draws, losses, goals_for, goals_against)
SELECT 
  m.user_id,
  p.id as phase_id,
  COUNT(*) as matches,
  COUNT(*) FILTER (WHERE m.result = 'win') as wins,
  COUNT(*) FILTER (WHERE m.result = 'draw') as draws,
  COUNT(*) FILTER (WHERE m.result = 'loss') as losses,
  SUM(m.user_score) as goals_for,
  SUM(m.opponent_score) as goals_against
FROM matches m
JOIN phases p ON p.name = 'フェーズ1'
GROUP BY m.user_id, p.id;

-- 8. フェーズ管理用の関数
CREATE OR REPLACE FUNCTION create_next_phase()
RETURNS UUID AS $$
DECLARE
  v_last_phase phases%ROWTYPE;
  v_new_phase_id UUID;
  v_new_start_date DATE;
  v_new_end_date DATE;
BEGIN
  -- 最新のフェーズを取得
  SELECT * INTO v_last_phase 
  FROM phases 
  ORDER BY end_date DESC 
  LIMIT 1;
  
  -- 次のフェーズの開始日と終了日を計算（木曜始まり木曜終わり）
  v_new_start_date := v_last_phase.end_date + INTERVAL '1 day';
  v_new_end_date := v_new_start_date + INTERVAL '4 weeks' - INTERVAL '1 day';
  
  -- 新しいフェーズを作成
  INSERT INTO phases (name, start_date, end_date, is_active)
  VALUES (
    'フェーズ' || (COALESCE(SUBSTRING(v_last_phase.name FROM 'フェーズ(\d+)'), '0')::INTEGER + 1),
    v_new_start_date,
    v_new_end_date,
    false
  ) RETURNING id INTO v_new_phase_id;
  
  -- 前のフェーズを非アクティブにする
  UPDATE phases SET is_active = false WHERE id = v_last_phase.id;
  
  RETURN v_new_phase_id;
END;
$$ LANGUAGE plpgsql;

-- 9. フェーズ別統計更新関数
CREATE OR REPLACE FUNCTION update_phase_stats(p_user_id UUID, p_phase_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO phase_stats (
    user_id, phase_id, matches, wins, draws, losses, goals_for, goals_against
  )
  SELECT 
    p_user_id,
    p_phase_id,
    COUNT(*) as matches,
    COUNT(*) FILTER (WHERE result = 'win') as wins,
    COUNT(*) FILTER (WHERE result = 'draw') as draws,
    COUNT(*) FILTER (WHERE result = 'loss') as losses,
    SUM(user_score) as goals_for,
    SUM(opponent_score) as goals_against
  FROM matches
  WHERE user_id = p_user_id AND phase_id = p_phase_id
  ON CONFLICT (user_id, phase_id) DO UPDATE SET
    matches = EXCLUDED.matches,
    wins = EXCLUDED.wins,
    draws = EXCLUDED.draws,
    losses = EXCLUDED.losses,
    goals_for = EXCLUDED.goals_for,
    goals_against = EXCLUDED.goals_against,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 10. 試合記録後のフェーズ統計更新トリガー
CREATE OR REPLACE FUNCTION trigger_update_phase_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- フェーズ別統計を更新
  PERFORM update_phase_stats(NEW.user_id, NEW.phase_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_phase_stats_after_match
  AFTER INSERT OR UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_phase_stats();

-- 11. 現在のフェーズを取得する関数
CREATE OR REPLACE FUNCTION get_current_phase()
RETURNS phases AS $$
DECLARE
  v_current_phase phases%ROWTYPE;
BEGIN
  SELECT * INTO v_current_phase
  FROM phases
  WHERE is_active = true
  LIMIT 1;
  
  RETURN v_current_phase;
END;
$$ LANGUAGE plpgsql;
