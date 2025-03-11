package model

import "time"

// AnalysisResult は 1 つの顔の解析結果を表す
// 同じ S3 リクエストから複数顔が検出された場合，各顔ごとにレコードを作成し，同一の Bucket, ImageKey で紐付ける．
type AnalysisResult struct {
	ID              int64             `json:"id" gorm:"primaryKey;autoIncrement"`
	Bucket          string            `json:"bucket"`
	ImageKey        string            `json:"image_key"`
	DominantEmotion string            `json:"dominant_emotion"`
	CreatedAt       time.Time         `json:"created_at"`
	Emotions        []AnalysisEmotion `json:"emotions" gorm:"foreignKey:ResultID"`
}

// AnalysisEmotion は 1 つの解析結果内の各感情とスコアを表す
type AnalysisEmotion struct {
	ID       int64   `json:"id" gorm:"primaryKey;autoIncrement"`
	ResultID int64   `json:"result_id" gorm:"index"` // AnalysisResult の ID を外部キーとして紐付け
	Emotion  string  `json:"emotion"`
	Score    float64 `json:"score"`
}
