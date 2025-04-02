package model

import "time"

// 1 つの顔の解析結果を表す
// 同じ画像から複数顔が検出された場合、各顔ごとにレコードを作成する
type AnalysisResult struct {
	ID              int64             `json:"id" gorm:"primaryKey;autoIncrement"`
	FileName        string            `json:"file_name"`        // 画像ファイル名を保存する
	DominantEmotion string            `json:"dominant_emotion"` // 解析結果から決定された主要な感情
	CreatedAt       time.Time         `json:"created_at"`
	Emotions        []AnalysisEmotion `json:"emotions" gorm:"foreignKey:ResultID"`
}
