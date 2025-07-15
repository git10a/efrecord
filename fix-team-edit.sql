-- opponents テーブルの RLS ポリシーを確認・修正

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Opponents are viewable by everyone" ON opponents;
DROP POLICY IF EXISTS "Authenticated users can create opponents" ON opponents;

-- 新しいポリシーを作成
CREATE POLICY "Everyone can view opponents" 
  ON opponents FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create opponents" 
  ON opponents FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update opponents they created or shared ones" 
  ON opponents FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL AND 
    (created_by = auth.uid() OR is_shared = true)
  );

CREATE POLICY "Users can delete opponents they created" 
  ON opponents FOR DELETE 
  USING (
    auth.uid() IS NOT NULL AND 
    created_by = auth.uid()
  );