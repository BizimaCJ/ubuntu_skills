from flask import Blueprint, request, jsonify
import db_client
from db_client import DBServiceError

skills_bp = Blueprint("skills", __name__)


def error_response(message, status_code):
    return jsonify({"error": message}), status_code


def handle_db_error(e: DBServiceError):
    return error_response(e.message, e.status_code)


# add a teach or learn skill listing to a user's profile
@skills_bp.route("/api/users/<int:user_id>/skills", methods=["POST"])
def add_user_skill(user_id):
    """
    Expected JSON body:
    { "category_id": 3, "description": "React and Tailwind", "skill_type": "teach" }
    category_id must come from the admin curated SkillCategories list, the
    student only writes the free text description within that category.
    """
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body must be JSON", 400)

    category_id = data.get("category_id")
    description = data.get("description")
    skill_type = data.get("skill_type")

    if category_id is None or not description:
        return error_response("'category_id' and 'description' are required", 400)

    if skill_type not in ("teach", "learn"):
        return error_response("'skill_type' must be 'teach' or 'learn'", 400)

    try:
        new_user_skill = db_client.insert_user_skill(user_id, category_id, description, skill_type)
        return jsonify({"message": "Skill added to profile", "user_skill": new_user_skill}), 201
    except DBServiceError as e:
        return handle_db_error(e)
    except Exception as e:
        return error_response(str(e), 500)
