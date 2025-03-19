package handler

import (
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	"mltest/usecase"
)

// Handler は、HTTP リクエストを処理するハンドラです。
type Handler struct {
	analysisUsecase *usecase.AnalysisUsecase
}

// NewHandler は、新しいハンドラのインスタンスを構築します。
func NewHandler(au *usecase.AnalysisUsecase) *Handler {
	return &Handler{
		analysisUsecase: au,
	}
}

// HandleAnalyze は、POST リクエストで画像解析依頼を処理します。
func (h *Handler) HandleAnalyze(c echo.Context) error {
	var req usecase.S3Request
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "リクエスト解析失敗"})
	}

	result, err := h.analysisUsecase.AnalyzeImage(&req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "解析失敗: " + err.Error()})
	}

	if err = h.analysisUsecase.SaveAnalysisResult(&req, *result.Analysis); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "結果保存失敗: " + err.Error()})
	}

	log.Printf("解析完了：Bucket=%s, ImageKey=%s, DominantEmotion=%s, product=%s",
		req.Bucket, req.ImageKey, result.Analysis.DominantEmotion, result.SelectedProduct)

	return c.JSON(http.StatusOK, result)
}

// HandleGetResults は、GET リクエストで保存済み解析結果を返却します。
func (h *Handler) HandleGetResults(c echo.Context) error {
	results, err := h.analysisUsecase.GetAnalysisResults()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "結果取得失敗: " + err.Error()})
	}
	return c.JSON(http.StatusOK, results)
}

// HandleDetectLogo は、POST リクエストでロゴ検出を処理します。
func (h *Handler) HandleDetectLogo(c echo.Context) error {
	var req struct {
		Image string `json:"image"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "リクエスト解析失敗"})
	}
	if req.Image == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "画像データが必要です"})
	}

	result, err := h.analysisUsecase.DetectLogo(req.Image)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "ロゴ検出失敗: " + err.Error()})
	}
	return c.JSON(http.StatusOK, result)
}
