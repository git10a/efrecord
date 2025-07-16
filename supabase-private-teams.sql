-- チーム一覧を個人専用にするためのSQL

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Everyone can view opponents" ON opponents;
DROP POLICY IF EXISTS "Authenticated users can create opponents" ON opponents;
DROP POLICY IF EXISTS "Users can update opponents they created or shared ones" ON opponents;
DROP POLICY IF EXISTS "Users can delete opponents they created" ON opponents;

-- 新しいポリシーを作成（個人専用）
CREATE POLICY "Users can view only their own opponents" 
  ON opponents FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND 
    created_by = auth.uid()
  );

CREATE POLICY "Authenticated users can create opponents" 
  ON opponents FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own opponents" 
  ON opponents FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL AND 
    created_by = auth.uid()
  );

CREATE POLICY "Users can delete their own opponents" 
  ON opponents FOR DELETE 
  USING (
    auth.uid() IS NOT NULL AND 
    created_by = auth.uid()
  ); 