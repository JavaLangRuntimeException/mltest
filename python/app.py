import logging
from flask import Flask, request, jsonify
import os
import boto3
import cv2
from deepface import DeepFace
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker
import numpy as np
import base64

# --- ログ設定 ---
logging.basicConfig(level=logging.DEBUG)
boto3.set_stream_logger('botocore', level=logging.DEBUG)

app = Flask(__name__)

def decode_base64_image(image_data: str):
    """
    Base64でエンコードされた画像データ（プレフィックスなし）をデコードし、
    OpenCVが利用可能な画像（numpy.ndarray）として返す関数。

    例:
      入力: "/9j/4AAQSkZJRgABAQAAAQABAAD/..."
    """
    try:
        decoded_data = base64.b64decode(image_data)
        nparr = np.frombuffer(decoded_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise Exception("OpenCVで画像をデコードできませんでした")
        return img
    except Exception as e:
        raise Exception("Base64デコードに失敗しました: " + str(e))

def get_red_contours(image):
    """
    BGR画像から赤い部分の輪郭を抽出する関数
    """
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    lower_red1 = np.array([0, 70, 50])
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([170, 70, 50])
    upper_red2 = np.array([180, 255, 255])
    mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
    mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
    red_mask = cv2.bitwise_or(mask1, mask2)
    kernel = np.ones((3, 3), np.uint8)
    red_mask = cv2.morphologyEx(red_mask, cv2.MORPH_OPEN, kernel, iterations=1)
    red_mask = cv2.morphologyEx(red_mask, cv2.MORPH_CLOSE, kernel, iterations=1)
    contours, _ = cv2.findContours(red_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    filtered_contours = [cnt for cnt in contours if cv2.contourArea(cnt) > 50]
    return filtered_contours

# --- テンプレート画像の読み込み ---
template_gray = cv2.imread('./logo.png', cv2.IMREAD_GRAYSCALE)
if template_gray is None:
    logging.debug("テンプレート画像の読み込みに失敗しました。パスが正しいか確認してください")
    exit(1)

template_color = cv2.imread('./logo.png', cv2.IMREAD_COLOR)
if template_color is None:
    logging.debug("テンプレート画像（カラー）の読み込みに失敗しました。パスが正しいか確認してください。")
    exit(1)

# テンプレート画像から赤い部分の輪郭を抽出（グローバル変数として保持）
template_red_contours = get_red_contours(template_color)
if not template_red_contours:
    logging.debug("テンプレート画像から赤い部分の輪郭が抽出できませんでした。")

# テンプレートマッチングと赤色形状類似度の閾値
tm_threshold = 0.45
red_threshold = 0.8

@app.route('/analyze', methods=['POST'])
def analyze_image():
    """
    [POST] /analyze
    受け取るJSON例:
    {
       "image_data": "/9j/4AAQSkZJRgABAQAAAQABAAD/..."
    }

    画像から顔検出を行い，DeepFaceを利用して感情解析を実施する
    """
    data = request.get_json()
    image_data = data.get('image_data')
    if not image_data:
        return jsonify({'error': 'image_data が指定されていません'}), 400

    try:
        # 共通関数でBase64文字列から画像を復元
        img = decode_base64_image(image_data)
    except Exception as e:
        logging.exception("画像データのデコードに失敗しました")
        return jsonify({'error': 'Base64デコード失敗', 'details': str(e)}), 500

    try:
        logging.debug("OpenCVを使用して顔検出開始")
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
        if len(faces) == 0:
            raise Exception("顔が検出されませんでした")

        faces_list = faces.tolist()
        faces_grouped, weights = cv2.groupRectangles(faces_list, groupThreshold=1, eps=0.2)
        if len(faces_grouped) == 0:
            faces_grouped = faces_list
        logging.debug(f"統合後の顔検出結果: {faces_grouped}")

        results = []
        for (x, y, w, h) in faces_grouped:
            logging.debug(f"検出された顔領域: x={x}, y={y}, w={w}, h={h}")
            face_roi = img[y:y+h, x:x+w]
            analysis = DeepFace.analyze(face_roi, actions=['emotion'], enforce_detection=False)

            def flatten_deepface_result(result):
                if isinstance(result, dict):
                    return [result]
                elif isinstance(result, list):
                    flattened = []
                    for item in result:
                        flattened.extend(flatten_deepface_result(item))
                    return flattened
                else:
                    return []

            flattened_results = flatten_deepface_result(analysis)
            for face_result in flattened_results:
                emotions = {emo: float(score) for emo, score in face_result.get('emotion', {}).items()}
                results.append({
                    'dominant_emotion': face_result.get('dominant_emotion', ''),
                    'emotions': emotions
                })
        logging.debug(f"個別の DeepFace解析結果: {results}")

        if results:
            num_results = len(results)
            aggregated = {}
            for detection in results:
                for emotion, score in detection["emotions"].items():
                    aggregated[emotion] = aggregated.get(emotion, 0) + score
            avg_emotions = {emotion: aggregated[emotion] / num_results for emotion in aggregated}
            final_dominant_emotion = max(avg_emotions, key=avg_emotions.get)
        else:
            avg_emotions = {}
            final_dominant_emotion = ""

        final_result = {
            "dominant_emotion": final_dominant_emotion,
            "emotions": avg_emotions
        }
        logging.debug(f"最終的な解析結果: {final_result}")
    except Exception as e:
        logging.exception("顔検出またはDeepFace解析に失敗しました")
        return jsonify({'error': 'DeepFace解析失敗', 'details': str(e)}), 500

    return jsonify(final_result), 200

@app.route("/detect", methods=["POST"])
def detect():
    """
    [POST] /detect
    受け取るJSON例:
    {
      "image_data": "/9j/4AAQSkZJRgABAQAAAQABAAD/..."
    }

    テンプレートマッチングと赤色領域の輪郭評価によるロゴ検出を行う
    """
    data = request.get_json() or {}
    image_data = data.get("image_data")
    if not image_data:
        return jsonify({"error": "image_data が指定されていません"}), 400

    try:
        frame = decode_base64_image(image_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    result = cv2.matchTemplate(gray, template_gray, cv2.TM_CCOEFF_NORMED)
    raw_max_val = cv2.minMaxLoc(result)[1]
    logging.debug(f"Template matching raw_max_val: {raw_max_val}")

    if raw_max_val > tm_threshold:
        input_red_contours = get_red_contours(frame)
        best_score = None
        if template_red_contours and input_red_contours:
            for temp_cnt in template_red_contours:
                for inp_cnt in input_red_contours:
                    score = cv2.matchShapes(temp_cnt, inp_cnt, cv2.CONTOURS_MATCH_I1, 0.0)
                    if best_score is None or score < best_score:
                        best_score = score

        if best_score is not None:
            red_shape_similarity = 1.0 / (1.0 + best_score)
        else:
            red_shape_similarity = 0.0

        logging.debug(f"Red shape similarity: {red_shape_similarity}")
        logo_detected = red_shape_similarity > red_threshold
    else:
        logo_detected = False

    return jsonify({
        "logo_detected": logo_detected
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)