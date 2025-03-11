package main

import (
	"log"
	"mltest/infrastructure/dao"
	"mltest/infrastructure/mysql"
	"mltest/interface"
	"mltest/usecase"
	"os"
	"time"

	"github.com/labstack/echo/v4"
)

func main() {
	// DB接続 (MYSQL_DSN は "user:password@tcp(host:port)/dbname?charset=utf8mb4&parseTime=True&loc=Local" 形式)
	db, err := mysql.NewGormDB(os.Getenv("MYSQL_DSN"))
	if err != nil {
		log.Fatalf("DB接続に失敗: %v", err)
	}

	// リポジトリ初期化 (GORM を使った実装)
	analysisRepo := dao.NewAnalysisResultDao(db)

	// ユースケース初期化 (PYTHON_SERVICE_URL は Python サービスの URL)
	analysisUC := usecase.NewAnalysisUsecase(analysisRepo, os.Getenv("PYTHON_SERVICE_URL"))

	// Echo インスタンスを main で作成
	e := echo.New()

	// Echo ハンドラ初期化
	newHandler := handler.NewHandler(analysisUC)

	// ルーティング設定（main.go で直接設定）
	e.POST("/analyze", newHandler.HandleAnalyze)
	e.GET("/results", newHandler.HandleGetResults)

	// サーバ設定 (タイムアウトなど)
	e.Server.ReadTimeout = 10 * time.Second
	e.Server.WriteTimeout = 10 * time.Second

	log.Println("Go API サーバ（Echo・GORM）をポート8080で起動")
	if err := e.Start(":8080"); err != nil {
		log.Fatalf("サーバ起動に失敗: %v", err)
	}
}
