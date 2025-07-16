-- 古いハンバーガーチームを強制的に削除するSQL

-- 1. 両方のハンバーガーチームの試合記録を確認
SELECT 
  'Old hamburger team (2e760cd7)' as info,
  COUNT(*) as match_count
FROM matches 
WHERE opponent_id = '2e760cd7-fc2b-422b-a7d1-16d0556472a1'

UNION ALL

SELECT 
  'New hamburger team (f00c98cf)' as info,
  COUNT(*) as match_count
FROM matches 
WHERE opponent_id = 'f00c98cf-37d5-431b-8a2b-3f93e60afc23';

-- 2. 古いハンバーガーチームを強制的に削除
DELETE FROM opponents 
WHERE id = '2e760cd7-fc2b-422b-a7d1-16d0556472a1';

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