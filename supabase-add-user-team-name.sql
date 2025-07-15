-- user_statsテーブルに自分のチーム名カラムを追加
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS team_name TEXT DEFAULT 'マイチーム';

-- 既存のレコードにデフォルト値を設定
UPDATE user_stats SET team_name = 'マイチーム' WHERE team_name IS NULL;