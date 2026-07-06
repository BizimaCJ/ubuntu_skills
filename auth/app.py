from flask import Flask, request, jsonify, session
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import sqlite3
import os
from config import SECRET_KEY, DATABASE

app = Flask(__name__)
CORS(app)
app.secret_key = SECRET_KEY
bcrypt = Bcrypt(app)

# This function connects to the database
def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def get_or_create_skill(cursor, skill_name):
    cursor.execute(
        "SELECT skill_id FROM Skills WHERE LOWER(skill_name) = LOWER(?)",
        (skill_name,)
    )
    skill = cursor.fetchone()

    if skill:
        return skill["skill_id"]

    cursor.execute(
        "INSERT INTO Skills (skill_name, category) VALUES (?, ?)",
        (skill_name, "general")
    )
    return cursor.lastrowid

# ─ REGISTER ROUTE ─
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    # Check all fields are provided
    if not name or not email or not password:
        return jsonify({'error': 'All fields are required'}), 400

    # Hash the password before saving
    password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    try:
        conn = get_db()
        cursor = conn.cursor()

        # Check if email already exists
        cursor.execute('SELECT * FROM Users WHERE email = ?', (email,))
        existing_user = cursor.fetchone()

        if existing_user:
            return jsonify({'error': 'Email already registered'}), 409

        # Save new user to database
        cursor.execute(
            'INSERT INTO Users (name, email, password) VALUES (?, ?, ?)',
            (name, email, password_hash)
        )

        user_id = cursor.lastrowid
        conn.commit()
        teach_skill = data.get("teach_skill")
        learn_skill = data.get("learn_skill")

        if teach_skill:
            skill_id = get_or_create_skill(cursor, teach_skill)
            cursor.execute(
                "INSERT INTO UserSkills (user_id, skill_id, type) VALUES (?, ?, ?)",
                (user_id, skill_id, "teach")
            )

        if learn_skill:
            skill_id = get_or_create_skill(cursor, learn_skill)
            cursor.execute(
                "INSERT INTO UserSkills (user_id, skill_id, type) VALUES (?, ?, ?)",
                (user_id, skill_id, "learn")
            )

        conn.commit()
        conn.close()

        return jsonify({'message': 'User registered successfully'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─ LOGIN ROUTE ─
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    email = data.get('email')
    password = data.get('password')

    # Check all fields are provided
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    try:
        conn = get_db()
        cursor = conn.cursor()

        # Look up user by email
        cursor.execute('SELECT * FROM Users WHERE email = ?', (email,))
        user = cursor.fetchone()
        conn.close()

        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401

        # Compare entered password with stored hash
        if bcrypt.check_password_hash(user['password'], password):
            session['user_id'] = user['user_id']
            session['name'] = user['name']
            return jsonify({
                'message': 'Login successful',
                'user': {
                    'user_id': user['user_id'],
                    'name': user['name'],
                    'email': user['email']
                }
            }), 200
        else:
            return jsonify({'error': 'Invalid email or password'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─ LOGOUT ROUTE ─
@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200


if __name__ == '__main__':
    app.run(debug=True)
