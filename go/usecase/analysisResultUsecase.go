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

// NewAnalysisUsecase はコンストラクタ
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

// PythonAnalysis は Python サービスから返却される解析結果を表す
type PythonAnalysis struct {
	DominantEmotion string             `json:"dominant_emotion"`
	Emotions        map[string]float64 `json:"emotions"`
}

// AnalysisResult は、選択された商品情報と解析結果を格納するための構造体
type AnalysisResult struct {
	SelectedProduct string          `json:"selected_product"`
	Analysis        *PythonAnalysis `json:"analysis"`
}

// AnalyzeImage は Python サービスへ画像解析のリクエストを行い，解析結果を取得する。
// Python サービスが単一の aggregated result を返却するため、解析結果を AnalysisResult に格納して返すようにしています。
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

	// Python サービスが単一の aggregated result を返却するため、そのままデコード
	var analysis PythonAnalysis
	if err := json.NewDecoder(resp.Body).Decode(&analysis); err != nil {
		return AnalysisResult{}, err
	}

	// 解析結果に基づいて選択された商品を決定
	var result AnalysisResult
	// 解析結果のポインタをセットすることで、ハンドラ側で参照できるようにする
	result.Analysis = &analysis
	result.SelectedProduct = "product1"

	//switch analysis.DominantEmotion {
	//case "angry":
	//	result.SelectedProduct = "product1"
	//case "disgust":
	//	result.SelectedProduct = "product2"
	//case "fear":
	//	result.SelectedProduct = "product3"
	//case "happy":
	//	result.SelectedProduct = "product4"
	//case "neutral":
	//	result.SelectedProduct = "product5"
	//case "sad":
	//	result.SelectedProduct = "product6"
	//default:
	//	return AnalysisResult{}, errors.New("Unknown emotion")
	//}

	return result, nil
}

// SaveAnalysisResult は、S3リクエストと Python からの解析結果（単一）をデータベースへ保存する
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

// GetAnalysisResults は、保存された解析結果一覧を取得する
func (u *AnalysisUsecase) GetAnalysisResults() ([]*model.AnalysisResult, error) {
	return u.repo.GetAll()
}
