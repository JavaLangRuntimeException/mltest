# frontディレクトリ
フロントエンドのファイルを格納するところです

## 担当者
- 前野
- 熊沢
- やまちゃん
- 仮屋薗

| 担当者　  | 内容                                                                                                                                                |
|-------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| 前野    | ReactThreeFiberを用いたグラフィックスの実装、UIデザイン                                                                                                              |
| 熊沢    | Next.jsのロジック、モデリング                                                                                                                                |
| やまちゃん | BFFの実装。位置情報を取得して画像をアップロードするロジックとロゴの画像をアップロードするロジック<br/>ロゴ認識が成功した際に、位置情報を送信するロジック（これはAPI実装そのものが未完成状態）<br/>- [task分割](./task/README.md)のF08とF09の1-3 |
| 仮屋薗   | Next.jsの設定、UIコンポーネント作成、ARのためのカメラとセンサ周りロジック                                                                                                        |

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

## 注意点
- ローカル開発時，コンテナを落とした場合S3(localstack)のバケット，画像，3Dモデルは全て消えます．毎回バケット作成や画像，3Dモデルのアップロードをし直す必要があります．
  - 詳しくはリポジトリのルートのREADME.mdを参照してください．