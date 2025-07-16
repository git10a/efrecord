-- 試合記録との関連を保ちながら、既存の共有チームを各ユーザーに移行するSQL

-- 1. 既存の共有チームとその試合記録を確認
SELECT 
  o.id as team_id,
  o.name as team_name,
  COUNT(m.id) as match_count
FROM opponents o
LEFT JOIN matches m ON o.id = m.opponent_id
WHERE o.created_by IS NULL
GROUP BY o.id, o.name
ORDER BY match_count DESC;

-- 2. 各ユーザーに同じチーム名のチームを作成（既存のチームは保持）
WITH shared_teams AS (
  SELECT DISTINCT name 
  FROM opponents 
  WHERE created_by IS NULL
),
all_users AS (
  SELECT id FROM profiles
)
INSERT INTO opponents (name, created_by, is_shared)
SELECT 
  st.name,
  au.id,
  false
FROM shared_teams st
CROSS JOIN all_users au
WHERE NOT EXISTS (
  SELECT 1 FROM opponents 
  WHERE name = st.name AND created_by = au.id
);

-- 3. 既存の共有チームを非共有に変更（削除せずに保持）
UPDATE opponents 
SET is_shared = false 
WHERE created_by IS NULL;

-- 4. 確認用: 各ユーザーのチーム数を確認
SELECT 
  p.display_name,
  COUNT(o.id) as team_count
FROM profiles p
LEFT JOIN opponents o ON p.id = o.created_by
GROUP BY p.id, p.display_name
ORDER BY p.created_at DESC;

-- 5. 試合記録との関連を確認
SELECT 
  'Total matches' as info,
  COUNT(*) as count
FROM matches
UNION ALL
SELECT 
  'Matches with shared teams' as info,
  COUNT(*) as count
FROM matches m
JOIN opponents o ON m.opponent_id = o.id
WHERE o.created_by IS NULL; 