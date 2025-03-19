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

// AnalysisUsecase は画像解析処理および結果永続化を実現するユースケースです。
type AnalysisUsecase struct {
	repo             repository.AnalysisRepository
	pythonServiceURL string
}

// NewAnalysisUsecase はコンストラクタです。
func NewAnalysisUsecase(repo repository.AnalysisRepository, pythonServiceURL string) *AnalysisUsecase {
	return &AnalysisUsecase{
		repo:             repo,
		pythonServiceURL: pythonServiceURL,
	}
}

// S3Request は解析対象となる S3 オブジェクト情報です。
type S3Request struct {
	Bucket   string `json:"bucket"`
	ImageKey string `json:"image_key"`
}

// PythonAnalysis は Python サービスから返却される解析結果を表します。
type PythonAnalysis struct {
	DominantEmotion string             `json:"dominant_emotion"`
	Emotions        map[string]float64 `json:"emotions"`
}

// AnalysisResult は、選択された商品情報と解析結果を格納するための構造体です。
type AnalysisResult struct {
	SelectedProduct string          `json:"selected_product"`
	Analysis        *PythonAnalysis `json:"analysis"`
}

// DetectResult は、Python サービスの /detect エンドポイントから返るロゴ検出結果を表します。
type DetectResult struct {
	LogoDetected bool `json:"logo_detected"`
}

// AnalyzeImage は Python サービスへ画像解析のリクエストを行い、解析結果を取得します。
func (u *AnalysisUsecase) AnalyzeImage(req *S3Request) (AnalysisResult, error) {
	payload, err := json.Marshal(req)
	if err != nil {
		return AnalysisResult{}, err
	}
	resp, err := http.Post(u.pythonServiceURL, "application/json", bytes.NewBuffer(payload))
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
		Analysis:        &analysis,
		SelectedProduct: "product1",
	}
	return result, nil
}

// SaveAnalysisResult は、S3 リクエストと Python からの解析結果（単一）をデータベースへ保存します。
func (u *AnalysisUsecase) SaveAnalysisResult(req *S3Request, analysis PythonAnalysis) error {
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
	return nil
}

// GetAnalysisResults は、保存された解析結果一覧を取得します。
func (u *AnalysisUsecase) GetAnalysisResults() ([]*model.AnalysisResult, error) {
	return u.repo.GetAll()
}

// DetectLogo は、与えられた画像データを Python サービスの /detect エンドポイントへ送信し
// ロゴ検出結果を取得します。
func (u *AnalysisUsecase) DetectLogo(image string) (DetectResult, error) {
	payload, err := json.Marshal(map[string]string{"image": image})
	if err != nil {
		return DetectResult{}, err
	}
	// Python サービスの /detect エンドポイントへ接続する
	url := u.pythonServiceURL + "/detect"
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(payload))
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
