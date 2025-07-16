-- ユーザーIDを確認するSQL
-- このSQLを実行して、実際のユーザーIDを確認してください

-- プロフィールテーブルからユーザーIDを取得
SELECT id, username, display_name, created_at 
FROM profiles 
ORDER BY created_at DESC;

-- または、auth.usersテーブルから確認（管理者権限が必要）
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC; 