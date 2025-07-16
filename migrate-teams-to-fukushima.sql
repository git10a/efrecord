-- 既存の共有チームを福島僚太ユーザーに割り当てるSQL
-- ユーザーID: c1d77fcc-1d18-4647-a47f-5601138240b7

-- 既存の共有チーム（created_byがNULL）を福島僚太ユーザーに割り当て
UPDATE opponents 
SET created_by = 'c1d77fcc-1d18-4647-a47f-5601138240b7' 
WHERE created_by IS NULL;

-- 確認用: 更新されたチームを確認
SELECT id, name, created_by, created_at 
FROM opponents 
ORDER BY created_at DESC;

-- 福島僚太ユーザーのチーム数を確認
SELECT COUNT(*) as team_count 
FROM opponents 
WHERE created_by = 'c1d77fcc-1d18-4647-a47f-5601138240b7'; 