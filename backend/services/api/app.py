"""
api service entrypoint.
"""

import importlib

from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from config import PORT
from db_client import DBServiceError
from routes_sessions import sessions_bp

OPTIONAL_BLUEPRINTS = [
    ("routes_users", "users_bp"),
    ("routes_skills", "skills_bp"),
    ("routes_group_sessions", "group_sessions_bp"),
    ("routes_messages", "messages_bp"),
    ("routes_notifications", "notifications_bp"),
]


def create_app():
    app = Flask(__name__)
    CORS(app)

    app.register_blueprint(sessions_bp)

    for module_name, attr_name in OPTIONAL_BLUEPRINTS:
        try:
            module = importlib.import_module(module_name)
        except ImportError:
            continue
        blueprint = getattr(module, attr_name, None)
        if blueprint is not None:
            app.register_blueprint(blueprint)

    @app.errorhandler(DBServiceError)
    def handle_db_service_error(err):
        return jsonify({"error": err.message}), err.status_code

    @app.errorhandler(HTTPException)
    def handle_http_exception(err):
        return jsonify({"error": err.description}), err.code

    @app.errorhandler(Exception)
    def handle_unexpected_error(err):
        app.logger.exception("Unhandled error in api service")
        return jsonify({"error": str(err)}), 500

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "service": "api"}), 200

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=PORT, use_reloader=False)
