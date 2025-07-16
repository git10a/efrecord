-- 既存の共有チームを削除するSQL
-- 注意: このSQLは既存のチームデータを完全に削除します
-- 関連する試合記録も削除される可能性があります

-- 削除前に確認
SELECT COUNT(*) as total_teams FROM opponents WHERE created_by IS NULL;
SELECT COUNT(*) as total_matches FROM matches m 
JOIN opponents o ON m.opponent_id = o.id 
WHERE o.created_by IS NULL;

-- 共有チームに関連する試合記録を削除
DELETE FROM matches 
WHERE opponent_id IN (
  SELECT id FROM opponents WHERE created_by IS NULL
);

-- 共有チームを削除
DELETE FROM opponents WHERE created_by IS NULL;

-- 確認
SELECT COUNT(*) as remaining_teams FROM opponents;
SELECT COUNT(*) as remaining_matches FROM matches; 