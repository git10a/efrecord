-- 既存の共有チームを個人用に移行するSQL（修正版）
-- 注意: このSQLは既存のデータを変更します。実行前にバックアップを取ってください。

-- 手順1: まずユーザーIDを確認
-- check-user-id.sql を実行して、実際のユーザーIDを取得してください

-- 手順2: 以下の 'ACTUAL_USER_ID_HERE' を実際のユーザーIDに置き換えて実行
-- 例: '12345678-1234-1234-1234-123456789abc'

-- 既存のチームを特定のユーザーに割り当て
UPDATE opponents 
SET created_by = 'ACTUAL_USER_ID_HERE' 
WHERE created_by IS NULL;

-- 確認用: 更新されたチームを確認
SELECT id, name, created_by, created_at 
FROM opponents 
ORDER BY created_at DESC; 