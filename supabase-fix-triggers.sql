-- 既存のトリガーとファンクションを削除
DROP TRIGGER IF EXISTS match_stats_trigger ON matches;
DROP FUNCTION IF EXISTS update_user_stats();
DROP FUNCTION IF EXISTS calculate_streak(uuid);

-- 統計を完全に再計算する関数
CREATE OR REPLACE FUNCTION recalculate_user_stats(user_id_param UUID)
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql;

-- トリガー関数（INSERT、UPDATE、DELETE対応）
CREATE OR REPLACE FUNCTION trigger_recalculate_user_stats()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- トリガーを作成（INSERT、UPDATE、DELETE時に実行）
CREATE TRIGGER matches_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalculate_user_stats();

-- 既存のすべてのユーザーの統計を再計算
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT DISTINCT user_id FROM matches
    LOOP
        PERFORM recalculate_user_stats(user_record.user_id);
    END LOOP;
END $$;