import os

# This tells Flask where the database file is
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SECRET_KEY = 'ubuntu_skills_secret_key'

DATABASE = os.path.join(BASE_DIR, '..', 'database', 'ubuntuskills.db')
