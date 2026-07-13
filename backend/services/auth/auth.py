from flask import Flask, request, jsonify, session
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from config import SECRET_KEY
import db_client
from db_client import DBServiceError

app = Flask(__name__)
CORS(app)
app.secret_key = SECRET_KEY
bcrypt = Bcrypt(app)


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

    try:
        # Check if email already exists
        existing_user = db_client.get_user_by_email(email)
        if existing_user:
            return jsonify({'error': 'Email already registered'}), 409

        # Hash the password before saving
        password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

        # Save new user to database
        user_id = db_client.insert_user(name, email, password_hash)

        teach_skill = data.get("teach_skill")
        learn_skill = data.get("learn_skill")

        if teach_skill:
            skill_id = db_client.get_or_create_skill_id(teach_skill)
            db_client.insert_user_skill(user_id, skill_id, "teach")

        if learn_skill:
            skill_id = db_client.get_or_create_skill_id(learn_skill)
            db_client.insert_user_skill(user_id, skill_id, "learn")

        return jsonify({'message': 'User registered successfully'}), 201

    except DBServiceError as e:
        return jsonify({'error': e.message}), e.status_code
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
        # Look up user by email
        user = db_client.get_user_by_email(email)

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

    except DBServiceError as e:
        return jsonify({'error': e.message}), e.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─ LOGOUT ROUTE ─
@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5000, use_reloader=False)
