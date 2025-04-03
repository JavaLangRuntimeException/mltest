import cv2
import numpy as np
import base64

def decode_base64_image(image_data: str):
    """
    Base64でエンコードされた画像データ（プレフィックスなし）をデコードし，
    OpenCVが利用可能な画像（numpy.ndarray）として返す関数である

    例:
      入力: "/9j/4AAQSkZJRgABAQAAAQABAAD/..."
    """
    try:
        # Base64文字列をデコードしてバイト列に変換する
        decoded_data = base64.b64decode(image_data)
        # バイト列からNumPy配列を生成する
        nparr = np.frombuffer(decoded_data, np.uint8)
        # NumPy配列から画像をデコードし，カラー画像（BGR形式）として取得する
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        # 画像のデコードに失敗した場合は，例外を発生させる
        if img is None:
            raise Exception("OpenCVで画像をデコードできませんでした")
        return img
    except Exception as e:
        # エラー発生時に詳細なエラーメッセージとともに例外を再発生させる
        raise Exception("Base64デコードに失敗しました: " + str(e))

def get_red_contours(image):
    """
    BGR画像から赤い部分の輪郭を抽出する関数である
    """
    # 画像をBGRからHSV色空間に変換する
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    # 赤色の範囲1の下限および上限を定義する
    lower_red1 = np.array([0, 70, 50])
    upper_red1 = np.array([10, 255, 255])

    # 赤色の範囲2の下限および上限を定義する
    lower_red2 = np.array([170, 70, 50])
    upper_red2 = np.array([180, 255, 255])

    # HSV画像から範囲1にあるピクセルのマスクを生成する
    mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
    # HSV画像から範囲2にあるピクセルのマスクを生成する
    mask2 = cv2.inRange(hsv, lower_red2, upper_red2)

    # 2つのマスクを論理和で結合し，最終的な赤色マスクを生成する
    red_mask = cv2.bitwise_or(mask1, mask2)

    # ノイズ除去のため，オープニング処理（膨張の前に収縮）を実施する
    kernel = np.ones((3, 3), np.uint8)
    red_mask = cv2.morphologyEx(red_mask, cv2.MORPH_OPEN, kernel, iterations=1)

    # 小さな穴がある場合，クロージング処理（収縮の前に膨張）を実施する
    red_mask = cv2.morphologyEx(red_mask, cv2.MORPH_CLOSE, kernel, iterations=1)

    # 赤色領域の輪郭を抽出する
    contours, _ = cv2.findContours(red_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # 面積が50より大きい輪郭のみをフィルタリングする
    filtered_contours = [cnt for cnt in contours if cv2.contourArea(cnt) > 50]

    return filtered_contours