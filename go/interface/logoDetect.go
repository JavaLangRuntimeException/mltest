package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"mltest/usecase"
)

type DetectHandler struct {
	detectUsecase *usecase.DetectUsecase
}

func NewDetectHandler(du *usecase.DetectUsecase) *DetectHandler {
	return &DetectHandler{
		detectUsecase: du,
	}
}

// POST リクエストで、ロゴ検出を処理する
func (h *DetectHandler) HandleDetectLogo(c echo.Context) error {
	var req struct {
		Image string `json:"image"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "リクエスト解析失敗"})
	}
	if req.Image == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "画像データが必要です"})
	}

	result, err := h.detectUsecase.DetectLogo(req.Image)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "ロゴ検出失敗: " + err.Error()})
	}
	return c.JSON(http.StatusOK, result)
}
