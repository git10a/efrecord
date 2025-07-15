# eF record - イーフト対戦記録アプリ

イーフトウイニングイレブンの対戦記録を管理するWebアプリケーションです。

## 機能

- **試合記録**: 対戦相手、結果、スコア、試合日の記録
- **統計表示**: 勝率、連勝記録、最近の成績などの統計情報
- **チーム管理**: 対戦相手チームの登録・編集・削除
- **メモ機能**: 試合ごとのメモ記録と一覧表示
- **ユーザー認証**: Supabaseを使用した安全なユーザー管理

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **バックエンド**: Supabase (PostgreSQL + Auth)
- **状態管理**: TanStack Query (React Query)
- **言語**: TypeScript

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/git10a/efrecord.git
cd efrecord
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.local` ファイルを作成し、Supabaseの設定を追加:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. データベースのセットアップ

SupabaseのSQLエディタで以下のファイルを順番に実行:

1. `supabase-setup.sql` - 基本テーブル作成
2. `supabase-add-user-team-name.sql` - チーム名機能追加

### 5. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションにアクセスできます。

## データベース構造

- **profiles**: ユーザープロフィール
- **opponents**: 対戦相手チーム
- **matches**: 試合記録
- **user_stats**: ユーザー統計情報

## ライセンス

MIT License
