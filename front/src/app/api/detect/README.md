# api/detect ディレクトリ
入力画像の表情解析をするGo APIを叩く

## リクエストJSON例
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/..."
}
```

## レスポンスJSON例
trueだったらuploadImageのページに移動する
```json
{
  "logo_detected": true
}
```