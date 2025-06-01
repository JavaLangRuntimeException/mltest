# domain/model ディレクトリ
バックエンド(go)で使用するドメインモデルの定義をするページ．例ではデータベースのスキーマに合わせて作成しています．
このモデルをベースにユースケースやCRUDを書いていってください

以下の例では、製品情報を表す`Product`モデルを定義しています。このモデルは、製品のID、名前、説明、および3DモデルのURLを含んでいます。データベースのスキーマに合わせて、JSONおよびDBタグが付与されています。
```
type Product struct {
    ID          int64  `json:"id" db:"id"`
    Name        string `json:"name" db:"name"`
    Description string `json:"description" db:"description"`
    ModelURL    string `json:"model_url" db:"model_url"`
}
```

# 今回実装が必要なドメインモデル

以下の通りです。
- `Product`: 製品情報を表すモデル
- `Log`: ユーザーの行動ログを表すモデル
- `Emotion`: 表情分析の結果を表すモデル
- `Region`: 位置情報を表すモデル

DBのスキーマに合わせて、各モデルを定義してください。