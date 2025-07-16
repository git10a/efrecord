-- Shinji Nasuのチーム状況を詳しく調査するSQL

-- 1. すべてのチームの詳細を確認
SELECT 
  o.id,
  o.name,
  o.created_by,
  o.created_at,
  p.display_name as owner_name
FROM opponents o
LEFT JOIN profiles p ON o.created_by = p.id
ORDER BY o.name, o.created_at;

-- 2. 同じ名前のチームがあるかチェック
SELECT 
  name,
  COUNT(*) as count,
  array_agg(id) as team_ids,
  array_agg(created_by) as user_ids
FROM opponents 
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 3. Shinji Nasuが持つチームの詳細
SELECT 
  o.id,
  o.name,
  o.created_by,
  o.created_at,
  COUNT(m.id) as match_count
FROM opponents o
LEFT JOIN matches m ON o.id = m.opponent_id
WHERE o.created_by = '7503876b-d516-455c-bff0-7dd33c3c04aa'  -- Shinji Nasu
GROUP BY o.id, o.name, o.created_by, o.created_at
ORDER BY o.created_at;

-- 4. ハンバーガーという名前のチームをすべて確認
SELECT 
  o.id,
  o.name,
  o.created_by,
  o.created_at,
  p.display_name as owner_name,
  COUNT(m.id) as match_count
FROM opponents o
LEFT JOIN profiles p ON o.created_by = p.id
LEFT JOIN matches m ON o.id = m.opponent_id
WHERE o.name = 'ハンバーガー'
GROUP BY o.id, o.name, o.created_by, o.created_at, p.display_name
ORDER BY o.created_at;

-- 5. 各ユーザーのチーム数を再確認
SELECT 
  p.display_name,
  COUNT(o.id) as team_count,
  array_agg(o.name) as team_names
FROM profiles p
LEFT JOIN opponents o ON p.id = o.created_by
GROUP BY p.id, p.display_name
ORDER BY p.created_at DESC; 