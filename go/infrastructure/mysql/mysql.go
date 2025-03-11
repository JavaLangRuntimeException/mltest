package mysql

import (
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// NewGormDB は GORM を利用して MySQL への接続を生成
func NewGormDB(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	return db, nil
}
