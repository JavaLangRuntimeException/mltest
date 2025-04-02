from flask import Flask
from .analyze import analyze_bp
from .detect import detect_bp

def register_blueprints(app: Flask):
    app.register_blueprint(analyze_bp)
    app.register_blueprint(detect_bp)