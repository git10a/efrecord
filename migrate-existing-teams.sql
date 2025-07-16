-- 既存の共有チームを個人用に移行するSQL
-- 注意: このSQLは既存のデータを変更します。実行前にバックアップを取ってください。

-- 特定のユーザーIDに既存のチームを割り当てる例
-- 以下の 'YOUR_USER_ID' を実際のユーザーIDに置き換えてください

-- 例: 既存のチームを特定のユーザーに割り当て
UPDATE opponents 
SET created_by = 'YOUR_USER_ID' 
WHERE created_by IS NULL;

-- または、すべての既存チームを削除して新しく作成し直す場合
-- DELETE FROM opponents WHERE created_by IS NULL; 