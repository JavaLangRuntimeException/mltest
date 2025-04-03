import logging
import cv2
from utils import get_red_contours

# テンプレート画像の読み込み
template_gray = cv2.imread('./logo.png', cv2.IMREAD_GRAYSCALE)
if template_gray is None:
    logging.error("テンプレート画像の読み込みに失敗しました．パスが正しいか確認してください")
    exit(1)

template_color = cv2.imread('./logo.png', cv2.IMREAD_COLOR)
if template_color is None:
    logging.error("テンプレート画像（カラー）の読み込みに失敗しました．パスが正しいか確認してください。")
    exit(1)

# テンプレート画像から赤い部分の輪郭を抽出
template_red_contours = get_red_contours(template_color)
if not template_red_contours:
    logging.warning("テンプレート画像から赤い部分の輪郭が抽出できませんでした．")

# テンプレートマッチングおよび赤色形状類似度の閾値
tm_threshold = 0.43
red_threshold = 0.8