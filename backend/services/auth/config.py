import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SECRET_KEY = 'ubuntu_skills_secret_key'

# auth/ no longer opens the database file directly - it talks to
# database_service over HTTP instead. See db_client.py.
DB_SERVICE_URL = os.environ.get("DB_SERVICE_URL", "http://localhost:5002")

SCHOOL_EMAIL_DOMAIN = os.environ.get("SCHOOL_EMAIL_DOMAIN", "@alustudent.com")

UPLOAD_FOLDER = os.path.join(BASE_DIR, "verification_documents")
ALLOWED_DOCUMENT_EXTENSIONS = {"pdf", "png", "jpg", "jpeg"}
ADMIN_KEY = os.environ.get("ADMIN_KEY", "dev-admin-key-change-me")

PORT = int(os.environ.get("PORT", 5000))

# Comma-separated list of allowed origins for CORS. Defaults to just the
# deployed frontend, so nothing is loosened unless you explicitly set this -
# e.g. for local admin-page testing:
#   export CORS_ORIGINS="https://ubuntu-skills-frontend.onrender.com,http://127.0.0.1:8000"
CORS_ORIGINS = os.environ.get(
    "CORS_ORIGINS", "https://ubuntu-skills-frontend.onrender.com"
).split(",")
