# システム概要
画像をアップロードしてその画像に対して，顔検出をして，その顔に対して感情分析を行うシステムです．

# 使用技術
## フロントエンド
TypeScript
Next.js
Three.js
React?
Jotai

## バックエンド(Go)
Go
Gorm
Echo

## バックエンド(Python)
Python
Flask
OpenCV
DeepFace
Base64

## インフラ(ローカル)
Docker
localstack(S3)
MySQL

## インフラ(AWS)
ECS(Fargate)
ECR(Docker)
RDS(MySQL)
S3
CloudFront
Route53
ACM
CodePipeline

## 技術の詳しい説明
| 領域             | 技術             | 説明                                               |
|----------------|----------------|--------------------------------------------------|
| フロントエンド        | Next.js        | Reactをベースにしたフレームワークで，サーバーサイドレンダリングや静的サイト生成が可能    |
| フロントエンド        | Three.js       | Web上で3Dグラフィックスを描画するためのライブラリ                      |
| フロントエンド        | React          | コンポーネントベースでUIを構築するためのJavaScriptライブラリ             |
| フロントエンド        | Jotai          | React向けの軽量な状態管理ライブラリで、シンプルかつ柔軟な状態管理を実現する        |
| バックエンド(Go)     | Gorm           | Go言語用のORM（オブジェクト関係マッピング）ライブラリで、データベース操作を容易にする   |
| バックエンド(Go)     | Echo           | 軽量かつ高速なGoのWebフレームワークで、シンプルなルーティングやミドルウェア機能を提供する |
| バックエンド(Python) | Flask          | 軽量なWebフレームワークで、シンプルなWebアプリケーションの構築に適している         |
| バックエンド(Python) | OpenCV         | 画像処理やコンピュータビジョン向けの豊富な機能を持つライブラリ                  |
| バックエンド(Python) | DeepFace       | 顔認識や顔解析のためのディープラーニングライブラリ                        |
| バックエンド(Python) | Base64         | バイナリデータをASCII文字にエンコードするための規格・技術                  |
| インフラ(ローカル)     | Docker         | コンテナ技術を利用し、環境の一貫性を保ちながらアプリケーションをデプロイできる          |
| インフラ(ローカル)     | localstack(S3) | AWSサービス（特にS3など）をローカル環境で模擬・テストできるツール              |
| インフラ(ローカル)     | MySQL          | オープンソースのリレーショナルデータベースで、信頼性の高いデータ管理を提供する          |
| インフラ(AWS)      | ECS(Fargate)   | サーバーレスなコンテナオーケストレーションサービスで、コンテナの実行管理を簡便にする       |
| インフラ(AWS)      | ECR(Docker)    | Dockerイメージのためのマネージドコンテナレジストリ                     |
| インフラ(AWS)      | RDS(MySQL)     | MySQLを含む複数のデータベースエンジンに対応したマネージドなデータベースサービス       |
| インフラ(AWS)      | S3             | 高い耐久性とスケーラビリティを持つオブジェクトストレージサービス                 |
| インフラ(AWS)      | CloudFront     | グローバルなCDNサービスで、コンテンツ配信の高速化と最適化を実現する              |
| インフラ(AWS)      | Route53        | 高可用性のDNSおよびドメイン登録サービスを提供する                       |
| インフラ(AWS)      | ACM            | SSL/TLS証明書の発行・管理を自動化するサービスで、セキュリティを簡単に強化する       |
| インフラ(AWS)      | CodePipeline   | CI/CDパイプラインを構築し、継続的なデリバリーをサポートするサービス             |


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
顔認識や表情分析ロジックやロゴ認識(Pythonのバックエンド)のディレクトリ
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
1. フロントエンド(http://localhost:3000/ )にアクセスするとロゴ認識画面になるんで頑張って認識させてください(または http://localhost:3000/uploadImage にスキップしてもいいです)
2. フロントエンドで画像をアップロードする．
3. フロントエンドからバックエンド(Go)にエンコードした画像を送信する．
4. バックエンド(Go)はエンコードした画像を受け取り，バックエンド(Python)にエンコードした画像を送信する．
5. バックエンド(Python)はエンコードした画像を受け取り，顔検出と感情分析を行う．
6. バックエンド(Python)は顔検出と感情分析の結果をGoに返す．
7. バックエンド(Go)は顔検出と感情分析の結果をDBに格納して顔検出と感情分析の結果と表示する3Dモデル(fbx)名をフロントエンドに返す．
8. フロントエンドはバックエンド(Go)からの顔検出と感情分析の結果を取得して，Three.js(AR)でlocalstack(S3)から取得した3Dモデルを表示する．

## 実行方法
以下のコマンドでシステムを起動する．
```bash
docker compose up
```
docker composeの初回実行時は以下のコマンドを実行してください．
```bash
docker compose up --build
```
ここからはローカル開発時に**起動するたび**に行ってほしい準備です．
3dモデルのS3バケットの作成
```bash
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

## タスク番号とブランチ管理
| 技術領域             | 略号          |
|------------------|-------------|
| Frontend         | FE          |
| Backend (Go)     | BEGO        |
| Backend (Python) | BEPY        |
| 3DModeling       | MOD         |
| Infrastructure   | AWS         |

FE-1のタスクをする際はブランチ名を `feature/FE-1` としてほしいです．PRを作成する際はbaseをdevelopにしてください．また，必ず誰かのレビューを受けるようにお願いする

## 注意点
- DBに格納するだけでDBのデータは活用できていないのでデータ活用は考えたい
- フロントエンドのデザインがシンプルすぎるので，デザインを考えたい
- 3Dモデルは表示しているのみなので，3Dモデルを活用する方法を考えたい