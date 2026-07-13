from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import db_client
from db_client import DBServiceError

app = Flask(__name__)
CORS(app)


# api routes helpers

def error_response(message, status_code):
    return jsonify({"error": message}), status_code


def handle_db_error(e: DBServiceError):
    return error_response(e.message, e.status_code)


# add skill endpoint [POST Method]
@app.route("/api/skills", methods=["POST"])
def add_skill():
    """
    Expected JSON body:
    {
        "skill_name": "Video Editing",
        "category": "Design",
        "user_id": 1,
        "type": "teach"
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body must be JSON", 400)

    skill_name = data.get("skill_name")
    category = data.get("category")
    user_id = data.get("user_id")
    skill_type = data.get("type")

    if not skill_name:
        return error_response("'skill_name' is required", 400)

    if user_id is not None and skill_type not in ("teach", "learn"):
        return error_response(
            "'type' must be either 'teach' or 'learn' when 'user_id' is provided",
            400,
        )

    try:
        # Don't create duplicate skills in the catalog
        existing = db_client.get_skill_by_name(skill_name)
        if existing:
            new_skill = existing
        else:
            new_skill = db_client.insert_skill(skill_name, category)

        response_body = {
            "message": "Skill added successfully",
            "skill": new_skill,
        }

        # If a user_id + type was provided, also link the skill to that user
        if user_id is not None:
            user_skill = db_client.insert_user_skill(user_id, new_skill["skill_id"], skill_type)
            response_body["user_skill"] = user_skill

        return jsonify(response_body), 201

    except DBServiceError as e:
        return handle_db_error(e)
    except Exception as e:
        return error_response(str(e), 500)


# list all skills endpoint
@app.route("/api/skills", methods=["GET"])
def list_skills():
    """List every skill in the catalog."""
    try:
        skills = db_client.list_skills()
        return jsonify({"count": len(skills), "skills": skills}), 200
    except DBServiceError as e:
        return handle_db_error(e)
    except Exception as e:
        return error_response(str(e), 500)


# skill details endpoint
@app.route("/api/skills/<int:skill_id>", methods=["GET"])
def get_skill(skill_id):
    """Get a single skill's details."""
    try:
        skill = db_client.get_skill_by_id(skill_id)
        if not skill:
            return error_response(f"No skill found with skill_id {skill_id}", 404)
        return jsonify({"skill": skill}), 200
    except DBServiceError as e:
        return handle_db_error(e)
    except Exception as e:
        return error_response(str(e), 500)


# view users skill endpoint [GET method]
@app.route("/api/users/<int:user_id>/skills", methods=["GET"])
def get_user_skills(user_id):
    """
    query string: ?type=teach  or  ?type=learn  to filter.
    """
    type_filter = request.args.get("type")
    if type_filter and type_filter not in ("teach", "learn"):
        return error_response("'type' query param must be 'teach' or 'learn'", 400)

    try:
        skills = db_client.get_user_skills(user_id, type_filter)
        return jsonify({
            "user_id": user_id,
            "count": len(skills),
            "skills": skills,
        }), 200
    except DBServiceError as e:
        return handle_db_error(e)
    except Exception as e:
        return error_response(str(e), 500)


# update skill endpoint
@app.route("/api/skills/<int:skill_id>", methods=["PATCH"])
def update_skill(skill_id):
    """
    Edit a skill's name and/or category.

    Expected JSON body:
    { "skill_name": "New name", "category": "New category" }
    """
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body must be JSON", 400)

    skill_name = data.get("skill_name")
    category = data.get("category")

    if skill_name is None and category is None:
        return error_response(
            "Provide at least one of 'skill_name' or 'category' to update", 400
        )

    try:
        skill = db_client.get_skill_by_id(skill_id)
        if not skill:
            return error_response(f"No skill found with skill_id {skill_id}", 404)

        updated_name = skill_name if skill_name is not None else skill["skill_name"]
        updated_category = category if category is not None else skill["category"]

        updated_skill = db_client.update_skill(skill_id, updated_name, updated_category)

        return jsonify({
            "message": "Skill updated successfully",
            "skill": updated_skill,
        }), 200

    except DBServiceError as e:
        return handle_db_error(e)
    except Exception as e:
        return error_response(str(e), 500)


# delete skill endpoint
@app.route("/api/skills/<int:skill_id>", methods=["DELETE"])
def delete_skill(skill_id):
    """
    Remove a skill from the catalog. Blocked (409) if the skill is still
    referenced by UserSkills, Verifications, or Projects, so deleting a
    skill can never silently orphan other records.
    """
    try:
        skill = db_client.get_skill_by_id(skill_id)
        if not skill:
            return error_response(f"No skill found with skill_id {skill_id}", 404)

        in_use = db_client.skill_usage_count(skill_id)
        if in_use > 0:
            return error_response(
                "Cannot delete this skill — it is still referenced by "
                "UserSkills, Verifications, or Projects records",
                409,
            )

        db_client.delete_skill(skill_id)

        return jsonify({"message": f"Skill {skill_id} deleted successfully"}), 200

    except DBServiceError as e:
        return handle_db_error(e)
    except Exception as e:
        return error_response(str(e), 500)


# delete user skill
@app.route("/api/users/<int:user_id>/skills/<int:skill_id>", methods=["DELETE"])
def remove_user_skill(user_id, skill_id):
    """
    Remove a skill a user listed for themselves (unlink it, doesn't touch
    the Skills catalog). Optional ?type=teach|learn to remove only that
    specific listing if the user has both a teach and a learn row for the
    same skill.
    """
    type_filter = request.args.get("type")
    if type_filter and type_filter not in ("teach", "learn"):
        return error_response("'type' query param must be 'teach' or 'learn'", 400)

    try:
        deleted_count = db_client.delete_user_skill(user_id, skill_id, type_filter)

        if deleted_count == 0:
            return error_response(
                "No matching UserSkills record found for that user/skill", 404
            )

        return jsonify({
            "message": "Skill removed from user's profile",
            "user_id": user_id,
            "skill_id": skill_id,
            "removed_count": deleted_count,
        }), 200

    except DBServiceError as e:
        return handle_db_error(e)
    except Exception as e:
        return error_response(str(e), 500)


# list matching tutors
@app.route("/api/skills/<int:skill_id>/tutors", methods=["GET"])
def get_skill_tutors(skill_id):
    try:
        skill = db_client.get_skill_by_id(skill_id)
        if not skill:
            return error_response(f"No skill found with skill_id {skill_id}", 404)

        tutors = db_client.skill_tutors(skill_id)

        return jsonify({
            "skill_id": skill_id,
            "skill_name": skill["skill_name"],
            "count": len(tutors),
            "tutors": tutors,
        }), 200

    except DBServiceError as e:
        return handle_db_error(e)
    except Exception as e:
        return error_response(str(e), 500)


# verify user skill endpoint
@app.route("/api/skills/verify", methods=["POST"])
def submit_verification():
    """
    Submit a user's claimed skill for admin verification.
    Expected JSON body: { "user_id": 4, "skill_id": 1 }
    """
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body must be JSON", 400)

    user_id = data.get("user_id")
    skill_id = data.get("skill_id")

    if user_id is None or skill_id is None:
        return error_response("'user_id' and 'skill_id' are required", 400)

    try:
        skill = db_client.get_skill_by_id(skill_id)
        if not skill:
            return error_response(f"No skill found with skill_id {skill_id}", 404)

        # NOTE: schema.sql's Verifications table has no submitted_at column,
        # so that timestamp is generated for the response only, not stored.
        verification_id = db_client.insert_verification(user_id, skill_id)

        verification = {
            "verification_id": verification_id,
            "user_id": user_id,
            "skill_id": skill_id,
            "status": "pending",
            "verified_by": None,
            "submitted_at": datetime.utcnow().isoformat() + "Z",
        }

        return jsonify({
            "message": "Skill submitted for verification",
            "verification": verification,
        }), 201

    except DBServiceError as e:
        return handle_db_error(e)
    except Exception as e:
        return error_response(str(e), 500)


# list all skills submitted for verification
@app.route("/api/verifications", methods=["GET"])
def list_verifications():
    """
    List all verification records. Acts as the admin queue.
    Optional query string: ?status=pending|approved|rejected
    """
    status_filter = request.args.get("status")
    if status_filter and status_filter not in ("pending", "approved", "rejected"):
        return error_response(
            "'status' query param must be 'pending', 'approved', or 'rejected'", 400
        )

    try:
        verifications = db_client.list_verifications(status_filter)
        return jsonify({
            "count": len(verifications),
            "verifications": verifications,
        }), 200

    except DBServiceError as e:
        return handle_db_error(e)
    except Exception as e:
        return error_response(str(e), 500)


# verification details endpoint
@app.route("/api/verifications/<int:verification_id>", methods=["GET"])
def get_verification(verification_id):
    """Get a single verification record's details."""
    try:
        verification = db_client.get_verification_by_id(verification_id)
        if not verification:
            return error_response(
                f"No verification found with verification_id {verification_id}", 404
            )
        return jsonify({"verification": verification}), 200
    except DBServiceError as e:
        return handle_db_error(e)
    except Exception as e:
        return error_response(str(e), 500)


# list users verification history endpoint
@app.route("/api/users/<int:user_id>/verifications", methods=["GET"])
def get_user_verifications(user_id):
    """A user's full verification history, newest first."""
    try:
        verifications = db_client.get_user_verifications(user_id)
        return jsonify({
            "user_id": user_id,
            "count": len(verifications),
            "verifications": verifications,
        }), 200

    except DBServiceError as e:
        return handle_db_error(e)
    except Exception as e:
        return error_response(str(e), 500)


# update verification status endpoint
@app.route("/api/verifications/<int:verification_id>", methods=["PATCH"])
def update_verification(verification_id):
    """
    Admin approves or rejects a pending verification.

    Expected JSON body:
    { "status": "approved", "verified_by": "admin_jane" }
    """
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body must be JSON", 400)

    status = data.get("status")
    verified_by = data.get("verified_by")

    if status not in ("pending", "approved", "rejected"):
        return error_response(
            "'status' must be 'pending', 'approved', or 'rejected'", 400
        )

    try:
        verification = db_client.get_verification_by_id(verification_id)
        if not verification:
            return error_response(
                f"No verification found with verification_id {verification_id}", 404
            )

        updated = db_client.update_verification(verification_id, status, verified_by)

        return jsonify({
            "message": f"Verification {verification_id} updated to '{status}'",
            "verification": updated,
        }), 200

    except DBServiceError as e:
        return handle_db_error(e)
    except Exception as e:
        return error_response(str(e), 500)


# match creation endpoint
@app.route("/api/projects", methods=["POST"])
def create_project():
    """
    Log a completed skill exchange for a user.

    Expected JSON body:
    {
        "user_id": 1,
        "skill_id": 4,
        "description": "Received a math tutoring session from Eric."
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body must be JSON", 400)

    user_id = data.get("user_id")
    skill_id = data.get("skill_id")
    description = data.get("description")

    if user_id is None or skill_id is None:
        return error_response("'user_id' and 'skill_id' are required", 400)

    try:
        skill = db_client.get_skill_by_id(skill_id)
        if not skill:
            return error_response(f"No skill found with skill_id {skill_id}", 404)

        project_id = db_client.insert_project(user_id, skill_id, description)
        new_project = db_client.get_project_by_id(project_id)

        return jsonify({
            "message": "Project logged successfully",
            "project": new_project,
        }), 201

    except DBServiceError as e:
        return handle_db_error(e)
    except Exception as e:
        return error_response(str(e), 500)


# match detail endpoint
@app.route("/api/projects/<int:project_id>", methods=["GET"])
def get_project(project_id):
    """Get a single project's details."""
    try:
        project = db_client.get_project_by_id(project_id)
        if not project:
            return error_response(f"No project found with project_id {project_id}", 404)
        return jsonify({"project": project}), 200
    except DBServiceError as e:
        return handle_db_error(e)
    except Exception as e:
        return error_response(str(e), 500)


# user match history endpoint
@app.route("/api/users/<int:user_id>/projects", methods=["GET"])
def get_user_projects(user_id):
    """A user's full exchange/project history, newest first."""
    try:
        projects = db_client.get_user_projects(user_id)
        return jsonify({
            "user_id": user_id,
            "count": len(projects),
            "projects": projects,
        }), 200
    except DBServiceError as e:
        return handle_db_error(e)
    except Exception as e:
        return error_response(str(e), 500)


# server
if __name__ == "__main__":
    app.run(debug=True, port=5001, use_reloader=False)
