from flask import Blueprint, request, jsonify
import cv2
import logging
from utils import decode_base64_image, get_red_contours
from template import template_gray, template_red_contours, tm_threshold, red_threshold

# Blueprint を定義する
# この Blueprint は '/detect' エンドポイントを提供する
detect_bp = Blueprint('detect', __name__)

@detect_bp.route('/detect', methods=['POST'])
def detect():
    """
    [POST] /detect
    受け取るJSON例:
    {
      "image_data": "/9j/4AAQSkZJRgABAQAAAQABAAD/..."
    }

    テンプレートマッチングと赤色領域の輪郭評価によるロゴ検出を行う
    """
    # リクエストから JSON データを取得し，画像データを抽出する
    data = request.get_json() or {}
    image_data = data.get("image_data")

    # 画像データが存在しない場合はエラーレスポンスを返す
    if not image_data:
        return jsonify({"error": "image_data が指定されていません"}), 400

    try:
        # Base64 エンコードされた画像データをデコードし，OpenCV で扱える画像形式に変換する
        frame = decode_base64_image(image_data)
    except Exception as e:
        # 画像デコードに失敗した場合はエラーメッセージを返す
        return jsonify({"error": str(e)}), 400

    # 画像をグレースケールに変換する
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # テンプレートマッチングを実施する結果は類似度の行列である
    result = cv2.matchTemplate(gray, template_gray, cv2.TM_CCOEFF_NORMED)

    # 類似度の最大値を取得するこれはテンプレートとの一致度を示す
    raw_max_val = cv2.minMaxLoc(result)[1]
    logging.debug(f"Template matching raw_max_val: {raw_max_val}")

    # テンプレートマッチングの類似度が閾値を超える場合，さらに赤色領域の輪郭評価を行う
    if raw_max_val > tm_threshold:
        # 入力画像から赤色領域の輪郭を抽出する処理を実施する
        input_red_contours = get_red_contours(frame)
        best_score = None

        # テンプレート画像と入力画像それぞれで抽出された赤色輪郭が存在する場合，
        # 各輪郭の形状類似度を計算する
        if template_red_contours and input_red_contours:
            for temp_cnt in template_red_contours:
                for inp_cnt in input_red_contours:
                    # 輪郭間の類似度を計算する値が低いほど形状が近いことを示す
                    score = cv2.matchShapes(temp_cnt, inp_cnt, cv2.CONTOURS_MATCH_I1, 0.0)
                    if best_score is None or score < best_score:
                        best_score = score

        # 最も類似している輪郭が見つかった場合，類似度を反比例の計算で求める
        if best_score is not None:
            red_shape_similarity = 1.0 / (1.0 + best_score)
        else:
            red_shape_similarity = 0.0

        logging.debug(f"Red shape similarity: {red_shape_similarity}")
        # 赤色領域の類似度が設定した閾値を上回る場合，ロゴが検出されたと判断する
        logo_detected = red_shape_similarity > red_threshold
    else:
        # テンプレートマッチングの結果が閾値に達していない場合は，ロゴ検出は False とする
        logo_detected = False

    # ロゴ検出の結果を JSON 形式で返す
    return jsonify({
        "logo_detected": logo_detected
    }), 200