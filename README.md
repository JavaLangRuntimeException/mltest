# システム概要
画像をアップロードしてその画像に対して，顔検出をして，その顔に対して感情分析を行うシステムです．

# 使用技術
## フロントエンド
TypeScript
Next.js
Three.js

## バックエンド(Go)
Go
Gorm
Echo

## バックエンド(Python)
Python
Flask
OpenCV
DeepFace

## インフラ
Docker
localstack(S3)
MySQL

## ディレクトリ構成
```
.
├── Dockerfile
├── docker-compose.yml
├── README.md
├── front/
├── go/
├── python/
└── sql/
```
- **front/:** 
フロントエンドのディレクトリ
- **go/:** 
DBへのCRUD操作やPythonAPIを叩くロジック(Goのバックエンド)のディレクトリ
- **python/:**
顔認識や表情分析ロジック(Pythonのバックエンド)のディレクトリ
- **sql/:**
MySQLのDDLを格納しているディレクトリ

## docker-compose.yml
- **mysql:**
MySQLデータベース．ポート3306で動作し，永続化のためのボリュームが設定されている．
- **go:**
Goで書かれたバックエンドサービス．MySQLとPythonサービスに依存し，ポート8080で動作する．
- **python:**
Pythonで書かれたバックエンドサービス．MySQLに依存し，ポート8000で動作する．
- **localstack:**
AWSサービスのローカルスタック．S3サービスを提供し，ポート4566で動作する．
- **front:**
フロントエンドサービス．ポート3000で動作し，バックエンドやS3のエンドポイントを環境変数で設定している．

## システム動作の概要
1. フロントエンドにアクセスするとロゴ認識画面になるんで頑張って認識させてください(または http://localhost:3000/uploadImage にスキップしてもいいです)
2. フロントエンドで画像をアップロードする．
3. フロントエンドからバックエンド(Go)にエンコードした画像を送信する．
4. バックエンド(Go)はエンコードした画像を受け取り，バックエンド(Python)にエンコードした画像を送信する．
5. バックエンド(Python)はエンコードした画像を受け取り，顔検出と感情分析を行う．
6. バックエンド(Python)は顔検出と感情分析の結果をGoに返す．
7. バックエンド(Go)は顔検出と感情分析の結果をDBに格納して顔検出と感情分析の結果と表示する3Dモデル(fbx)名をフロントエンドに返す．
8. フロントエンドはバックエンド(Go)からの顔検出と感情分析の結果を取得して，Three.js(AR)でlocalstack(S3)から取得した3Dモデルを表示する．

## 実行方法
以下のコマンドでシステムを起動します．
```bash
docker compose up
```
docker composeの初回実行時は以下のコマンドを実行してください．
```bash
docker compose up --build
```
ここからはローカル開発時に**起動するたび**に行ってほしい準備です．
バケットの作成
```bash
docker compose exec localstack awslocal s3 mb s3://ml-test-image-bucket
docker compose exec localstack awslocal s3 mb s3://ml-test-product-bucket
```
テーブルの作成
```bash
docker compose exec mysql mysql -u user -P 3306 -ppassword
```
パスワードは`password`です(入力が求められた場合)
その後データベースがないならば
```bash
CREATE DATABASE mydb;
```
を実行し
```bash
use mydb;
```
を実行してからmltest/sql/内のsqlファイルを実行してください．

その後，
http://localhost:3000/uploadProduct にアクセスして3Dモデル(mltest/3dmodel/product1.fbx)をアップロードしてください．
その後，
http://localhost:3000/ にアクセスして開始してください．
(またはロゴ認識画面をスキップして http://localhost:3000/uploadImage にアクセスしてください)


## 注意点
- DBに格納するだけでDBのデータは活用できていないのでデータ活用は考えたい
- S3に画像データを格納してどのように活用するのか．今のところ1回の試行でしか利用できていない
- フロントエンドのデザインがシンプルすぎるので，デザインを考えたい
- 3Dモデルは表示しているのみなので，3Dモデルを活用する方法を考えたい
- 初めにロゴを読み込むロジックを作成する必要がある