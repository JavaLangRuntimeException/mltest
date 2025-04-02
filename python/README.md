# バックエンド(Python)
画像認識や表情推定の機能を提供するバックエンドです。

## 実行方法
以下のコマンドでバックエンドを起動します。
仮想環境を起動していること前提です。
```bash
pip install --no-cache-dir -r requirements.txt
python3 app.py
```
他のフロントエンドやGoAPIやインフラと共に実行する場合は以下のコマンドを実行してください。
```bash
docker compose up
```
docker composeの初回実行時は以下のコマンドを実行してください。
```bash
docker compose up --build
```
## ディレクトリ構成
```
.
├── Dockerfile
├── README.md
├── main.py
└── requirements.txt // Pythonバックエンドの依存関係
```
## main.py
バックエンドのエントリーポイントです。APIのルーティングを記述しています。また，Flaskでサーバーを立ち上げている．OpenCVで顔認識をして，DeepFaceで表情推定をしている．

## requirements.txt
Pythonバックエンドの依存関係が記述されています．何かライブラリを追加した場合はこのファイルにライブラリを記載してください．
