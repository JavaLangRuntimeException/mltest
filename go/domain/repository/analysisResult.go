package repository

import "mltest/domain/model"

// 解析結果の保存や取得のためのインターフェース
type AnalysisResult interface {
	Save(result *model.AnalysisResult) error
	GetAll() ([]*model.AnalysisResult, error)
}
