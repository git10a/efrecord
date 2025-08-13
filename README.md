# eF record - イーフト対戦記録アプリ

イーフトウイニングイレブンの対戦記録を管理するWebアプリケーションです。

## 機能

- **試合記録**: 対戦相手、結果、スコア、試合日の記録
- **統計表示**: 勝率、連勝記録、最近の成績などの統計情報
- **チーム管理**: 対戦相手チームの登録・編集・削除
- **メモ機能**: 試合ごとのメモ記録と一覧表示
- **フェーズ制システム**: 4週間ごとの記録リセットとフェーズ別統計
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

1. `db/migrations/01_initial_schema.sql` - 基本テーブル作成
2. `db/migrations/02_add_user_team_name.sql` - チーム名機能追加
3. `db/migrations/06_phase_system.sql` - フェーズ制システム追加

### 5. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションにアクセスできます。

## データベース構造

- **profiles**: ユーザープロフィール
- **opponents**: 対戦相手チーム
- **matches**: 試合記録（フェーズ別）
- **user_stats**: ユーザー統計情報
- **phases**: フェーズ情報
- **phase_stats**: フェーズ別統計情報

## フェーズ制システム

このアプリでは、4週間（木曜始まり木曜終わり）ごとにフェーズが切り替わります。

### フェーズの定義
- **フェーズ1**: 今日までの記録（既存データ）
- **フェーズ2**: 2025/08/14から4週間
- **フェーズ3以降**: 同様の4週間サイクル

### 主な機能
- 現在のフェーズ記録の表示
- フェーズ別記録の確認
- 累計記録の確認
- フェーズ進捗の可視化

## ライセンス

MIT License
