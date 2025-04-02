import base64
import cv2
import numpy as np
import logging
from deepface import DeepFace
from flask import Blueprint, request, jsonify

analyze_bp = Blueprint('analyze', __name__)

@analyze_bp.route('/analyze', methods=['POST'])
def analyze_image():
    data = request.get_json()
    file_name = data.get('file_name')
    content_type = data.get('content_type')
    image_data = data.get('image_data')
    if not file_name or not content_type or not image_data:
        return jsonify({
            'error': 'file_name, content_type または image_data が指定されていません'
        }), 400

    # Base64 エンコード済みの画像データをデコードして画像読み込み
    try:
        # プレフィックス (例: "data:image/jpeg;base64,") が含まれている場合は除去
        if ',' in image_data:
            _, encoded = image_data.split(',', 1)
        else:
            encoded = image_data

        decoded_data = base64.b64decode(encoded)
        nparr = np.frombuffer(decoded_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise Exception("画像の読み込みに失敗しました")
    except Exception as e:
        logging.exception("画像データのデコードに失敗しました")
        return jsonify({'error': 'Base64デコード失敗', 'details': str(e)}), 500

    try:
        # 顔検出と DeepFace による解析
        logging.debug("顔検出開始")
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
        if len(faces) == 0:
            raise Exception("顔が検出されませんでした")

        # 重複検出領域の統合
        faces_list = faces.tolist()
        faces_grouped, _ = cv2.groupRectangles(faces_list, groupThreshold=1, eps=0.2)
        if len(faces_grouped) == 0:
            faces_grouped = faces_list
        logging.debug(f"統合後の顔検出結果: {faces_grouped}")

        results = []
        for (x, y, w, h) in faces_grouped:
            logging.debug(f"検出された顔領域: x={x}, y={y}, w={w}, h={h}")
            face_roi = img[y:y+h, x:x+w]
            analysis = DeepFace.analyze(face_roi, actions=['emotion'], enforce_detection=False)

            # DeepFace の解析結果を辞書形式に
            if isinstance(analysis, dict):
                face_result = analysis
                emotions = {emo: float(score) for emo, score in face_result.get('emotion', {}).items()}
                results.append({
                    'dominant_emotion': face_result.get('dominant_emotion', ''),
                    'emotions': emotions
                })
        logging.debug(f"個別の DeepFace 解析結果: {results}")

        # 複数検出の場合は感情スコアの平均を算出
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
        logging.exception("顔検出または DeepFace 解析に失敗しました")
        return jsonify({'error': 'DeepFace解析失敗', 'details': str(e)}), 500

    return jsonify(final_result), 200