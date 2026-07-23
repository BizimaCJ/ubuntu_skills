# UbuntuSkills Project

UbuntuSkills is a peer-to-peer skill exchange platform where users can teach and learn skills from each other.

---

# Project Structure

```text
.
├── backend/
│   ├── services/
│   │   ├── api/
│   │   │   ├── api.py              # HTTP routes, validation, status codes
│   │   │   ├── db_client.py        # Calls database_service over HTTP (no sqlite3 here)
│   │   │   └── config.py
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.py             # Register, login, and logout routes
│   │   │   ├── db_client.py        # Calls database_service over HTTP (no sqlite3 here)
│   │   │   └── config.py
│   │   │
│   │   └── database_service/
│   │       ├── db_service.py       # Only service that accesses the SQLite database
│   │       └── config.py
│   │
│   └── database/
│       ├── schema.sql
│       ├── sample_data.sql
│       └── ubuntuskills.db
│
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── styles.css
│
├── venv/
├── README.md
└── requirements.txt
```

## Architecture

`api` and `auth` don't talk to SQLite directly. All database access goes
through a dedicated `database_service`:

```
frontend  --->  api (5001)   --->  database_service (5002)  --->  ubuntuskills.db
          --->  auth (5000)  --->  database_service (5002)  --->  ubuntuskills.db
```

- `database_service` (entrypoint: `db_service.py`) is the single process that
  imports `sqlite3` and knows the database file's location. It exposes small
  JSON endpoints, one per query (e.g. `GET /skills/<id>`, `POST /users`),
  each using parametrized SQL.
- `api` (entrypoint: `api.py`) and `auth` (entrypoint: `auth.py`) keep all
  their request validation, business rules, and HTTP status codes exactly as
  before - they just fetch/write data by calling `database_service` (via
  `db_client.py`) instead of running SQL themselves.
- If `database_service` is unreachable, `api`/`auth` return a `503` instead
  of crashing.
- `db_client.py` in `api/` and `auth/` is intentionally a plain, small HTTP
  wrapper (using the `requests` library) - swapping SQLite for Postgres/MySQL
  later only means changing `database_service`, not the two callers.

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
- SQLite database integration, isolated behind a dedicated `database_service`
- Frontend routing system (login, register, profile, portfolio)

---

## API Endpoints Index

| Table | Method | Endpoint | Purpose |
|---|---|---|---|
| Skills | GET | `/api/skills` | List the full skill catalog |
| Skills | POST | `/api/skills` | Add a skill (+ optional user link) |
| Skills | GET | `/api/skills/<skill_id>` | Single skill detail |
| Skills | PATCH | `/api/skills/<skill_id>` | Edit a skill's name/category |
| Skills | DELETE | `/api/skills/<skill_id>` | Remove a skill from the catalog |
| UserSkills | GET | `/api/users/<user_id>/skills` | View a user's skills |
| UserSkills | DELETE | `/api/users/<user_id>/skills/<skill_id>` | Remove a skill a user listed |
| UserSkills | GET | `/api/skills/<skill_id>/tutors` | Users who teach this skill |
| Verifications | POST | `/api/skills/verify` | Submit a skill for verification |
| Verifications | GET | `/api/verifications` | List verifications (`?status=`) |
| Verifications | GET | `/api/verifications/<verification_id>` | Single verification detail |
| Verifications | GET | `/api/users/<user_id>/verifications` | A user's verification history |
| Verifications | PATCH | `/api/verifications/<verification_id>` | Admin approve/reject |
| Projects | POST | `/api/projects` | Log a completed skill exchange |
| Projects | GET | `/api/projects/<project_id>` | Single project detail |
| Projects | GET | `/api/users/<user_id>/projects` | A user's exchange history |

## Setup Instructions

### 1. Create virtual environment
bash
python -m venv venv

### 2. Activate environment
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows

### 3. Install dependencies
pip install flask flask-cors flask-bcrypt requests

### 4. Run backend services

Start these in three separate terminals, from the project root.
`database_service` must be running before `api` or `auth`, since they call
it for every database read/write.

Database service (owns the SQLite file):

python backend/services/database_service/db_service.py

API server:

python backend/services/api/api.py

Auth server:

python backend/services/auth/auth.py

### 5. Run frontend

Open:

frontend/index.html

in a browser

---

## Notes
Passwords are stored securely using bcrypt hashing
Database is SQLite for simplicity
Only `database_service` opens the SQLite file directly; `api` and `auth` reach it over HTTP
Frontend communicates with backend via REST APIs
This project is in active development and not fully complete

---

## Next Steps (Incomplete Features)
Full user profile editing (bio update, avatar support)
Messaging system between matched users
Improved skill matching algorithm
Deployment to cloud platform
UI refinement and validation improvements
