package handler

import (
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	"mltest/usecase"
)

// Handler は HTTP リクエストを処理するハンドラ
type Handler struct {
	analysisUsecase *usecase.AnalysisUsecase
}

// インスタンスメソッド
func NewHandler(au *usecase.AnalysisUsecase) *Handler {
	return &Handler{
		analysisUsecase: au,
	}
}

// HandleAnalyze は POST リクエストで画像解析依頼を処理
func (h *Handler) HandleAnalyze(c echo.Context) error {
	var req usecase.S3Request
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "リクエスト解析失敗"})
	}

	analyses, err := h.analysisUsecase.AnalyzeImage(&req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "解析失敗: " + err.Error()})
	}

	if err = h.analysisUsecase.SaveAnalysisResult(&req, analyses); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "結果保存失敗: " + err.Error()})
	}

	// ログ例: 同一 S3 リクエストに対して複数の解析結果がある場合、各結果をログ出力
	for _, analysis := range analyses {
		log.Printf("解析完了：Bucket=%s, ImageKey=%s, DominantEmotion=%s", req.Bucket, req.ImageKey, analysis.DominantEmotion)
	}
	return c.JSON(http.StatusOK, analyses)
}

// HandleGetResults は GET リクエストで保存済み解析結果を返却
func (h *Handler) HandleGetResults(c echo.Context) error {
	results, err := h.analysisUsecase.GetAnalysisResults()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "結果取得失敗: " + err.Error()})
	}
	return c.JSON(http.StatusOK, results)
}
