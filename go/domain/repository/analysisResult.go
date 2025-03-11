package repository

import "mltest/domain/model"

// AnalysisRepository は解析結果の永続化のためのリポジトリインターフェースです.
type AnalysisRepository interface {
	Save(result *model.AnalysisResult) error
	GetAll() ([]*model.AnalysisResult, error)
}
