from flask import Blueprint, request, jsonify
import db_client
from db_client import DBServiceError

users_bp = Blueprint("users", __name__)


def error_response(message, status_code):
    return jsonify({"error": message}), status_code


def handle_db_error(e: DBServiceError):
    return error_response(e.message, e.status_code)


# degrees dropdown endpoint, admin curated list
@users_bp.route("/api/degrees", methods=["GET"])
def get_degrees():
    try:
        degrees = db_client.list_degrees()
        return jsonify({"count": len(degrees), "degrees": degrees}), 200
    except DBServiceError as e:
        return handle_db_error(e)
    except Exception as e:
        return error_response(str(e), 500)

    