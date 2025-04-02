# api/analyze ディレクトリ
入力画像の表情解析をするGo APIを叩く

## リクエストJSON例
```json
{
   "file_name": "example.jpg",
   "content_type": "image/jpeg",
   "image_data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/…"
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
      "neutral": 0.03,
      ...
    }
  }
}
```