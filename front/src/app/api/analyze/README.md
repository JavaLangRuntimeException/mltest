# api/analyze ディレクトリ
入力画像の表情解析をするGo APIを叩

## リクエストJSON例
ファイル名とエンコードしたデータが含まれます
```json
{
   "file_name": "example.jpg",
   "content_type": "image/jpeg",
   "image_data": "/9j/4AAQSkZJRgABAQEASABIAAD/…"
}
```

## レスポンスJSON例
このselected_productで指定したfbxファイル名を表示する
できればanalysisの結果を綺麗に表示したい
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