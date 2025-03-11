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

// AnalysisUsecase は画像解析処理および結果永続化を実現するユースケース
type AnalysisUsecase struct {
	repo             repository.AnalysisRepository
	pythonServiceURL string
}

// インスタンスメソッド
func NewAnalysisUsecase(repo repository.AnalysisRepository, pythonServiceURL string) *AnalysisUsecase {
	return &AnalysisUsecase{
		repo:             repo,
		pythonServiceURL: pythonServiceURL,
	}
}

// S3Request は解析対象となる S3 オブジェクト情報
type S3Request struct {
	Bucket   string `json:"bucket"`
	ImageKey string `json:"image_key"`
}

// PythonAnalysis は Python サービスから返却される 1 つの解析結果を表す
type PythonAnalysis struct {
	DominantEmotion string             `json:"dominant_emotion"`
	Emotions        map[string]float64 `json:"emotions"`
}

// AnalyzeImage は Python サービスへ画像解析のリクエストを行い，解析結果を複数取得す
func (u *AnalysisUsecase) AnalyzeImage(req *S3Request) ([]PythonAnalysis, error) {
	payload, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}
	resp, err := http.Post(u.pythonServiceURL, "application/json", bytes.NewBuffer(payload))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, errors.New("Pythonサービスのエラー: " + string(body))
	}

	var analyses []PythonAnalysis
	if err := json.NewDecoder(resp.Body).Decode(&analyses); err != nil {
		return nil, err
	}
	return analyses, nil
}

// SaveAnalysisResult は、S3リクエストと Python からの解析結果（複数）をデータベースへ保存する
func (u *AnalysisUsecase) SaveAnalysisResult(req *S3Request, analyses []PythonAnalysis) error {
	// Pythonサービスから得た解析結果（複数）それぞれについてレコードを作成します.
	for _, analysis := range analyses {
		result := &model.AnalysisResult{
			Bucket:          req.Bucket,
			ImageKey:        req.ImageKey,
			DominantEmotion: analysis.DominantEmotion,
		}
		// 各 emotion のスコアを子レコードとして追加
		for emo, score := range analysis.Emotions {
			result.Emotions = append(result.Emotions, model.AnalysisEmotion{
				Emotion: emo,
				Score:   score,
			})
		}
		if err := u.repo.Save(result); err != nil {
			return err
		}
	}
	return nil
}

// GetAnalysisResults は、保存された解析結果一覧を取得する
func (u *AnalysisUsecase) GetAnalysisResults() ([]*model.AnalysisResult, error) {
	return u.repo.GetAll()
}
