# Design Document

## Overview

この設計書は、「Today's Epic Player」機能をソシャゲのガチャのような演出に変更するための詳細な設計を提供します。ユーザーがボタンを押すことでランダムに選手を表示する機能を実装し、エンゲージメントを高める楽しい体験を提供します。

## Architecture

現在の「Today's Epic Player」機能は、日付に基づいて毎日同じ選手を表示する静的な実装になっています。新しいガチャ機能では、以下のアーキテクチャ変更を行います：

1. **クライアントサイドの状態管理**:
   - React の useState フックを使用して、ガチャの状態（初期状態、アニメーション中、結果表示）を管理
   - ユーザーごとに異なるランダム選手を表示するためのロジック

2. **アニメーション処理**:
   - CSS アニメーションとトランジションを使用したガチャ演出
   - React の useEffect フックを使用したアニメーションのタイミング制御

3. **データフロー**:
   - Supabase からプレイヤーデータを取得（既存の実装を活用）
   - ユーザー ID と現在時刻を組み合わせたランダム選択ロジック

## Components and Interfaces

### 1. GachaButton コンポーネント

```typescript
interface GachaButtonProps {
  onClick: () => void;
  isLoading: boolean;
}
```

ガチャを引くためのボタンコンポーネント。アニメーション中は無効化され、視覚的なフィードバックを提供します。

### 2. GachaAnimation コンポーネント

```typescript
interface GachaAnimationProps {
  isPlaying: boolean;
  onComplete: () => void;
}
```

ガチャのアニメーション表示を担当するコンポーネント。アニメーション完了時にコールバックを呼び出します。

### 3. PlayerReveal コンポーネント

```typescript
interface PlayerRevealProps {
  player: Player | null;
  isRevealing: boolean;
}
```

選手情報の表示を担当するコンポーネント。現在の実装を拡張し、アニメーション効果を追加します。

### 4. GachaPlayerFeature コンポーネント（メインコンポーネント）

```typescript
interface GachaPlayerFeatureProps {
  userId: string;
}
```

ガチャ機能全体を統合するメインコンポーネント。状態管理とサブコンポーネントの調整を行います。

## Data Models

既存の Player インターフェースを使用します：

```typescript
interface Player {
  id: number;
  name: string;
  position: string;
  country: string;
  episode: string;
}
```

## ガチャロジック

### ランダム選手選択

```typescript
const getRandomPlayer = (players: Player[], userId: string): Player => {
  if (!players || players.length === 0) return null;
  
  // ユーザーIDと現在時刻を組み合わせてシード値を生成
  const now = new Date();
  const timeComponent = now.getTime();
  const userComponent = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // シード値を使用してランダムインデックスを生成
  const seed = (timeComponent + userComponent) % 10000;
  const randomIndex = seed % players.length;
  
  return players[randomIndex];
};
```

## Error Handling

1. **データ取得エラー**:
   - プレイヤーデータの取得に失敗した場合、エラーメッセージを表示
   - リトライ機能を提供

2. **アニメーション失敗**:
   - アニメーションの実行に問題がある場合、フォールバックとして直接結果を表示

## Testing Strategy

1. **ユニットテスト**:
   - 各コンポーネントの個別テスト
   - ランダム選択ロジックのテスト（異なるユーザーIDで異なる結果が得られることを確認）

2. **インテグレーションテスト**:
   - コンポーネント間の連携テスト
   - アニメーションの流れと状態遷移のテスト

3. **ユーザビリティテスト**:
   - 実際のユーザーによるガチャ体験のテスト
   - アニメーションの長さと満足度の評価

## UI/UX Design

### ガチャボタン
- 大きく目立つデザイン
- クリック時に押下感のあるアニメーション
- アニメーション中は無効化され、視覚的にフィードバック

### ガチャアニメーション
- 2-3秒の長さのアニメーション
- 回転/フラッシュエフェクト
- サウンドエフェクト（オプション）

### 選手表示
- 現在の表示を拡張
- 選手情報が徐々に表示されるフェードインアニメーション
- 「もう一度引く」ボタンの追加

## 技術的考慮事項

1. **パフォーマンス**:
   - アニメーションはクライアントサイドで処理し、サーバー負荷を最小限に
   - 必要に応じてプレイヤーデータをキャッシュ

2. **アクセシビリティ**:
   - アニメーションの無効化オプション
   - キーボードナビゲーションのサポート

3. **モバイル対応**:
   - タッチインタラクションの最適化
   - 画面サイズに応じたレスポンシブデザイン