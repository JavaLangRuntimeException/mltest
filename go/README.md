# バックエンド(Go) 
データベースにCRUD操作を行ったり，PythonAPIを叩くためのAPIを提供するバックエンドのディレクトリ．

## 担当
- レイヤ
- 梶原くん
- zawa
- ちょり

| 担当者    | 内容                                                   |
|--------|------------------------------------------------------|
| レイヤ    | Python連携部分（API通信・データ構造整備）、LogoRecognitionUsecase     |
| 梶原くん   | EmotionAnalysisUsecase実装（セッション/DB/GoogleAPI/レスポンス構築） |
| zawaくん | GetARIceUsecase実装（DB集計/セッション制御/レスポンス構築）              |
| ちょり    | 共通基盤（ユニットテスト、モック）                                    |

## 実行方法
GoAPIのみ実行する方法
```bash
go mod tidy
go run main.go
```
フロントやPythonAPIやインフラと共に実行する方法
```bash
docker compose up
```
docker composeの初回実行時
```bash
docker compose up --build
```

## main.go
バックエンドのエントリーポイント．APIのルーティングを記述している．また，Echoでサーバーを立ち上げている．