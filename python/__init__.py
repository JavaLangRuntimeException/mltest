import logging
import boto3
from flask import Flask

logging.basicConfig(level=logging.DEBUG)
boto3.set_stream_logger('botocore', level=logging.DEBUG)

def create_app():
    app = Flask(__name__)
    from routes.analyze import analyze_bp
    from routes.detect import detect_bp
    app.register_blueprint(analyze_bp)
    app.register_blueprint(detect_bp)
    return app