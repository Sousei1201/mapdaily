# ふらり旅のきろく

旅の思い出を地図上に記録できるWebアプリケーションです。訪れた場所を写真やコメントと共に記録し、地図上で可視化できます。

## 主な機能

- **地図表示**: Google Maps APIを使用した対話的な地図表示
- **現在地取得**: ブラウザの位置情報機能を使って現在地を自動取得
- **旅の記録**:
  - 現在地の位置情報（緯度・経度）
  - 住所の自動取得
  - 写真のアップロード
  - コメントの記録
  - 日時の記録
- **記録の可視化**: 記録した場所に肉球アイコンで表示
- **ホバー表示**: 肉球アイコンにマウスをホバーすると、写真やコメントをポップアップ表示
- **ユーザー認証**: Firebaseを使った安全なログイン機能
- **データ永続化**: Firestoreによるリアルタイムデータ同期
- **記録一覧**: ユーザーの記録を一覧表示（今後実装予定）

## 技術スタック

- **フレームワーク**: [Next.js](https://nextjs.org) 15.5.2 (App Router)
- **言語**: TypeScript 5
- **UIライブラリ**: React 19
- **地図**: [@vis.gl/react-google-maps](https://visgl.github.io/react-google-maps/) 1.5.4
- **マーカークラスタリング**: @googlemaps/markerclusterer 2.6.2
- **バックエンド**:
  - Firebase Authentication (ユーザー認証)
  - Cloud Firestore (データベース)
  - Cloud Storage (画像保存)
- **スタイリング**: CSS Modules

## 環境要件

- Node.js 20以上
- npm または yarn、pnpm、bun

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd mapdaily
```

### 2. 依存関係のインストール

```bash
npm install
# または
yarn install
# または
pnpm install
```

### 3. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下の環境変数を設定します:

```env
# Firebase設定
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Maps API設定
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your_map_id
```

#### Firebase設定の取得方法

1. [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成
2. プロジェクト設定から「全般」タブを開く
3. 「マイアプリ」セクションでWebアプリを追加
4. 表示される設定値を `.env.local` にコピー

#### Firebaseの必要な設定

- **Authentication**: メールアドレス/パスワード認証を有効化
- **Firestore Database**:
  - コレクション `travel-records` を作成
  - セキュリティルールを設定（例: 認証済みユーザーのみ読み書き可能）
- **Storage**:
  - パス `travel-images/{userId}/` に画像を保存
  - セキュリティルールを設定（例: 認証済みユーザーのみアップロード可能）

#### Google Maps API設定の取得方法

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成
2. Maps JavaScript APIを有効化
3. APIキーを作成
4. Map IDを作成（[Map Management](https://console.cloud.google.com/google/maps-apis/studio/maps)から）

### 4. 開発サーバーの起動

```bash
npm run dev
# または
yarn dev
# または
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認できます。

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm run start

# リント実行
npm run lint

# デバッグモード（Node.js Inspector使用）
npm run debug
```

## プロジェクト構成

```
mapdaily/
├── src/
│   └── app/
│       ├── components/          # Reactコンポーネント
│       │   ├── auth/           # 認証関連コンポーネント
│       │   │   ├── AuthProvider.tsx
│       │   │   └── LoginModal.tsx
│       │   └── map/            # 地図関連コンポーネント
│       │       └── Googlemap.tsx
│       ├── hooks/              # カスタムフック
│       │   ├── useAuth.tsx    # 認証フック
│       │   └── useRecords.tsx # 記録データフック
│       ├── lib/                # ユーティリティ
│       │   └── firebase.ts    # Firebase設定
│       ├── records/            # 記録一覧ページ
│       │   └── page.tsx
│       ├── layout.tsx          # ルートレイアウト
│       ├── page.tsx            # ホームページ
│       └── globals.css         # グローバルスタイル
├── public/                     # 静的ファイル
├── .env.local                  # 環境変数（要作成）
├── firebase.json               # Firebase設定
├── next.config.ts              # Next.js設定
├── tsconfig.json               # TypeScript設定
└── package.json                # 依存関係
```

## 使い方

1. **ログイン**: トップページの「ログイン」ボタンからログインします
2. **現在地確認**: 地図上に黄色いピンで現在地が表示されます
3. **記録作成**: 右下の「＋」ボタンをクリック
4. **情報入力**:
   - 画像を選択（任意）
   - 現在地の住所が自動表示
   - 日時が自動記録
   - コメントを入力（任意）
5. **保存**: 「記録を保存」ボタンで記録を保存
6. **記録確認**: 地図上の肉球アイコンにマウスをホバーすると詳細が表示されます
7. **記録一覧**: ヘッダーの「きろく一覧」から過去の記録を確認（今後実装予定）

## デプロイ

### Firebase Hosting

```bash
# Firebaseにログイン
firebase login

# プロジェクト初期化（初回のみ）
firebase init hosting

# ビルド
npm run build

# デプロイ
firebase deploy
```

### Vercel

Next.jsアプリケーションは[Vercel Platform](https://vercel.com/new)で簡単にデプロイできます。

詳細は[Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying)を参照してください。

## ライセンス

このプロジェクトはプライベートプロジェクトです。

## 今後の予定

- [ ] 記録一覧ページの完全実装
- [ ] 記録の編集・削除機能
- [ ] 記録の検索・フィルタリング機能
- [ ] カテゴリ別の記録分類
- [ ] ソーシャル共有機能