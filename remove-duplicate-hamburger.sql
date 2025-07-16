-- Shinji Nasuの重複したハンバーガーチームを削除するSQL

-- 1. ハンバーガーチームの詳細を確認
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
WHERE o.name = 'ハンバーガー' AND o.created_by = '7503876b-d516-455c-bff0-7dd33c3c04aa'
GROUP BY o.id, o.name, o.created_by, o.created_at, p.display_name
ORDER BY o.created_at;

-- 2. 古い方のハンバーガーチームを削除（試合記録に関連していないもの）
WITH hamburger_teams AS (
  SELECT 
    id,
    created_at,
    ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM opponents 
  WHERE name = 'ハンバーガー' 
    AND created_by = '7503876b-d516-455c-bff0-7dd33c3c04aa'
)
DELETE FROM opponents 
WHERE id IN (
  SELECT id FROM hamburger_teams WHERE rn > 1
)
AND id NOT IN (
  SELECT DISTINCT opponent_id 
  FROM matches 
  WHERE opponent_id IS NOT NULL
);

-- 3. 確認用: 修正後の状況
SELECT 
  p.display_name,
  COUNT(o.id) as team_count,
  array_agg(o.name) as team_names
FROM profiles p
LEFT JOIN opponents o ON p.id = o.created_by
GROUP BY p.id, p.display_name
ORDER BY p.created_at DESC;

-- 4. ハンバーガーチームの最終確認
SELECT 
  o.id,
  o.name,
  o.created_by,
  o.created_at,
  p.display_name as owner_name
FROM opponents o
LEFT JOIN profiles p ON o.created_by = p.id
WHERE o.name = 'ハンバーガー'
ORDER BY o.created_at; 