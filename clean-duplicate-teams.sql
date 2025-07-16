-- 重複チームを完全に削除するSQL

-- 1. 現在の状況を確認
SELECT 
  name,
  COUNT(*) as count,
  array_agg(created_by) as user_ids
FROM opponents 
GROUP BY name
ORDER BY count DESC;

-- 2. 各チーム名につき1つずつチームを残し、他を削除
-- 試合記録に関連するチームは保持
WITH teams_to_keep AS (
  SELECT DISTINCT ON (name) id
  FROM opponents
  ORDER BY name, created_at
),
teams_to_delete AS (
  SELECT o.id
  FROM opponents o
  WHERE o.id NOT IN (SELECT id FROM teams_to_keep)
    AND o.id NOT IN (
      SELECT DISTINCT opponent_id 
      FROM matches 
      WHERE opponent_id IS NOT NULL
    )
)
DELETE FROM opponents 
WHERE id IN (SELECT id FROM teams_to_delete);

-- 3. 残ったチームを各ユーザーに1つずつ割り当て
WITH team_assignments AS (
  SELECT 
    o.id as team_id,
    o.name,
    ROW_NUMBER() OVER (ORDER BY o.name) as rn,
    p.id as user_id,
    ROW_NUMBER() OVER (ORDER BY p.created_at) as user_rn
  FROM opponents o
  CROSS JOIN profiles p
  WHERE o.created_by IS NULL
)
UPDATE opponents 
SET created_by = ta.user_id
FROM team_assignments ta
WHERE opponents.id = ta.team_id 
  AND ta.rn = ta.user_rn;

-- 4. まだ割り当てられていないチームを最初のユーザーに割り当て
UPDATE opponents 
SET created_by = (SELECT id FROM profiles ORDER BY created_at LIMIT 1)
WHERE created_by IS NULL;

-- 5. 確認用: 修正後の状況
SELECT 
  name,
  COUNT(*) as count,
  array_agg(created_by) as user_ids
FROM opponents 
GROUP BY name
ORDER BY count DESC;

-- 6. 各ユーザーのチーム数を確認
SELECT 
  p.display_name,
  COUNT(o.id) as team_count
FROM profiles p
LEFT JOIN opponents o ON p.id = o.created_by
GROUP BY p.id, p.display_name
ORDER BY p.created_at DESC; 