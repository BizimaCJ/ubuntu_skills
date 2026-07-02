from flask import Flask, request, jsonify
from datetime import datetime
import sqlite3
from config import DATABASE

app = Flask(__name__)

#database connection

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row  # lets us access columns by name
    return conn


#api routes helpers

def error_response(message, status_code):
    return jsonify({"error": message}), status_code


def find_skill_by_name(conn, skill_name):
    cur = conn.execute(
        "SELECT * FROM Skills WHERE LOWER(skill_name) = LOWER(?)", (skill_name,)
    )
    return cur.fetchone()


def find_skill_by_id(conn, skill_id):
    cur = conn.execute("SELECT * FROM Skills WHERE skill_id = ?", (skill_id,))
    return cur.fetchone()


#add skill endpoint [POST Method]
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
        conn = get_db()

        # Don't create duplicate skills in the catalog
        existing = find_skill_by_name(conn, skill_name)
        if existing:
            new_skill = dict(existing)
        else:
            cur = conn.execute(
                "INSERT INTO Skills (skill_name, category) VALUES (?, ?)",
                (skill_name, category),
            )
            conn.commit()
            new_skill = {
                "skill_id": cur.lastrowid,
                "skill_name": skill_name,
                "category": category,
            }

        response_body = {
            "message": "Skill added successfully",
            "skill": new_skill,
        }

        # If a user_id + type was provided, also link the skill to that user
        if user_id is not None:
            cur = conn.execute(
                "INSERT INTO UserSkills (user_id, skill_id, type) VALUES (?, ?, ?)",
                (user_id, new_skill["skill_id"], skill_type),
            )
            conn.commit()
            response_body["user_skill"] = {
                "id": cur.lastrowid,
                "user_id": user_id,
                "skill_id": new_skill["skill_id"],
                "type": skill_type,
            }

        conn.close()
        return jsonify(response_body), 201

    except Exception as e:
        return error_response(str(e), 500)
    
#view users skill endpoint [GET method]
@app.route("/api/users/<int:user_id>/skills", methods=["GET"])
def get_user_skills(user_id):
    """
    query string: ?type=teach  or  ?type=learn  to filter.
    """
    type_filter = request.args.get("type")
    if type_filter and type_filter not in ("teach", "learn"):
        return error_response("'type' query param must be 'teach' or 'learn'", 400)

    try:
        conn = get_db()

        query = """
            SELECT UserSkills.skill_id, Skills.skill_name, Skills.category,
                   UserSkills.type
            FROM UserSkills
            JOIN Skills ON Skills.skill_id = UserSkills.skill_id
            WHERE UserSkills.user_id = ?
        """
        params = [user_id]

        if type_filter:
            query += " AND UserSkills.type = ?"
            params.append(type_filter)

        rows = conn.execute(query, params).fetchall()
        conn.close()

        skills = [dict(row) for row in rows]

        return jsonify({
            "user_id": user_id,
            "count": len(skills),
            "skills": skills,
        }), 200

    except Exception as e:
        return error_response(str(e), 500)