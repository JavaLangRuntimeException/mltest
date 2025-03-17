# api/analyze ディレクトリ
入力画像の表情解析をするGo APIを叩く

## リクエストJSON例
```json
{
  "bucket": "example-bucket",
  "image_key": "image.jpg"
}
```

## レスポンスJSON例
```json
{
  "selected_product": "product1",
  "analysis": {
    "dominant_emotion": "happy",
    "emotions": {
      "happy": 0.95,
      "sad": 0.02,
      "neutral": 0.03
    }
  }
}
```