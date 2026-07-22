import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SECRET_KEY = 'ubuntu_skills_secret_key'

# auth/ no longer opens the database file directly - it talks to
# database_service over HTTP instead. See db_client.py.
DB_SERVICE_URL = os.environ.get("DB_SERVICE_URL", "http://localhost:5002")

SCHOOL_EMAIL_DOMAIN = os.environ.get("SCHOOL_EMAIL_DOMAIN", "@alustudent.com")

UPLOAD_FOLDER = os.path.join(BASE_DIR, "verification_documents")
ALLOWED_DOCUMENT_EXTENSIONS = {"pdf", "png", "jpg", "jpeg"}
