# frontディレクトリ
フロントエンドのファイルを格納するところです

## 実行方法
フロントのみ(デザインしたい場合に使用してね)
```bash
npm install
npm run dev
```

バックやインフラも合わせて実行する方法
```bash
docker compose up
```
Dockerfileをいじった場合やフロントファイルを変更した場合は以下のコマンドで実行してね
```bash
docker compose up --build
```

## ディレクトリ構成
```
.
├── Dockerfile
├── README.md
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── public
│     ├── file.svg
│     ├── globe.svg
│     ├── next.svg
│     ├── vercel.svg
│     └── window.svg
├── src
│    ├── app
│    │     ├── analyze // 分析APIを叩く & 分析結果と3Dモデルを表示するページ
│    │     │     └── page.tsx
│    │     ├── api
│    │     │     ├── analyze // 分析結果を取得する(Go APIを叩く)ためのAPI
│    │     │     │     └── route.ts
│    │     │     ├── fbx // fbxファイルをS3(localstack)ダウンロードするためのAPI
│    │     │     │     └── route.ts
│    │     │     ├── uploadImage // 分析対象画像をS3(localstack)にアップロードするためのAPI
│    │     │     │     └── route.ts
│    │     │     └── uploadProduct // [ローカル用] 表示する3Dモデル(fbxファイル)をS3(localstack)にアップロードするためのAPI
│    │     │         └── route.ts
│    │     ├── globals.css
│    │     ├── layout.tsx
│    │     ├── page.tsx // メインページ-画像アップロード処理
│    │     └── uploadProduct // [ローカル用]　3Dモデル(fbxファイル)をアップロードするページ
│    │         └── page.tsx
│    └── types
│         └── three-fbxloader.d.ts // three.jsを使うための型定義ファイル
└── tsconfig.json
```

## 注意点
- ローカル開発時，コンテナを落とした場合S3(localstack)のバケット，画像，3Dモデルは全て消えます．毎回バケット作成や画像，3Dモデルのアップロードをし直す必要があります．
  - 詳しくはリポジトリのルートのREADME.mdを参照してください．