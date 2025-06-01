from flask import Blueprint, request, jsonify
import cv2
import logging
from deepface import DeepFace
from utils import decode_base64_image

# Blueprint を定義している
# この Blueprint は '/analyze' エンドポイントを提供する
analyze_bp = Blueprint('analyze', __name__)

@analyze_bp.route('/analyze', methods=['POST'])
def analyze_image():
    """
    [POST] /analyze
    受け取るJSON例:
    {
       "image_data": "/9j/4AAQSkZJRgABAQAAAQABAAD/..."
    }

    画像から顔検出を行い，DeepFace を利用して感情解析を実施する
    """
    # リクエストから JSON データを取得する
    data = request.get_json()

    # 'image_data' キーから Base64 エンコードされた画像データを取得する
    image_data = data.get('image_data')

    # 画像データが存在しない場合，エラーメッセージと共に 400 のステータスコードを返す
    if not image_data:
        return jsonify({'error': 'image_data が指定されていません'}), 400

    # Base64 エンコードされた画像データをデコードし，画像に変換する処理を行う
    try:
        img = decode_base64_image(image_data)
    except Exception as e:
        # 画像のデコードに失敗した場合，エラーログを出力し，500 エラーと共にエラーレスポンスを返す
        logging.exception("画像データのデコードに失敗しました")
        return jsonify({'error': 'Base64デコード失敗', 'details': str(e)}), 500

    try:
        # OpenCV を使用して顔検出を開始する
        logging.debug("OpenCVを使用して顔検出開始")

        # 画像をグレースケールに変換する
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Haar カスケードを用いて顔検出のための分類器を初期化する
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

        # グレースケール画像から顔を検出する
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

        # 検出された顔が存在しなければ，例外を発生させる
        if len(faces) == 0:
            raise Exception("顔が検出されませんでした")

        # 検出された顔の領域情報をリストに変換する
        faces_list = faces.tolist()

        # 重複した顔検出の領域を統合するために，グループ化を行う
        faces_grouped, weights = cv2.groupRectangles(faces_list, groupThreshold=1, eps=0.2)

        # グループ化の結果が空の場合，元のリストを使用する
        if len(faces_grouped) == 0:
            faces_grouped = faces_list
        logging.debug(f"統合後の顔検出結果: {faces_grouped}")

        results = []
        # 検出された各顔領域に対して，感情解析を実施する
        for (x, y, w, h) in faces_grouped:
            logging.debug(f"検出された顔領域: x={x}, y={y}, w={w}, h={h}")

            # 顔領域を抽出する
            face_roi = img[y:y+h, x:x+w]

            # DeepFace を用いて，顔領域の感情解析を行う
            # enforce_detection=False により，顔検出の精度に問題がある場合でも解析を試みる
            analysis = DeepFace.analyze(face_roi, actions=['emotion'], enforce_detection=False)

            # DeepFace の解析結果は辞書またはリストで返されるため，結果をフラットに展開するための関数を定義する
            def flatten_deepface_result(result):
                # 辞書の場合はリストにして返す
                if isinstance(result, dict):
                    return [result]
                # リストの場合，各要素を再帰的に展開する
                elif isinstance(result, list):
                    flattened = []
                    for item in result:
                        flattened.extend(flatten_deepface_result(item))
                    return flattened
                else:
                    return []

            # 解析結果をフラットなリスト形式に変換する
            flattened_results = flatten_deepface_result(analysis)
            for face_result in flattened_results:
                # 各感情ごとのスコアを浮動小数点数に変換する
                emotions = {emo: float(score) for emo, score in face_result.get('emotion', {}).items()}
                # 各顔の解析結果（支配的な感情と各感情のスコア）を結果リストに追加する
                results.append({
                    'dominant_emotion': face_result.get('dominant_emotion', ''),
                    'emotions': emotions
                })
        logging.debug(f"個別の DeepFace解析結果: {results}")

        # 複数の顔検出結果が存在する場合，各感情のスコアを集計し平均を計算する
        if results:
            num_results = len(results)
            aggregated = {}
            # すべての感情スコアを足し合わせる
            for detection in results:
                for emotion, score in detection["emotions"].items():
                    aggregated[emotion] = aggregated.get(emotion, 0) + score
            # 平均スコアを計算する
            avg_emotions = {emotion: aggregated[emotion] / num_results for emotion in aggregated}
            # 最も高い平均スコアを持つ感情を支配的な感情とする
            final_dominant_emotion = max(avg_emotions, key=avg_emotions.get)
        else:
            avg_emotions = {}
            final_dominant_emotion = ""

        # Todo: ここにProductを選択する仕組みを追加する

        # 最終的な解析結果を辞書形式でまとめる
        final_result = {
            "dominant_emotion": final_dominant_emotion,
            "emotions": avg_emotions
        }
        logging.debug(f"最終的な解析結果: {final_result}")
    except Exception as e:
        # 顔検出または DeepFace 解析の処理中に例外が発生した場合，エラーログを出力しエラーレスポンスを返す
        logging.exception("顔検出またはDeepFace解析に失敗しました")
        return jsonify({'error': 'DeepFace解析失敗', 'details': str(e)}), 500

    # 正常に解析が完了した場合，解析結果を JSON 形式で返す
    return jsonify(final_result), 200