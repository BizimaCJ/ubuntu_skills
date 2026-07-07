# UbuntuSkills Project

UbuntuSkills is a peer-to-peer skill exchange platform where users can teach and learn skills from each other.

---

## Project Structure


.
├── Frontend/
│ ├── index.html
│ ├── app.js
│ └── styles.css
│
├── api/
│ ├── app.py
│ ├── config.py
│ └── pycache/
│
├── auth/
│ ├── app.py
│ └── config.py
│
├── database/
│ ├── schema.sql
│ ├── sample_data.sql
│ └── ubuntuskills.db
│
├── venv/
├── README.md


---

## Database Overview

The system uses SQLite with the following tables:

- **Users** → Stores user accounts (name, email, hashed password, bio)
- **Skills** → Master list of skills available on the platform
- **UserSkills** → Links users to skills with type (teach/learn)
- **Verifications** → Tracks skill verification status
- **Projects** → Logs completed skill exchange sessions

---

## Current Implemented Features

- User registration with password hashing (bcrypt)
- User login system
- Skill linking (teach/learn) during registration
- Profile display with user skills
- REST API for skills, users, verifications, and projects
- SQLite database integration
- Frontend routing system (login, register, profile, portfolio)

---

## API Endpoints Summary

### Skills
- GET `/api/skills`
- POST `/api/skills`
- GET `/api/skills/<skill_id>`
- PATCH `/api/skills/<skill_id>`
- DELETE `/api/skills/<skill_id>`

### User Skills
- GET `/api/users/<user_id>/skills`
- DELETE `/api/users/<user_id>/skills/<skill_id>`
- GET `/api/skills/<skill_id>/tutors`

### Verifications
- POST `/api/skills/verify`
- GET `/api/verifications`
- GET `/api/verifications/<id>`
- PATCH `/api/verifications/<id>`
- GET `/api/users/<user_id>/verifications`

### Projects
- POST `/api/projects`
- GET `/api/projects/<id>`
- GET `/api/users/<user_id>/projects`

---

## Setup Instructions

### 1. Create virtual environment
bash
python -m venv venv

### 2. Activate environment
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows

### 3. Install dependencies
pip install flask flask-cors flask-bcrypt

### 4. Run backend services

API server:

python api/app.py

Auth server:

python auth/app.py

### 5. Run frontend

Open:

Frontend/index.html

in a browser

---

## Notes
Passwords are stored securely using bcrypt hashing
Database is SQLite for simplicity
Frontend communicates with backend via REST APIs
This project is in active development and not fully complete

---

## Next Steps (Incomplete Features)
Full user profile editing (bio update, avatar support)
Messaging system between matched users
Improved skill matching algorithm
Deployment to cloud platform
UI refinement and validation improvements
