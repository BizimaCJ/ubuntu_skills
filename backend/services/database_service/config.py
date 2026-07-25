import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# This is the ONLY service that should ever open this database directly.
# Set on Render to the Postgres "Internal Database URL" it gives you.
DATABASE_URL = os.environ.get("DATABASE_URL")

PORT = int(os.environ.get("PORT", 5002))
