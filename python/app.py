from flask import Flask
import os
import logging
from routes import register_blueprints

app = Flask(__name__)

# 共通設定（config.py で設定している場合は必要に応じてインポート）
logging.basicConfig(level=logging.DEBUG)

# Blueprint の登録
register_blueprints(app)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)