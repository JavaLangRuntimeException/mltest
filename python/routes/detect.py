import base64
import cv2
import numpy as np
import logging
from flask import Blueprint, request, jsonify
from utils.cv_utils import get_red_contours

detect_bp = Blueprint('detect', __name__)

# --- テンプレート画像の読み込み ---
template_path = './logo.png'
template_gray = cv2.imread(template_path, cv2.IMREAD_GRAYSCALE)
if template_gray is None:
    logging.error("テンプレート画像の読み込みに失敗しました。パスを確認してください。")
    exit(1)

template_color = cv2.imread(template_path, cv2.IMREAD_COLOR)
if template_color is None:
    logging.error("テンプレート画像（カラー）の読み込みに失敗しました。パスを確認してください。")
    exit(1)

template_red_contours = get_red_contours(template_color)
if not template_red_contours:
    logging.warning("テンプレート画像から赤い輪郭が抽出できませんでした。")

# 閾値（必要に応じて調整）
tm_threshold = 0.4
red_threshold = 0.8

@detect_bp.route('/detect', methods=['POST'])
def detect():
    data = request.get_json() or {}
    image_data = data.get("image")
    if not image_data:
        return jsonify({"error": "No image data provided"}), 400

    try:
        img_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            raise ValueError("画像のデコードに失敗しました")
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    # テンプレートマッチングによるロゴ検出
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

    return jsonify({"logo_detected": logo_detected}), 200