package usecase

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
)

type DetectResult struct {
	LogoDetected bool `json:"logo_detected"`
}

type DetectUsecase struct {
	pythonServiceURL string
}

func NewDetectUsecase(pythonServiceURL string) *DetectUsecase {
	return &DetectUsecase{
		pythonServiceURL: pythonServiceURL,
	}
}

// 与えられた画像データを Python サービスへ送信し，ロゴ検出結果を取得する
func (du *DetectUsecase) DetectLogo(image string) (DetectResult, error) {
	payload, err := json.Marshal(map[string]string{"image": image})
	if err != nil {
		return DetectResult{}, err
	}

	resp, err := http.Post(du.pythonServiceURL+"/detect", "application/json", bytes.NewBuffer(payload))
	if err != nil {
		return DetectResult{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return DetectResult{}, errors.New("Pythonサービスのエラー: " + string(body))
	}

	var result DetectResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return DetectResult{}, err
	}
	return result, nil
}
