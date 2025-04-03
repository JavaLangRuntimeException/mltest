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

    # モルフォロジー処理でノイズを除去
    kernel = np.ones((3, 3), np.uint8)
    red_mask = cv2.morphologyEx(red_mask, cv2.MORPH_OPEN, kernel, iterations=1)
    red_mask = cv2.morphologyEx(red_mask, cv2.MORPH_CLOSE, kernel, iterations=1)

    contours, _ = cv2.findContours(red_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    # 面積が小さい輪郭は除外（ここでは50未満の面積を除く）
    filtered_contours = [cnt for cnt in contours if cv2.contourArea(cnt) > 50]
    return filtered_contours

# --- テンプレート画像の読み込み ---
# ロゴ画像はテンプレートマッチング用（グレースケール）と赤色部分の形状比較用（カラー）の両方で使用する
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

# テンプレートマッチングの閾値（必要に応じて調整）
tm_threshold = 0.45
# 赤色領域の形状の類似度の閾値（1.0に近いほど高一致）
red_threshold = 0.8

@app.route('/analyze', methods=['POST'])
def analyze_image():
    data = request.get_json()
    file_name = data.get('file_name')
    content_type = data.get('content_type')
    image_data = data.get('image_data')
    if not file_name or not content_type or not image_data:
        return jsonify({
            'error': 'file_name, content_type または image_data が指定されていません'
        }), 400

    # Base64エンコード済みの画像データをデコードして画像読み込み
    try:
        # プレフィックス (例: "data:image/jpeg;base64,") が含まれている場合は取り除く
        if ',' in image_data:
            header, encoded = image_data.split(',', 1)
        else:
            encoded = image_data

        # Base64をデコードしてバイト列に変換
        decoded_data = base64.b64decode(encoded)

        # バイト列からNumPy配列を作成し、OpenCVで画像を読み込む
        nparr = np.frombuffer(decoded_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise Exception("画像の読み込みに失敗しました")
    except Exception as e:
        logging.exception("画像データのデコードに失敗しました")
        return jsonify({'error': 'Base64デコード失敗', 'details': str(e)}), 500

    try:
        # OpenCVを使用して顔検出開始
        logging.debug("OpenCVを使用して顔検出開始")
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
        if len(faces) == 0:
            raise Exception("顔が検出されませんでした")

        # 重複する検出領域を統合（groupRectangles）
        faces_list = faces.tolist()  # numpy 配列をリストに変換
        faces_grouped, weights = cv2.groupRectangles(faces_list, groupThreshold=1, eps=0.2)
        if len(faces_grouped) == 0:
            faces_grouped = faces_list
        logging.debug(f"統合後の顔検出結果: {faces_grouped}")

        # 各検出領域ごとに DeepFace による解析を実施
        results = []
        for (x, y, w, h) in faces_grouped:
            logging.debug(f"検出された顔領域: x={x}, y={y}, w={w}, h={h}")
            face_roi = img[y:y+h, x:x+w]
            analysis = DeepFace.analyze(face_roi, actions=['emotion'], enforce_detection=False)

            # DeepFace の解析結果が入れ子になっている可能性があるため再帰的に平坦化する関数
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

        # 複数の検出結果がある場合は、各検出結果の感情スコアの平均値を計算
        if results:
            num_results = len(results)
            aggregated = {}
            for detection in results:
                for emotion, score in detection["emotions"].items():
                    aggregated[emotion] = aggregated.get(emotion, 0) + score
            # 平均値を算出（検出数で割る）
            avg_emotions = {emotion: aggregated[emotion] / num_results for emotion in aggregated}
            # 最大値の感情を最終的な dominant_emotion とする
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

# ロゴ検出と赤色部分の形状評価のエンドポイント
@app.route("/detect", methods=["POST"])
def detect():
    data = request.get_json() or {}
    image_data = data.get("image")
    if not image_data:
        return jsonify({"error": "No image data provided"}), 400

    try:
        # Base64文字列をデコードして画像に変換
        img_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            raise ValueError("Image decoding failed")
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    # ----- テンプレートマッチングによるロゴ検出 -----
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    result = cv2.matchTemplate(gray, template_gray, cv2.TM_CCOEFF_NORMED)
    raw_max_val = cv2.minMaxLoc(result)[1]
    logging.debug(f"Template matching raw_max_val: {raw_max_val}")

    # ロゴ候補として、まずはtemplate matchingの閾値をチェック
    if raw_max_val > tm_threshold:
        # ----- 赤色領域の形状比較 -----
        # 入力画像から赤色部分の輪郭抽出
        input_red_contours = get_red_contours(frame)

        best_score = None
        if template_red_contours and input_red_contours:
            # 単一のマッチングスコアを評価するため、各テンプレート輪郭と入力画像の輪郭間で最低の
            # マッチングスコア（すなわち最も類似しているもの）を採用する
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

        # 赤色領域の形状類似度が閾値以上ならロゴが検出されたとする
        logo_detected = red_shape_similarity > red_threshold
    # raw_max_valがtm_threshold以下なら赤色部分の評価はスキップし、ロゴは検出されない
    else:
        logo_detected = False

    return jsonify({
        "logo_detected": logo_detected
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)