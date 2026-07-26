# Ubuntu Skills

Ubuntu Skills is a peer-to-peer learning platform for university students. Students list skills they can teach and skills they want to learn, get matched with peers, book one-on-one or group sessions, message each other, and leave reviews once a session is complete.

The project is split into a static frontend and three independent Flask backend services, each deployed separately on Render.

## Live Deployments

| Service | URL | Health Check |
|---|---|---|
| Frontend | https://ubuntu-skills-frontend.onrender.com | — (static site) |
| API service | https://ubuntu-skills-api-64pi.onrender.com | [`/health`](https://ubuntu-skills-api-64pi.onrender.com/health) |
| Auth service | https://ubuntu-skills-auth-9v0u.onrender.com | [`/health`](https://ubuntu-skills-auth-9v0u.onrender.com/health) |
| Database service | https://ubuntu-skills-db-service.onrender.com | [`/health`](https://ubuntu-skills-db-service.onrender.com/health) |

Each health check responds with `{"status": "ok"}` (the API and Auth services also include a `"service"` field) when the service is up and reachable.

> Note: the Auth service did not previously expose a `/health` route. One has been added at `backend/services/auth/auth.py` so all three backend services now report status consistently.

Because Render's free tier spins services down when idle, the first request after a period of inactivity may take 30-60 seconds to respond while the instance wakes back up.

## Architecture

Ubuntu Skills follows a small microservice layout: the frontend never touches the database directly, and neither does the API or Auth service — only the Database service holds a connection to PostgreSQL.

```
Frontend (static HTML/CSS/JS)
        │
        ├──────────────► Auth service  ─────► Database service ─────► PostgreSQL
        │                (register/login/
        │                 logout/verification)
        │
        └──────────────► API service   ─────► Database service ─────► PostgreSQL
                         (skills, sessions,
                          community, messages,
                          notifications, users)
```

- **Frontend**: plain HTML/CSS/JS. Talks to the Auth service for account actions and to the API service for everything else.
- **Auth service**: registration (school-email or manual document verification), login/logout, session cookies, and an admin flow for reviewing pending verifications.
- **API service**: the main application logic — skills, matching/search, sessions (booking, approve/decline/reschedule/cancel/complete), reviews, group sessions, messaging, and notifications. Organized as Flask Blueprints, one per domain area.
- **Database service**: the only process that opens a connection to PostgreSQL. Exposes a small internal HTTP API that the Auth and API services call instead of running SQL themselves. If it's unreachable, the other two services return a clear error instead of crashing.

This mirrors the original SQLite-based design (frontend → api/auth → database_service → db), now running on PostgreSQL, deployed as four separate Render services instead of local processes on ports 5000-5002.

## Repository Structure

```
ubuntu_skills/
├── Frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js                  # points at the deployed Auth/API URLs
│
├── backend/
│   ├── database/
│   │   ├── schema.sql          # single source of truth for the data model
│   │   └── seed_sample_data.py
│   │
│   └── services/
│       ├── auth/
│       │   ├── auth.py         # register, login, logout, admin verification, /health
│       │   ├── db_client.py    # HTTP client to the database service
│       │   └── config.py
│       │
│       ├── api/
│       │   ├── app.py                  # app factory, blueprint registration, /health
│       │   ├── db_client.py            # HTTP client to the database service
│       │   ├── config.py
│       │   ├── routes_users.py         # profiles, degrees, skill categories, search
│       │   ├── routes_skills.py        # user skills (teach/learn), skill search
│       │   ├── routes_sessions.py      # booking, approve/decline/reschedule/cancel/complete, reviews
│       │   ├── routes_community.py     # group sessions
│       │   ├── routes_messages.py      # conversations and messages
│       │   └── routes_notifications.py # notifications
│       │
│       └── database_service/
│           ├── db_service.py   # internal HTTP API backed by PostgreSQL, /health
│           └── config.py
│
├── requirements.txt
└── README.md
```

## Data Model

Defined in `backend/database/schema.sql` and owned exclusively by the Database service (PostgreSQL). Core tables:

- **Users** — profile info, degree, verification method/status, rolling credit rating
- **Degrees** / **SkillCategories** — reference/lookup tables
- **UserSkills** — a user's "teach" and "learn" listings, tied to a skill category
- **Sessions** — one-on-one bookings between a teacher and a learner, with a full status lifecycle (`pending → approved/declined → completed`, or `cancelled`)
- **Reviews** — post-session ratings and comments
- **GroupSessions** (+ members) — community/group learning sessions
- **Conversations** / **Messages** — direct messaging between users
- **Notifications** — in-app notifications

## Tech Stack

- **Backend**: Python, Flask, Flask-CORS, Flask-Bcrypt, Gunicorn
- **Database**: PostgreSQL (via `psycopg2`)
- **Frontend**: HTML, CSS, vanilla JavaScript
- **Hosting**: Render (one web service per component)

## Running Locally

Each backend service is a standalone Flask app with its own `config.py`. The database service must be running first, since the other two call it for every read/write.

```bash
pip install -r requirements.txt

# 1. Database service (needs a Postgres connection string)
cd backend/services/database_service
python db_service.py          # defaults to port 5000, override with $PORT

# 2. Auth service (needs DB_SERVICE_URL pointing at the database service)
cd backend/services/auth
python auth.py

# 3. API service (needs DB_SERVICE_URL pointing at the database service)
cd backend/services/api
python app.py
```

Load `backend/database/schema.sql` into a PostgreSQL database before starting the database service, and optionally run `backend/database/seed_sample_data.py` for sample data.

Then open `Frontend/index.html` in a browser, or update `AUTH_BASE` / `API_BASE` in `Frontend/app.js` to point at your local services instead of the deployed URLs.

## Project Status

Ubuntu Skills is under active development by a five-person student team. Known gaps being worked on:

- Cancelled session visibility in the frontend
- Unread message badge wiring
- A frontend for the manual document-verification admin flow (the admin API already exists)
- Session reminder generation


