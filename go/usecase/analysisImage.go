package usecase

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"mltest/domain/model"
	"mltest/domain/repository"
)

// Base64ImageRequest は、Base64 エンコード済みの画像データを受け取るリクエスト形式です。
type Base64ImageRequest struct {
	FileName    string `json:"file_name"`
	ContentType string `json:"content_type"`
	ImageData   string `json:"image_data"`
}

// PythonAnalysis は、Python サービスから返却される解析結果です。
type PythonAnalysis struct {
	DominantEmotion string             `json:"dominant_emotion"`
	Emotions        map[string]float64 `json:"emotions"`
}

// AnalysisResult は、選択された商品情報と解析結果をまとめるための型です。
type AnalysisResult struct {
	SelectedProduct string          `json:"selected_product"`
	Analysis        *PythonAnalysis `json:"analysis"`
}

// AnalysisUsecase は、画像解析と解析結果の永続化を行うユースケースです。
type AnalysisUsecase struct {
	repo             repository.AnalysisResult
	pythonServiceURL string
}

// NewAnalysisUsecase は AnalysisUsecase のコンストラクタです。
func NewAnalysisUsecase(repo repository.AnalysisResult, pythonServiceURL string) *AnalysisUsecase {
	return &AnalysisUsecase{
		repo:             repo,
		pythonServiceURL: pythonServiceURL,
	}
}

// AnalyzeImage は、Base64エンコードされた画像データを Python サービスへ送り、解析結果を取得します。
func (uc *AnalysisUsecase) AnalyzeImage(req *Base64ImageRequest) (AnalysisResult, error) {
	payload, err := json.Marshal(req)
	if err != nil {
		return AnalysisResult{}, err
	}

	resp, err := http.Post(uc.pythonServiceURL+"/analyze", "application/json", bytes.NewBuffer(payload))
	if err != nil {
		return AnalysisResult{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return AnalysisResult{}, errors.New("Pythonサービスのエラー: " + string(body))
	}

	var analysis PythonAnalysis
	if err := json.NewDecoder(resp.Body).Decode(&analysis); err != nil {
		return AnalysisResult{}, err
	}

	result := AnalysisResult{
		SelectedProduct: "product1", // 必要に応じて変更
		Analysis:        &analysis,
	}
	return result, nil
}

// SaveAnalysisResult は、画像ファイル名と Python サービスからの解析結果を
// ドメインモデル（AnalysisResult, AnalysisEmotion）としてデータベースへ保存します。
func (uc *AnalysisUsecase) SaveAnalysisResult(fileName string, analysis PythonAnalysis) error {
	result := &model.AnalysisResult{
		FileName:        fileName,
		DominantEmotion: analysis.DominantEmotion,
	}

	for emo, score := range analysis.Emotions {
		result.Emotions = append(result.Emotions, model.AnalysisEmotion{
			Emotion: emo,
			Score:   score,
		})
	}

	return uc.repo.Save(result)
}

// GetAnalysisResults は、保存されている解析結果一覧を取得します。
func (uc *AnalysisUsecase) GetAnalysisResults() ([]*model.AnalysisResult, error) {
	return uc.repo.GetAll()
}
