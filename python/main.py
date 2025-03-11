import logging
from flask import Flask, request, jsonify
import os
import boto3
import tempfile
from botocore.config import Config
from deepface import DeepFace
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib
import pandas as pd
from sqlalchemy import create_engine, Column, Integer, String, Float, TIMESTAMP, MetaData, Table, select
from sqlalchemy.orm import sessionmaker

# --- ログ設定 ---
logging.basicConfig(level=logging.DEBUG)
boto3.set_stream_logger('botocore', level=logging.DEBUG)

app = Flask(__name__)

# RDS接続設定（RDS_DSNは "mysql+pymysql://user:password@host:port/dbname" 形式）
RDS_DSN = os.environ.get('RDS_DSN')
engine = create_engine(RDS_DSN)
Session = sessionmaker(bind=engine)
metadata = MetaData()

# --- S3クライアントの作成 ---
# 環境変数からS3エンドポイント、リージョン、認証情報を取得
s3_endpoint = os.getenv('S3_ENDPOINT_URL', 'http://localstack:4566')
region_name = os.getenv('AWS_REGION', 'us-east-1')
aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID', 'test')
aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY', 'test')

s3_client = boto3.client(
    's3',
    endpoint_url='http://localstack:4566',
    region_name='dummy',
    aws_access_key_id='test',
    aws_secret_access_key='test',
)

@app.route('/', methods=['POST'])
def analyze_image():
    data = request.get_json()
    bucket = data.get('bucket')
    image_key = data.get('image_key')
    if not bucket or not image_key:
        return jsonify({'error': 'bucket または image_key が指定されていません'}), 400

    # S3から画像を一時ファイルとしてダウンロード
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
            logging.debug(f"ダウンロード開始: バケット={bucket}, キー={image_key}")
            s3_client.download_fileobj(bucket, image_key, tmp_file)
            tmp_file_path = tmp_file.name
            logging.debug(f"一時ファイルパス: {tmp_file_path}")
    except Exception as e:
        logging.exception("S3からのダウンロードに失敗しました")
        return jsonify({'error': 'S3からのダウンロード失敗', 'details': str(e)}), 500

    try:
        logging.debug("DeepFace解析開始")
        analysis = DeepFace.analyze(tmp_file_path, actions=['emotion'])
        # 複数の顔が検出された場合は list となるので、それぞれの解析結果をリストにまとめる
        if isinstance(analysis, list):
            results = []
            for face_analysis in analysis:
                emotions = {emo: float(score) for emo, score in face_analysis['emotion'].items()}
                results.append({
                    'dominant_emotion': face_analysis['dominant_emotion'],
                    'emotions': emotions
                })
            result_json = results
        else:
            emotions = {emo: float(score) for emo, score in analysis['emotion'].items()}
            result_json = {
                'dominant_emotion': analysis['dominant_emotion'],
                'emotions': emotions
            }
        logging.debug(f"DeepFace解析結果: {result_json}")
    except Exception as e:
        logging.exception("DeepFace解析に失敗しました")
        return jsonify({'error': 'DeepFace解析失敗', 'details': str(e)}), 500

    # 解析結果を返却（データ保存はGo側の管理を想定）
    return jsonify(result_json), 200

# def retrain_model():
#     session = Session()
#     try:
#         stmt = select(analysis_results)
#         rows = session.execute(stmt).fetchall()
#         if not rows or len(rows) < 10:
#             logging.debug("訓練データが十分ではありません")
#             return
#         df = pd.DataFrame(rows, columns=['id', 'bucket', 'image_key', 'emotion', 'score', 'created_at'])
#         X = df[['score']]
#         y = df['emotion']
#         model = RandomForestClassifier(n_estimators=100, random_state=42)
#         model.fit(X, y)
#         joblib.dump(model, 'emotion_model.pkl')
#         y_pred = model.predict(X)
#         acc = accuracy_score(y, y_pred)
#         logging.info(f"モデル再訓練完了、精度: {acc * 100:.2f}%")
#     except Exception as e:
#         logging.exception("モデル再訓練時にエラーが発生しました")
#     finally:
#         session.close()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    logging.info(f"Pythonサービス開始: ポート {port}")
    app.run(host='0.0.0.0', port=port)