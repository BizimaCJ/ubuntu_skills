"""
database_service
=================
This is the single service allowed to open the SQLite file and run SQL.
`api/` and `auth/` no longer import sqlite3 at all - they call the small
HTTP endpoints defined here instead.

Every route here is a thin, purpose-built wrapper around one parametrized
SQL statement (or a couple of related ones). It does NOT contain business
rules like "is this email already taken" - that kind of decision-making
and the associated HTTP status codes still live in api/ and auth/. This
service's only job is: take simple JSON in, run safe parametrized SQL,
return simple JSON out.
"""

from flask import Flask, request, jsonify
import sqlite3
from config import DATABASE, PORT

app = Flask(__name__)


def get_db():
    conn = sqlite3.connect(DATABASE, timeout=10, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def row_or_none(row):
    return dict(row) if row else None


def rows_to_list(rows):
    return [dict(row) for row in rows]


def error_response(message, status_code=500):
    return jsonify({"error": message}), status_code


# ───────────────────────── Users ─────────────────────────

@app.route("/users", methods=["POST"])
def insert_user():
    """
    Body: { "name": ..., "email": ..., "password_hash": ..., "bio": null }
    Returns the new user_id. Caller (auth service) is responsible for
    hashing the password and for checking whether the email is already
    taken before calling this.
    """
    data = request.get_json(silent=True) or {}
    name = data.get("name")
    email = data.get("email")
    password_hash = data.get("password_hash")
    bio = data.get("bio")

    if not name or not email or not password_hash:
        return error_response("'name', 'email', and 'password_hash' are required", 400)

    try:
        conn = get_db()
        cur = conn.execute(
            "INSERT INTO Users (name, email, password, bio) VALUES (?, ?, ?, ?)",
            (name, email, password_hash, bio),
        )
        conn.commit()
        user_id = cur.lastrowid
        conn.close()
        return jsonify({"user_id": user_id}), 201
    except sqlite3.IntegrityError as e:
        return error_response(str(e), 409)
    except Exception as e:
        return error_response(str(e))


@app.route("/users/by-email/<path:email>", methods=["GET"])
def get_user_by_email(email):
    try:
        conn = get_db()
        user = conn.execute("SELECT * FROM Users WHERE email = ?", (email,)).fetchone()
        conn.close()
        return jsonify({"user": row_or_none(user)}), 200
    except Exception as e:
        return error_response(str(e))


@app.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    try:
        conn = get_db()
        user = conn.execute("SELECT * FROM Users WHERE user_id = ?", (user_id,)).fetchone()
        conn.close()
        return jsonify({"user": row_or_none(user)}), 200
    except Exception as e:
        return error_response(str(e))


# ───────────────────────── Skills ─────────────────────────

@app.route("/skills", methods=["GET"])
def list_skills():
    try:
        conn = get_db()
        rows = conn.execute("SELECT * FROM Skills").fetchall()
        conn.close()
        return jsonify({"skills": rows_to_list(rows)}), 200
    except Exception as e:
        return error_response(str(e))


@app.route("/skills", methods=["POST"])
def insert_skill():
    data = request.get_json(silent=True) or {}
    skill_name = data.get("skill_name")
    category = data.get("category")
    if not skill_name:
        return error_response("'skill_name' is required", 400)
    try:
        conn = get_db()
        cur = conn.execute(
            "INSERT INTO Skills (skill_name, category) VALUES (?, ?)",
            (skill_name, category),
        )
        conn.commit()
        skill_id = cur.lastrowid
        conn.close()
        return jsonify({"skill_id": skill_id, "skill_name": skill_name, "category": category}), 201
    except Exception as e:
        return error_response(str(e))


@app.route("/skills/by-name/<path:skill_name>", methods=["GET"])
def get_skill_by_name(skill_name):
    try:
        conn = get_db()
        skill = conn.execute(
            "SELECT * FROM Skills WHERE LOWER(skill_name) = LOWER(?)", (skill_name,)
        ).fetchone()
        conn.close()
        return jsonify({"skill": row_or_none(skill)}), 200
    except Exception as e:
        return error_response(str(e))


@app.route("/skills/<int:skill_id>", methods=["GET"])
def get_skill(skill_id):
    try:
        conn = get_db()
        skill = conn.execute("SELECT * FROM Skills WHERE skill_id = ?", (skill_id,)).fetchone()
        conn.close()
        return jsonify({"skill": row_or_none(skill)}), 200
    except Exception as e:
        return error_response(str(e))


@app.route("/skills/<int:skill_id>", methods=["PATCH"])
def update_skill(skill_id):
    data = request.get_json(silent=True) or {}
    skill_name = data.get("skill_name")
    category = data.get("category")
    try:
        conn = get_db()
        conn.execute(
            "UPDATE Skills SET skill_name = ?, category = ? WHERE skill_id = ?",
            (skill_name, category, skill_id),
        )
        conn.commit()
        updated = conn.execute("SELECT * FROM Skills WHERE skill_id = ?", (skill_id,)).fetchone()
        conn.close()
        return jsonify({"skill": row_or_none(updated)}), 200
    except Exception as e:
        return error_response(str(e))


@app.route("/skills/<int:skill_id>", methods=["DELETE"])
def delete_skill(skill_id):
    try:
        conn = get_db()
        conn.execute("DELETE FROM Skills WHERE skill_id = ?", (skill_id,))
        conn.commit()
        conn.close()
        return jsonify({"deleted": True}), 200
    except Exception as e:
        return error_response(str(e))


@app.route("/skills/<int:skill_id>/usage-count", methods=["GET"])
def skill_usage_count(skill_id):
    """How many rows in UserSkills/Verifications/Projects still reference this skill."""
    try:
        conn = get_db()
        count = (
            conn.execute("SELECT COUNT(*) AS c FROM UserSkills WHERE skill_id = ?", (skill_id,)).fetchone()["c"]
            + conn.execute("SELECT COUNT(*) AS c FROM Verifications WHERE skill_id = ?", (skill_id,)).fetchone()["c"]
            + conn.execute("SELECT COUNT(*) AS c FROM Projects WHERE skill_id = ?", (skill_id,)).fetchone()["c"]
        )
        conn.close()
        return jsonify({"count": count}), 200
    except Exception as e:
        return error_response(str(e))


@app.route("/skills/<int:skill_id>/tutors", methods=["GET"])
def skill_tutors(skill_id):
    try:
        conn = get_db()
        rows = conn.execute(
            """
            SELECT Users.user_id, Users.name, Users.email, Users.bio
            FROM UserSkills
            JOIN Users ON Users.user_id = UserSkills.user_id
            WHERE UserSkills.skill_id = ? AND UserSkills.type = 'teach'
            """,
            (skill_id,),
        ).fetchall()
        conn.close()
        return jsonify({"tutors": rows_to_list(rows)}), 200
    except Exception as e:
        return error_response(str(e))


# ───────────────────────── UserSkills ─────────────────────────

@app.route("/user-skills", methods=["POST"])
def insert_user_skill():
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    skill_id = data.get("skill_id")
    skill_type = data.get("type")
    if user_id is None or skill_id is None or skill_type not in ("teach", "learn"):
        return error_response("'user_id', 'skill_id', and 'type' (teach/learn) are required", 400)
    try:
        conn = get_db()
        cur = conn.execute(
            "INSERT INTO UserSkills (user_id, skill_id, type) VALUES (?, ?, ?)",
            (user_id, skill_id, skill_type),
        )
        conn.commit()
        new_id = cur.lastrowid
        conn.close()
        return jsonify({"id": new_id, "user_id": user_id, "skill_id": skill_id, "type": skill_type}), 201
    except Exception as e:
        return error_response(str(e))


@app.route("/users/<int:user_id>/skills", methods=["GET"])
def get_user_skills(user_id):
    type_filter = request.args.get("type")
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
        return jsonify({"skills": rows_to_list(rows)}), 200
    except Exception as e:
        return error_response(str(e))


@app.route("/users/<int:user_id>/skills/<int:skill_id>", methods=["DELETE"])
def delete_user_skill(user_id, skill_id):
    type_filter = request.args.get("type")
    try:
        conn = get_db()
        query = "DELETE FROM UserSkills WHERE user_id = ? AND skill_id = ?"
        params = [user_id, skill_id]
        if type_filter:
            query += " AND type = ?"
            params.append(type_filter)
        cur = conn.execute(query, params)
        conn.commit()
        deleted_count = cur.rowcount
        conn.close()
        return jsonify({"removed_count": deleted_count}), 200
    except Exception as e:
        return error_response(str(e))


# ───────────────────────── Verifications ─────────────────────────

@app.route("/verifications", methods=["POST"])
def insert_verification():
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    skill_id = data.get("skill_id")
    if user_id is None or skill_id is None:
        return error_response("'user_id' and 'skill_id' are required", 400)
    try:
        conn = get_db()
        cur = conn.execute(
            "INSERT INTO Verifications (user_id, skill_id, status, verified_by) "
            "VALUES (?, ?, 'pending', NULL)",
            (user_id, skill_id),
        )
        conn.commit()
        verification_id = cur.lastrowid
        conn.close()
        return jsonify({"verification_id": verification_id}), 201
    except Exception as e:
        return error_response(str(e))


@app.route("/verifications", methods=["GET"])
def list_verifications():
    status_filter = request.args.get("status")
    try:
        conn = get_db()
        query = "SELECT * FROM Verifications"
        params = []
        if status_filter:
            query += " WHERE status = ?"
            params.append(status_filter)
        rows = conn.execute(query, params).fetchall()
        conn.close()
        return jsonify({"verifications": rows_to_list(rows)}), 200
    except Exception as e:
        return error_response(str(e))


@app.route("/verifications/<int:verification_id>", methods=["GET"])
def get_verification(verification_id):
    try:
        conn = get_db()
        v = conn.execute(
            "SELECT * FROM Verifications WHERE verification_id = ?", (verification_id,)
        ).fetchone()
        conn.close()
        return jsonify({"verification": row_or_none(v)}), 200
    except Exception as e:
        return error_response(str(e))


@app.route("/users/<int:user_id>/verifications", methods=["GET"])
def get_user_verifications(user_id):
    try:
        conn = get_db()
        rows = conn.execute(
            """
            SELECT Verifications.*, Skills.skill_name
            FROM Verifications
            JOIN Skills ON Skills.skill_id = Verifications.skill_id
            WHERE Verifications.user_id = ?
            ORDER BY Verifications.verification_id DESC
            """,
            (user_id,),
        ).fetchall()
        conn.close()
        return jsonify({"verifications": rows_to_list(rows)}), 200
    except Exception as e:
        return error_response(str(e))


@app.route("/verifications/<int:verification_id>", methods=["PATCH"])
def update_verification(verification_id):
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    verified_by = data.get("verified_by")
    try:
        conn = get_db()
        conn.execute(
            "UPDATE Verifications SET status = ?, verified_by = ? WHERE verification_id = ?",
            (status, verified_by, verification_id),
        )
        conn.commit()
        updated = conn.execute(
            "SELECT * FROM Verifications WHERE verification_id = ?", (verification_id,)
        ).fetchone()
        conn.close()
        return jsonify({"verification": row_or_none(updated)}), 200
    except Exception as e:
        return error_response(str(e))


# ───────────────────────── Projects ─────────────────────────

@app.route("/projects", methods=["POST"])
def insert_project():
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    skill_id = data.get("skill_id")
    description = data.get("description")
    if user_id is None or skill_id is None:
        return error_response("'user_id' and 'skill_id' are required", 400)
    try:
        conn = get_db()
        cur = conn.execute(
            "INSERT INTO Projects (user_id, skill_id, description) VALUES (?, ?, ?)",
            (user_id, skill_id, description),
        )
        conn.commit()
        project_id = cur.lastrowid
        conn.close()
        return jsonify({"project_id": project_id}), 201
    except Exception as e:
        return error_response(str(e))


@app.route("/projects/<int:project_id>", methods=["GET"])
def get_project(project_id):
    try:
        conn = get_db()
        project = conn.execute(
            "SELECT * FROM Projects WHERE project_id = ?", (project_id,)
        ).fetchone()
        conn.close()
        return jsonify({"project": row_or_none(project)}), 200
    except Exception as e:
        return error_response(str(e))


@app.route("/users/<int:user_id>/projects", methods=["GET"])
def get_user_projects(user_id):
    try:
        conn = get_db()
        rows = conn.execute(
            """
            SELECT Projects.*, Skills.skill_name
            FROM Projects
            JOIN Skills ON Skills.skill_id = Projects.skill_id
            WHERE Projects.user_id = ?
            ORDER BY Projects.project_id DESC
            """,
            (user_id,),
        ).fetchall()
        conn.close()
        return jsonify({"projects": rows_to_list(rows)}), 200
    except Exception as e:
        return error_response(str(e))


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    app.run(debug=True, port=PORT, use_reloader=False)
