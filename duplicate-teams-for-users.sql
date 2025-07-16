-- 既存の共有チームを各ユーザーに複製するSQL
-- 試合記録との関連を保ちながら、各ユーザーが自分のチームとして管理できるようにする

-- 既存の共有チーム名を取得
WITH shared_teams AS (
  SELECT DISTINCT name 
  FROM opponents 
  WHERE created_by IS NULL
),
all_users AS (
  SELECT id FROM profiles
)
-- 各ユーザーに同じチーム名のチームを作成
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

-- 既存の共有チームを削除（試合記録との関連は保持される）
DELETE FROM opponents WHERE created_by IS NULL;

-- 確認用: 各ユーザーのチーム数を確認
SELECT 
  p.display_name,
  COUNT(o.id) as team_count
FROM profiles p
LEFT JOIN opponents o ON p.id = o.created_by
GROUP BY p.id, p.display_name
ORDER BY p.created_at DESC; 