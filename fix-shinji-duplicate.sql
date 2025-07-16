-- Shinji Nasuの重複チームを修正するSQL

-- 1. 現在の状況を確認
SELECT 
  p.display_name,
  o.name as team_name,
  o.id as team_id,
  o.created_by
FROM profiles p
LEFT JOIN opponents o ON p.id = o.created_by
ORDER BY p.created_at DESC;

-- 2. Shinji Nasuが持つチームを確認
SELECT 
  o.id,
  o.name,
  o.created_by,
  o.created_at
FROM opponents o
WHERE o.created_by = '7503876b-d516-455c-bff0-7dd33c3c04aa'  -- Shinji Nasu
ORDER BY o.created_at;

-- 3. 重複したチームを削除（試合記録に関連していないもの）
-- ハンバーガー以外のチームを削除
DELETE FROM opponents 
WHERE created_by = '7503876b-d516-455c-bff0-7dd33c3c04aa'  -- Shinji Nasu
  AND name != 'ハンバーガー'
  AND id NOT IN (
    SELECT DISTINCT opponent_id 
    FROM matches 
    WHERE opponent_id IS NOT NULL
  );

-- 4. 確認用: 修正後の状況
SELECT 
  p.display_name,
  o.name as team_name,
  o.created_by
FROM profiles p
LEFT JOIN opponents o ON p.id = o.created_by
ORDER BY p.created_at DESC;

-- 5. 各ユーザーのチーム数を確認
SELECT 
  p.display_name,
  COUNT(o.id) as team_count
FROM profiles p
LEFT JOIN opponents o ON p.id = o.created_by
GROUP BY p.id, p.display_name
ORDER BY p.created_at DESC; 