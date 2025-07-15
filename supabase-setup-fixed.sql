-- 連勝/連敗数を計算する関数とuser_stats更新トリガーのみ抜粋

-- 連勝/連敗数を計算する関数
CREATE OR REPLACE FUNCTION calculate_current_streak(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  current_streak INTEGER := 0;
  match_result TEXT;
  last_result TEXT := '';
BEGIN
  FOR match_result IN
    SELECT result 
    FROM matches 
    WHERE user_id = user_id_param 
    ORDER BY match_date DESC, created_at DESC
  LOOP
    IF last_result = '' THEN
      last_result := match_result;
      IF match_result = 'win' THEN
        current_streak := 1;
      ELSIF match_result = 'loss' THEN
        current_streak := -1;
      ELSE
        current_streak := 0;
      END IF;
    ELSE
      IF (last_result = 'win' AND match_result = 'win') THEN
        current_streak := current_streak + 1;
      ELSIF (last_result = 'loss' AND match_result = 'loss') THEN
        current_streak := current_streak - 1;
      ELSE
        EXIT;
      END IF;
    END IF;
  END LOOP;
  RETURN current_streak;
END;
$$ LANGUAGE plpgsql;

-- user_statsを更新するトリガーでcurrent_streakを反映
CREATE OR REPLACE FUNCTION update_user_stats_after_match()
RETURNS TRIGGER AS $$
DECLARE
  calculated_streak INTEGER;
BEGIN
  calculated_streak := calculate_current_streak(NEW.user_id);

  INSERT INTO user_stats (
    user_id, total_matches, total_wins, total_draws, total_losses, current_streak, last_match_date, updated_at
  )
  SELECT 
    NEW.user_id,
    COUNT(*),
    COUNT(*) FILTER (WHERE result = 'win'),
    COUNT(*) FILTER (WHERE result = 'draw'),
    COUNT(*) FILTER (WHERE result = 'loss'),
    calculated_streak,
    MAX(match_date),
    NOW()
  FROM matches
  WHERE user_id = NEW.user_id
  ON CONFLICT (user_id) DO UPDATE SET
    total_matches = EXCLUDED.total_matches,
    total_wins = EXCLUDED.total_wins,
    total_draws = EXCLUDED.total_draws,
    total_losses = EXCLUDED.total_losses,
    current_streak = EXCLUDED.current_streak,
    last_match_date = EXCLUDED.last_match_date,
    updated_at = EXCLUDED.updated_at;

  -- opponent_statsの更新（既存処理）
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