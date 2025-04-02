package dao

import (
	"mltest/domain/model"
	"time"

	"gorm.io/gorm"
	"mltest/domain/repository"
)

type analysisResultDao struct {
	db *gorm.DB
}

// NewAnalysisResultDao は GORM を用いたリポジトリ実装のインスタンスを返す
func NewAnalysisResultDao(db *gorm.DB) repository.AnalysisResult {
	return &analysisResultDao{db: db}
}

// Save は解析結果（親レコードと関連する子レコード）をデータベースに保存
func (r *analysisResultDao) Save(result *model.AnalysisResult) error {
	result.CreatedAt = time.Now()
	return r.db.Create(result).Error
}

// GetAll は保存済みの解析結果（子テーブルも含む）を全件取得
func (r *analysisResultDao) GetAll() ([]*model.AnalysisResult, error) {
	var results []*model.AnalysisResult
	// Preload("Emotions") で子レコードも自動で読み込む
	if err := r.db.Preload("Emotions").Order("created_at desc").Find(&results).Error; err != nil {
		return nil, err
	}
	return results, nil
}
