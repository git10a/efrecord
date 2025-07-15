# EV Library - バレーボール試合記録システム

バレーボールの試合結果を記録・管理するためのWebアプリケーションです。

## 機能

- 試合結果の記録
- チーム統計の表示
- 勝率チャートの表示
- メモ機能
- ユーザー認証

## 技術スタック

- **フロントエンド**: Next.js 14, TypeScript, Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL, Auth, Real-time)
- **認証**: Supabase Auth
- **デプロイ**: Vercel

## セットアップ

1. リポジトリをクローン
```bash
git clone https://github.com/git10a/efrecord.git
cd efrecord
```

2. 依存関係をインストール
```bash
cd match-recorder
yarn install
```

3. 環境変数を設定
`.env.local`ファイルを作成し、Supabaseの設定を追加してください。

4. 開発サーバーを起動
```bash
yarn dev
```

## プロジェクト構造

```
evlibrary/
├── match-recorder/          # Next.jsアプリケーション
│   ├── app/                # App Router
│   ├── components/         # Reactコンポーネント
│   ├── lib/               # ユーティリティ関数
│   └── public/            # 静的ファイル
├── database-design.md      # データベース設計書
└── requirements.md         # 要件定義書
```

## ライセンス

MIT License 