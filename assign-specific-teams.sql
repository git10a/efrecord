-- 各ユーザーに特定のチームを割り当てるSQL

-- 1. 現在の状況を確認
SELECT 
  p.display_name,
  o.name as team_name,
  o.created_by
FROM profiles p
LEFT JOIN opponents o ON p.id = o.created_by
ORDER BY p.created_at DESC;

-- 2. すべてのチームを一旦リセット
UPDATE opponents SET created_by = NULL;

-- 3. 各ユーザーに特定のチームを割り当て
UPDATE opponents 
SET created_by = 'c1d77fcc-1d18-4647-a47f-5601138240b7'  -- 福島僚太
WHERE name = 'ぱるちゃんかわいい';

UPDATE opponents 
SET created_by = 'cac17d9c-e21d-4070-a2a3-cd844090cd6a'  -- 4round_comic (Daigo)
WHERE name = 'ベガルタ仙台';

UPDATE opponents 
SET created_by = 'c6380d40-9743-4385-8884-6929186cb0b6'  -- 井村圭佑
WHERE name = 'SOCCER';

UPDATE opponents 
SET created_by = '7503876b-d516-455c-bff0-7dd33c3c04aa'  -- Shinji Nasu
WHERE name = 'ハンバーガー';

UPDATE opponents 
SET created_by = '9f010959-8302-4c2f-88eb-3c25448f29d1'  -- Tomoki Hirata
WHERE name = 'バスケなら僅差';

-- 4. 確認用: 割り当て後の状況
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