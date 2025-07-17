# Design Document

## Overview

このデザインドキュメントでは、eF recordプロジェクトのリファクタリング計画について詳細に説明します。現在のプロジェクトには多数の散らばったSQLファイル、未使用のコード、整理されていないファイル構造があり、保守性が低下しています。このリファクタリングでは、コードベースを整理し、保守性を向上させ、開発効率を高めることを目的としています。

## Architecture

リファクタリング後のプロジェクト構造は、Next.jsのベストプラクティスに従い、以下のような構成になります：

```
efrecord/
├── app/                    # Next.js App Router構造
│   ├── auth/               # 認証関連ページ
│   ├── matches/            # 試合記録関連ページ
│   ├── memos/              # メモ関連ページ
│   ├── teams/              # チーム管理関連ページ
│   ├── layout.tsx          # ルートレイアウト
│   └── page.tsx            # ホームページ（ダッシュボード）
├── components/             # 再利用可能なコンポーネント
│   ├── dashboard/          # ダッシュボード関連コンポーネント
│   ├── layout/             # レイアウト関連コンポーネント
│   ├── team/               # チーム関連コンポーネント
│   └── ui/                 # 汎用UIコンポーネント
├── lib/                    # ユーティリティ関数とサービス
│   ├── supabase/           # Supabase関連ユーティリティ
│   ├── hooks/              # カスタムReactフック
│   └── utils/              # 汎用ユーティリティ関数
├── public/                 # 静的ファイル
├── db/                     # データベース関連ファイル（新規作成）
│   ├── migrations/         # マイグレーションスクリプト
│   ├── scripts/            # 一時的なスクリプト
│   └── schema/             # スキーマ定義
├── types/                  # TypeScript型定義（新規作成）
└── config/                 # 設定ファイル（新規作成）
```

## Components and Interfaces

### 1. ディレクトリ構造の整理

現在のプロジェクトには、ルートディレクトリに多数のSQLファイルが散らばっています。これらを整理し、適切なディレクトリに配置します。

#### 新しいディレクトリ構造：

- **db/migrations/**: データベースマイグレーションファイル
  - 基本スキーマ作成（supabase-setup.sql）
  - 機能追加マイグレーション（supabase-add-user-team-name.sql, supabase-formation-setup.sql など）

- **db/scripts/**: 一時的なデータ修正スクリプト
  - データ修正スクリプト（fix-duplicate-teams.sql, migrate-teams-with-matches.sql など）

- **db/schema/**: スキーマ定義ファイル
  - 最新のスキーマ定義（database-design.md の内容を元にしたSQL）

### 2. コンポーネント整理

現在のコンポーネント構造を見直し、より論理的な構成に整理します。

#### 改善点：

- **components/ui/**: 汎用UIコンポーネントの整理
- **components/layout/**: レイアウト関連コンポーネントの整理
- **components/form/**: フォーム関連コンポーネントの追加（現在は散在している）

### 3. 型定義の整理

TypeScriptの型定義を整理し、一貫性のある型システムを構築します。

#### 新しい型定義構造：

- **types/supabase.ts**: Supabaseのデータベース型定義
- **types/api.ts**: API関連の型定義
- **types/components.ts**: コンポーネント関連の型定義

## Data Models

データモデルは既存のものを維持しますが、型定義を強化します。

### 主要データモデル：

```typescript
// types/supabase.ts
export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Opponent {
  id: string;
  name: string;
  created_by: string;
  is_shared: boolean;
  created_at: string;
}

export interface Match {
  id: string;
  user_id: string;
  opponent_id: string;
  user_score: number;
  opponent_score: number;
  result: 'win' | 'draw' | 'loss';
  match_date: string;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  user_id: string;
  total_matches: number;
  total_wins: number;
  total_draws: number;
  total_losses: number;
  current_streak: number;
  best_win_streak: number;
  worst_loss_streak: number;
  last_match_date: string | null;
  updated_at: string;
}

export interface OpponentStats {
  id: string;
  user_id: string;
  opponent_id: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  updated_at: string;
}
```

## Error Handling

エラーハンドリングを強化し、一貫性のあるエラー処理パターンを導入します。

### エラーハンドリング戦略：

1. **APIエラーハンドリング**:
   ```typescript
   // lib/utils/error.ts
   export class ApiError extends Error {
     status: number;
     
     constructor(message: string, status: number) {
       super(message);
       this.status = status;
       this.name = 'ApiError';
     }
   }
   
   export function handleSupabaseError(error: unknown): never {
     if (error instanceof Error) {
       throw new ApiError(error.message, 500);
     }
     throw new ApiError('Unknown error occurred', 500);
   }
   ```

2. **コンポーネントエラーハンドリング**:
   ```typescript
   // components/ui/error-boundary.tsx
   import { ErrorBoundary } from 'react-error-boundary';
   
   export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
     return (
       <ErrorBoundary
         fallbackRender={({ error }) => (
           <div className="error-container">
             <h2>エラーが発生しました</h2>
             <p>{error.message}</p>
           </div>
         )}
       >
         {children}
       </ErrorBoundary>
     );
   }
   ```

## Testing Strategy

テスト戦略を導入し、コードの品質を確保します。

### テスト戦略：

1. **単体テスト**:
   - ユーティリティ関数のテスト
   - カスタムフックのテスト

2. **コンポーネントテスト**:
   - UIコンポーネントのテスト
   - フォームコンポーネントのテスト

3. **統合テスト**:
   - ページレベルのテスト
   - APIルートのテスト

4. **E2Eテスト**:
   - 主要ユーザーフローのテスト

### テストツール：

- Jest: 単体テスト・統合テスト
- React Testing Library: コンポーネントテスト
- Cypress: E2Eテスト

## 設計上の決定事項

### 1. SQLファイルの整理

現在、ルートディレクトリに多数のSQLファイルが散在しています。これらを以下のように整理します：

1. **マイグレーションファイル**: データベーススキーマの変更を記録するファイル
   - `db/migrations/01_initial_schema.sql` (supabase-setup.sql から)
   - `db/migrations/02_add_user_team_name.sql` (supabase-add-user-team-name.sql から)
   - `db/migrations/03_formation_setup.sql` (supabase-formation-setup.sql から)

2. **スクリプトファイル**: 一時的なデータ修正や確認用のスクリプト
   - `db/scripts/fix_duplicate_teams.sql`
   - `db/scripts/migrate_teams.sql`

3. **スキーマファイル**: 最新のデータベーススキーマを定義するファイル
   - `db/schema/schema.sql`

### 2. 依存関係の整理

`package.json`の依存関係を見直し、未使用のパッケージを削除します。また、開発依存関係と実行時依存関係を明確に分離します。

### 3. 環境変数の整理

環境変数を整理し、`.env.local.example`を更新して必要な環境変数を明確にします。また、match-recorderディレクトリ内の重複した環境変数ファイルを削除します。

### 4. コードの一貫性

コードスタイルを統一し、命名規則を一貫させます。また、TypeScriptの型定義を強化し、型安全性を向上させます。

### 5. ディレクトリ構造の最適化

Next.jsのベストプラクティスに従い、ディレクトリ構造を最適化します。特に、`app`ディレクトリ内のルーティング構造を見直し、一貫性を確保します。