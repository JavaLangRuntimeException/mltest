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

// Base64 エンコード済みの画像データを受け取るリクエスト形式
type Base64ImageRequest struct {
	FileName    string `json:"file_name"`
	ContentType string `json:"content_type"`
	ImageData   string `json:"image_data"`
}

// Python サービスから返却される解析結果
// DominantEmotionが想定される表情
// Emotionsが表情の根拠
type PythonAnalysis struct {
	DominantEmotion string             `json:"dominant_emotion"`
	Emotions        map[string]float64 `json:"emotions"`
}

// 選択された商品情報と解析結果をまとめるための型
type AnalysisResult struct {
	SelectedProduct string          `json:"selected_product"`
	Analysis        *PythonAnalysis `json:"analysis"`
}

type AnalysisUsecase struct {
	repo             repository.AnalysisResult
	pythonServiceURL string
}

func NewAnalysisUsecase(repo repository.AnalysisResult, pythonServiceURL string) *AnalysisUsecase {
	return &AnalysisUsecase{
		repo:             repo,
		pythonServiceURL: pythonServiceURL,
	}
}

// Base64エンコードされた画像データを Python サービスへ送り，解析結果を取得する
func (uc *AnalysisUsecase) AnalyzeImage(req *string) (AnalysisResult, error) {
	// 単なる文字列 req を {"image_data": "リクエストの文字列"} の形にラップする
	payload, err := json.Marshal(map[string]string{
		"image_data": *req,
	})
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

	// TODO: (BEGO-1) Pythonからの結果からSelectedProduct(= フロントで表示するfbxファイル名)を設定する
	// ここでは仮に "product1" を選択
	result := AnalysisResult{
		SelectedProduct: "product1", // 必要に応じて変更
		Analysis:        &analysis,
	}
	return result, nil
}

// 画像ファイル名と Python サービスからの解析結果を
// ドメインモデル（AnalysisResult, AnalysisEmotion）としてデータベースへ保存する
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

// 保存されている解析結果一覧を取得
func (uc *AnalysisUsecase) GetAnalysisResults() ([]*model.AnalysisResult, error) {
	return uc.repo.GetAll()
}
