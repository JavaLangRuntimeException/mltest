# interface ディレクトリ
バックエンド(Go)のAPIのリクエストやレスポンスの形式を定義するディレクトリ

ロゴ認識や顔認識といった機能単位でファイル作成をしています

例:

```go
package handler
import (
    "github.com/yourusername/yourproject/usecase"
	"net/http"
	"strconv"
	"github.com/labstack/echo/v4"
	"github.com/yourusername/yourproject/domain/model"
)

type ProductsHandler struct {
    usecase usecase.ProductUsecase
}

func NewProductsHandler(usecase *usecase.ProductUsecase) *ProductsHandler {
	return &ProductsHandler{usecase: usecase}
}

// GetAllProducts はすべての製品情報を取得するハンドラー
func (h *ProductsHandler) GetProductByID(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid product ID"})
	}
	product, err := h.usecase.GetProductByID(id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to get product"})
	}
	return c.JSON(http.StatusOK, product)
}

// GetAllProducts はすべての製品情報を取得するハンドラー
func (h *ProductsHandler) GetAllProducts(c echo.Context) error {
    products, err := h.usecase.GetAllProducts()
    if err != nil {
        return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to get products"})
    }
    return c.JSON(http.StatusOK, products)
}

// GetAllProducts はすべての製品情報を取得するハンドラー
func (h *ProductsHandler) CreateProduct(c echo.Context) error {
	var product usecase.ProductRequest
	if err := c.Bind(&product); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid product data"})
	}
	product, err := h.usecase.CreateProduct(&product)
	if err != nil {
        return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create product"})
    }
	
	// 成功した場合は201 Createdを返す
	return c.JSON(http.StatusCreated, product)
}

// UpdateProduct は製品情報を更新するハンドラー
func (h *ProductsHandler) UpdateProduct(c echo.Context) error {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid product ID"})
    }
    var product usecase.ProductRequest
    if err := c.Bind(&product); err != nil {
        return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid product data"})
    }
    product.ID = id
    if err := h.usecase.UpdateProduct(&product); err != nil {
        return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to update product"})
    }
    return c.NoContent(http.StatusNoContent)
}

// DeleteProduct は製品情報を削除するハンドラー
func (h *ProductsHandler) DeleteProduct(c echo.Context) error {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid product ID"})
    }
    if err := h.usecase.DeleteProduct(id); err != nil {
        return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to delete product"})
    }
    return c.NoContent(http.StatusNoContent)
}
```

今回は以下のハンドラーを実装する必要があります。
- `faceRecognitionHandler`: 顔認識の結果を取得するハンドラー
  - `GetFaceRecognitionResult`: 顔認識の結果を取得するメソッド
    - 画像と位置情報を受け取り、顔認識を行い、リコメンドアイスの情報を返す

- `logoRecognitionHandler`: ロゴ認識の結果を取得するハンドラー
  - `GetLogoRecognitionResult`: ロゴ認識の結果を取得するメソッド
    - 画像を受け取り、ロゴ認識を行い、AR表示の切り替えを行う

- `getARIceHandler`: ARアイスの情報を取得するハンドラー
  - `GetARIce`: ARアイスの情報を取得するメソッド
    - 位置情報を受け取り、ARで表示するアイスとその大きさの情報を返す






