-- 重複したチームを修正するSQL

-- 1. 現在の状況を確認
SELECT 
  name,
  COUNT(*) as count,
  array_agg(created_by) as user_ids
FROM opponents 
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. 各ユーザーに1つずつチームを割り当て（重複を削除）
-- 既存の共有チーム（created_by IS NULL）を各ユーザーに1つずつ割り当て
WITH user_assignments AS (
  SELECT 
    o.id as team_id,
    o.name,
    ROW_NUMBER() OVER (PARTITION BY o.name ORDER BY o.created_at) as rn,
    p.id as user_id
  FROM opponents o
  CROSS JOIN profiles p
  WHERE o.created_by IS NULL
)
UPDATE opponents 
SET created_by = ua.user_id
FROM user_assignments ua
WHERE opponents.id = ua.team_id 
  AND ua.rn = 1;

-- 3. 残りの重複チームを削除（試合記録に関連していないもの）
DELETE FROM opponents 
WHERE created_by IS NULL 
  AND id NOT IN (
    SELECT DISTINCT opponent_id FROM matches WHERE opponent_id IS NOT NULL
  );

-- 4. 確認用: 修正後の状況
SELECT 
  name,
  COUNT(*) as count,
  array_agg(created_by) as user_ids
FROM opponents 
GROUP BY name
ORDER BY count DESC;

-- 5. 各ユーザーのチーム数を確認
SELECT 
  p.display_name,
  COUNT(o.id) as team_count
FROM profiles p
LEFT JOIN opponents o ON p.id = o.created_by
GROUP BY p.id, p.display_name
ORDER BY p.created_at DESC;