-- 最終的なチーム状況を確認するSQL

-- 各ユーザーのチーム数を確認
SELECT 
  p.display_name,
  COUNT(o.id) as team_count,
  array_agg(o.name) as team_names
FROM profiles p
LEFT JOIN opponents o ON p.id = o.created_by
GROUP BY p.id, p.display_name
ORDER BY p.created_at DESC;

-- 全チームの詳細確認
SELECT 
  o.name,
  p.display_name as owner,
  o.created_at
FROM opponents o
JOIN profiles p ON o.created_by = p.id
ORDER BY o.name;

-- 試合記録の確認
SELECT 
  'Total matches' as info,
  COUNT(*) as count
FROM matches

UNION ALL

SELECT 
  'Matches with hamburger team' as info,
  COUNT(*) as count
FROM matches m
JOIN opponents o ON m.opponent_id = o.id
WHERE o.name = 'ハンバーガー'; 