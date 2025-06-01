# usecaseディレクトリ
usecaseディレクトリは、アプリケーションのビジネスロジックを実装するディレクトリ

ロゴ認識や顔認識といった機能単位でファイル作成をしています

例
```go
package usecase
import (
    "github.com/yourusername/yourproject/domain/model"
    "github.com/yourusername/yourproject/repository"
)

type ProductUsecase struct {
    repo repository.ProductRepository
}

func NewProductUsecase(repo repository.ProductRepository) *ProductUsecase {
	// ビジネスロジックをここに追加することができます。
    return &ProductUsecase{repo: repo}
}

// GetProductByID は製品IDに基づいて製品情報を取得するユースケース
func (u *ProductUsecase) GetProductByID(id int64) (*model.Product, error) {
	// ビジネスロジックをここに追加することができます。
    return u.repo.GetProductByID(id)
}

// GetAllProducts はすべての製品情報を取得するユースケース
func (u *ProductUsecase) GetAllProducts() ([]*model.Product, error) {
	// ビジネスロジックをここに追加することができます。
    return u.repo.GetAllProducts()
}

// CreateProduct は新しい製品情報を作成するユースケース
func (u *ProductUsecase) CreateProduct(product *model.Product) (*model.Product, error) {
	// ビジネスロジックをここに追加することができます。
    return u.repo.CreateProduct(product)
}
```

# 今回実装が必要なユースケース
以下の通りです。
- `EmotionAnalysisUsecase`: 表情分析を行うユースケース
  - 実装してほしいビジネスロジック
    - リクエストから画像のデータを取得し、Pythonサーバーに送信
    - Pythonサーバーからのレスポンスを受け取り、表情分析結果とリコメンドアイスIDを取得
    - リクエストから位置情報を取得し、GoogleAPIを使用して市町村レベルの住所に変換
    - sessionを発行し、cookieに設定
    - DBに表情分析結果を保存（Emotionsテーブルのindex作成）
    - DBにリコメンドされたアイスのデータを保存（Logsテーブルのindex作成：ar_regionはNull. products_id, emotion_idの外部キーを設定, recommended_regionには市町村レベルの住所, session_idを設定）
    - リコメンドアイス情報（name, description, fbx_url）をクライアントに送信
- `RogoRecognitionUsecase`: ロゴ認識を行うユースケース
  - 実装してほしいビジネスロジック
    - リクエストからカメラ画像のデータを取得し、Pythonサーバーに送信
    - Pythonサーバーからのレスポンスを受け取り、ロゴ認識結果を取得
- `GetARIceUsecase`: ARアイスを取得するユースケース
  - 実装してほしいビジネスロジック
    - リクエストから位置情報を取得し、GoogleAPIを使用して市町村レベルの住所に変換
    - もしセッションが存在する場合
      - DBからセッションIDを使用して、Logsテーブルのar_regionsカラムに位置情報入れて更新
    - もしセッションが存在しない場合
      - 新規セッションを作成し、Logsテーブルのar_regionsカラムに位置情報を入れてindexを作成
    - データベースから同じ市町村でリコメンドされた各アイスの数とデータを取得
    - クライアントに各アイスのデータ（name, description, fbx_url, 個数）を送信