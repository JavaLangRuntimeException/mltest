package model

// AnalysisEmotion は、1 つの解析結果内の各感情とそのスコアを表します。
type AnalysisEmotion struct {
	ID       int64   `json:"id" gorm:"primaryKey;autoIncrement"`
	ResultID int64   `json:"result_id" gorm:"index"` // AnalysisResult の ID を外部キーとして紐付け
	Emotion  string  `json:"emotion"`
	Score    float64 `json:"score"`
}
