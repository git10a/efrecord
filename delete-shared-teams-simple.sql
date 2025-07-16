-- 既存の共有チームを削除するSQL
-- 各ユーザーが新しくチームを作成できるようにする

-- 既存の共有チーム（created_byがNULL）を削除
DELETE FROM opponents 
WHERE created_by IS NULL;

-- 確認用: 残っているチームを確認
SELECT id, name, created_by, created_at 
FROM opponents 
ORDER BY created_at DESC;

-- 各ユーザーのチーム数を確認
SELECT 
  p.display_name,
  COUNT(o.id) as team_count
FROM profiles p
LEFT JOIN opponents o ON p.id = o.created_by
GROUP BY p.id, p.display_name
ORDER BY p.created_at DESC; 