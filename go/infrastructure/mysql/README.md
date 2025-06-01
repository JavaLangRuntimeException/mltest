# infrastructure/mysql ディレクトリ
MySQLとの接続を行うためのファイルを配置するディレクトリ．ここではGORMを使ってMySQLとの接続を行っている．


今回は変更の必要はないが、将来的にMySQLの設定や接続方法を変更する場合は、このディレクトリ内のファイルを編集することになる．
# 例はMySQLとの接続を行うためのコードです．

```go
package mysql
import (
    "gorm.io/driver/mysql"
    "gorm.io/gorm"
)

// Connect はMySQLデータベースへの接続を確立します。
func Connect(dsn string) (*gorm.DB, error) {
    db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
    if err != nil {
        return nil, err
    }
    return db, nil
}
```