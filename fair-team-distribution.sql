-- チームを各ユーザーに公平に分配するSQL

-- 1. 現在の状況を確認
SELECT 
  p.display_name,
  COUNT(o.id) as team_count
FROM profiles p
LEFT JOIN opponents o ON p.id = o.created_by
GROUP BY p.id, p.display_name
ORDER BY p.created_at DESC;

-- 2. すべてのチームを一旦リセット（created_byをNULLに）
UPDATE opponents SET created_by = NULL;

-- 3. チームを各ユーザーに公平に分配
WITH team_assignments AS (
  SELECT 
    o.id as team_id,
    o.name,
    ROW_NUMBER() OVER (ORDER BY o.name) as team_rn,
    p.id as user_id,
    p.display_name,
    ROW_NUMBER() OVER (ORDER BY p.created_at) as user_rn,
    COUNT(*) OVER (ORDER BY p.created_at) as total_users
  FROM opponents o
  CROSS JOIN profiles p
),
distributed_teams AS (
  SELECT 
    ta.team_id,
    ta.user_id,
    ta.display_name
  FROM team_assignments ta
  WHERE ta.team_rn % ta.total_users = ta.user_rn - 1
    OR (ta.team_rn % ta.total_users = 0 AND ta.user_rn = ta.total_users)
)
UPDATE opponents 
SET created_by = dt.user_id
FROM distributed_teams dt
WHERE opponents.id = dt.team_id;

-- 4. まだ割り当てられていないチームを最初のユーザーに割り当て
UPDATE opponents 
SET created_by = (SELECT id FROM profiles ORDER BY created_at LIMIT 1)
WHERE created_by IS NULL;

-- 5. 確認用: 修正後の状況
SELECT 
  p.display_name,
  COUNT(o.id) as team_count
FROM profiles p
LEFT JOIN opponents o ON p.id = o.created_by
GROUP BY p.id, p.display_name
ORDER BY p.created_at DESC;

-- 6. チーム名と所有者の確認
SELECT 
  o.name,
  p.display_name as owner
FROM opponents o
JOIN profiles p ON o.created_by = p.id
ORDER BY o.name, p.display_name; 