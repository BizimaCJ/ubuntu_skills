import os
import uuid

from flask import Flask, request, jsonify, session
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from werkzeug.utils import secure_filename

from config import SECRET_KEY, SCHOOL_EMAIL_DOMAIN, UPLOAD_FOLDER, ALLOWED_DOCUMENT_EXTENSIONS, ADMIN_KEY
import db_client
from db_client import DBServiceError

app = Flask(__name__)
CORS(app)
app.secret_key = SECRET_KEY
bcrypt = Bcrypt(app)

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def _is_school_email(email):
    return email.lower().endswith(SCHOOL_EMAIL_DOMAIN.lower())


def _allowed_document(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_DOCUMENT_EXTENSIONS


def _save_verification_document(file_storage):
    if not file_storage or file_storage.filename == "":
        raise ValueError("A verification document is required for non-school-email signups")

    original_name = secure_filename(file_storage.filename)
    if not _allowed_document(original_name):
        raise ValueError(
            f"Unsupported file type. Allowed: {', '.join(sorted(ALLOWED_DOCUMENT_EXTENSIONS))}"
        )

    ext = original_name.rsplit(".", 1)[1].lower()
    stored_name = f"{uuid.uuid4().hex}.{ext}"
    stored_path = os.path.join(UPLOAD_FOLDER, stored_name)
    file_storage.save(stored_path)
    return stored_name


# ─ REGISTER ROUTE ─
@app.route('/register', methods=['POST'])
def register():
    name = request.form.get('name')
    email = request.form.get('email')
    password = request.form.get('password')

    teach_category_id = request.form.get('teach_category_id')
    teach_description = request.form.get('teach_description')
    learn_category_id = request.form.get('learn_category_id')
    learn_description = request.form.get('learn_description')

    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required'}), 400

    try:
        existing_user = db_client.get_user_by_email(email)
        if existing_user:
            return jsonify({'error': 'Email already registered'}), 409

        if _is_school_email(email):
            verification_method = 'school_email'
            verification_status = 'verified'
            verification_document_path = None
        else:
            verification_method = 'document'
            verification_status = 'pending'
            try:
                verification_document_path = _save_verification_document(
                    request.files.get('document')
                )
            except ValueError as e:
                return jsonify({'error': str(e)}), 400

        password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

        user_id = db_client.insert_user(
            name, email, password_hash,
            verification_method=verification_method,
            verification_status=verification_status,
            verification_document_path=verification_document_path,
        )

        if teach_category_id and teach_description:
            db_client.insert_user_skill(user_id, int(teach_category_id), teach_description, "teach")

        if learn_category_id and learn_description:
            db_client.insert_user_skill(user_id, int(learn_category_id), learn_description, "learn")

        return jsonify({
            'message': 'User registered successfully',
            'verification_status': verification_status,
        }), 201

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
        if bcrypt.check_password_hash(user['password_hash'], password):
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
