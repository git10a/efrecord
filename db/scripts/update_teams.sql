-- 既存の対戦相手名を更新（削除せずに名前を変更）
UPDATE opponents SET name = 'ハンバーガー' WHERE name = '田中';
UPDATE opponents SET name = 'SOCCER' WHERE name = '佐藤';
UPDATE opponents SET name = 'ベガルタ仙台' WHERE name = '山田';
UPDATE opponents SET name = 'ぱるちゃんかわいい' WHERE name = '鈴木';

-- 足りない場合は追加
INSERT INTO opponents (name, created_by, is_shared) 
SELECT 'ハンバーガー', NULL, true
WHERE NOT EXISTS (SELECT 1 FROM opponents WHERE name = 'ハンバーガー');

INSERT INTO opponents (name, created_by, is_shared) 
SELECT 'SOCCER', NULL, true
WHERE NOT EXISTS (SELECT 1 FROM opponents WHERE name = 'SOCCER');

INSERT INTO opponents (name, created_by, is_shared) 
SELECT 'ベガルタ仙台', NULL, true
WHERE NOT EXISTS (SELECT 1 FROM opponents WHERE name = 'ベガルタ仙台');

INSERT INTO opponents (name, created_by, is_shared) 
SELECT 'ぱるちゃんかわいい', NULL, true
WHERE NOT EXISTS (SELECT 1 FROM opponents WHERE name = 'ぱるちゃんかわいい');

-- 連勝記録を正しく計算する関数を作成
CREATE OR REPLACE FUNCTION calculate_current_streak(user_id_param UUID)
RETURNS INTEGER AS $
DECLARE
  current_streak INTEGER := 0;
  match_result TEXT;
  last_result TEXT := '';
BEGIN
  -- 最新の試合から順に取得
  FOR match_result IN
    SELECT result 
    FROM matches 
    WHERE user_id = user_id_param 
    ORDER BY match_date DESC, created_at DESC
  LOOP
    IF last_result = '' THEN
      -- 最初の試合
      last_result := match_result;
      IF match_result = 'win' THEN
        current_streak := 1;
      ELSIF match_result = 'loss' THEN
        current_streak := -1;
      ELSE
        current_streak := 0;
      END IF;
    ELSE
      -- 連続している場合
      IF (last_result = 'win' AND match_result = 'win') THEN
        current_streak := current_streak + 1;
      ELSIF (last_result = 'loss' AND match_result = 'loss') THEN
        current_streak := current_streak - 1;
      ELSE
        -- 連続が途切れた
        EXIT;
      END IF;
    END IF;
  END LOOP;
  
  RETURN current_streak;
END;
$ LANGUAGE plpgsql;

-- 連勝記録計算を含む統計更新関数を修正
CREATE OR REPLACE FUNCTION update_user_stats_after_match()
RETURNS TRIGGER AS $
DECLARE
  calculated_streak INTEGER;
  best_win INTEGER := 0;
  worst_loss INTEGER := 0;
BEGIN
  -- 現在の連勝/連敗を計算
  calculated_streak := calculate_current_streak(NEW.user_id);
  
  -- 最高連勝記録と最悪連敗記録を計算
  SELECT 
    COALESCE(MAX(streak), 0),
    COALESCE(MIN(streak), 0)
  INTO best_win, worst_loss
  FROM (
    SELECT calculate_current_streak(NEW.user_id) as streak
    UNION ALL
    SELECT current_streak FROM user_stats WHERE user_id = NEW.user_id
    UNION ALL
    SELECT best_win_streak FROM user_stats WHERE user_id = NEW.user_id
    UNION ALL
    SELECT worst_loss_streak FROM user_stats WHERE user_id = NEW.user_id
  ) streaks;

  -- Insert or update user_stats
  INSERT INTO user_stats (
    user_id, total_matches, total_wins, total_draws, total_losses, 
    current_streak, best_win_streak, worst_loss_streak, last_match_date, updated_at
  )
  SELECT 
    NEW.user_id,
    COUNT(*),
    COUNT(*) FILTER (WHERE result = 'win'),
    COUNT(*) FILTER (WHERE result = 'draw'),
    COUNT(*) FILTER (WHERE result = 'loss'),
    calculated_streak,
    GREATEST(best_win, CASE WHEN calculated_streak > 0 THEN calculated_streak ELSE 0 END),
    LEAST(worst_loss, CASE WHEN calculated_streak < 0 THEN calculated_streak ELSE 0 END),
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
    best_win_streak = EXCLUDED.best_win_streak,
    worst_loss_streak = EXCLUDED.worst_loss_streak,
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
$ LANGUAGE plpgsql;