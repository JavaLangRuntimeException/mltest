# バックエンド(Go) 
データベースにCRUD操作を行ったり，PythonAPIを叩くためのAPIを提供するバックエンドのディレクトリ．

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
## ディレクトリ構成
```
.
├── Dockerfile
├── README.md
├── domain
│     ├── model 
│     │     ├── README.md
│     │     └── analysisResult.go
│     └── repository
│         ├── README.md
│         └── analysisResult.go
├── go.mod 
├── go.sum
├── infrastructure
│     ├── dao
│     │     ├── README.md
│     │     └── analysisResultDao.go
│     └── mysql
│         ├── README.md
│         └── mysql.go
├── interface
│     ├── README.md
│     └── analysisResult.go
├── main.go
└── usecase
    ├── README.md
    └── analysisResultUsecase.go
```

## main.go
バックエンドのエントリーポイント．APIのルーティングを記述している．また，Echoでサーバーを立ち上げている．