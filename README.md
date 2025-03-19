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
- **go:** 
DBへのCRUD操作やPythonAPIを叩くロジック(Goのバックエンド)のディレクトリ
- **python:**
顔認識や表情分析ロジック(Pythonのバックエンド)のディレクトリ
- **sql:**
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
(はじめにlogoを認識する画面が出ますが，認識ロジックがうまく動作しないのでスキップして http://localhost:3000/uploadImage にアクセスしてください)
1. フロントエンドで画像をlocalstack(S3)にアップロードする．
2. フロントエンドからバックエンド(Go)に画像ファイル名とS3バケット名を送る
3. バックエンド(Go)は画像ファイル名とS3バケット名を受け取り，バックエンド(Python)に画像ファイル名とS3バケット名を送信する．
4. バックエンド(Python)は画像ファイル名とS3バケット名を受け取り，S3から画像をダウンロードして，顔検出と感情分析を行う．
5. バックエンド(Python)は顔検出と感情分析の結果をGoに返す．
6. バックエンド(Go)は顔検出と感情分析の結果をDBに格納して顔検出と感情分析の結果と表示する3Dモデル(fbx)名をフロントエンドに返す．
7. フロントエンドはバックエンド(Go)からの顔検出と感情分析の結果を取得して，Three.js(AR)で3Dモデルを表示する．

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
docker compose exec mysql mysql -u user -p
```
パスワードは`password`です
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
http://localhost:3000/ にアクセスして開始してください．(現在はロゴ認識画面をスキップして http://localhost:3000/uploadImage にアクセスしてください)


## 注意点
- DBに格納するだけでDBのデータは活用できていないのでデータ活用は考えたい
- S3に画像データを格納してどのように活用するのか．今のところ1回の試行でしか利用できていない
- フロントエンドのデザインがシンプルすぎるので，デザインを考えたい
- 3Dモデルは表示しているのみなので，3Dモデルを活用する方法を考えたい
- 初めにロゴを読み込むロジックを作成する必要がある