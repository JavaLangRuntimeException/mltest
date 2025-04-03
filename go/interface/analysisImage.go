package handler

import (
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	"mltest/usecase"
)

type AnalysisHandler struct {
	analysisUsecase *usecase.AnalysisUsecase
}

func NewAnalysisHandler(au *usecase.AnalysisUsecase) *AnalysisHandler {
	return &AnalysisHandler{
		analysisUsecase: au,
	}
}

// POST リクエストで画像解析依頼を処理する
func (h *AnalysisHandler) HandleAnalyze(c echo.Context) error {
	var req usecase.Base64ImageRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "リクエスト解析失敗"})
	}

	result, err := h.analysisUsecase.AnalyzeImage(&req.ImageData)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "解析失敗: " + err.Error()})
	}

	if err = h.analysisUsecase.SaveAnalysisResult(req.FileName, *result.Analysis); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "結果保存失敗: " + err.Error()})
	}

	log.Printf("解析完了：FileName=%s, DominantEmotion=%s, product=%s",
		req.FileName, result.Analysis.DominantEmotion, result.SelectedProduct)
	return c.JSON(http.StatusOK, result)
}

// GET リクエストで保存済み解析結果を返却する
func (h *AnalysisHandler) HandleGetResults(c echo.Context) error {
	results, err := h.analysisUsecase.GetAnalysisResults()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "結果取得失敗: " + err.Error()})
	}
	return c.JSON(http.StatusOK, results)
}
