# UbuntuSkills Database

This repo contains the database design and setup for the UbuntuSkills project, a skill exchange platform where users can teach and learn skills from each other.

---

## Project Summary

UbuntuSkills connects people who want to teach a skill with people who want to learn it. This system stores users, their skills, verification status, and completed exchange sessions, and supports an API used by the frontend application.

---

## Team Members

- Chance Jesca Bizima
- Martha Stacey Kanogo
- Emna Barezi
- Divin Semana
- Bertrand Rusanganwa

---

## Files in This Folder

| File | Purpose |
|------|---------|
| schema.sql | Creates the database tables and relationships |
| sample_data.sql | Adds fake data for testing |
| ubuntuskills.db | SQLite database file used by the backend |
| README.md | Database documentation and setup guide |

---

## Database Tables

**Users**  
Stores user accounts including name, email, hashed password, bio, and creation time.

**Skills**  
Master list of all skills available in the system (e.g. Python, Design, French).

**UserSkills**  
Links users to skills and defines whether the user can teach or learn a skill.

**Verifications**  
Tracks admin approval of claimed skills.

**Projects**  
Stores completed skill exchange sessions between users.

---

## Entity Relationships

- One user → many skills (via UserSkills)
- One skill → many users (via UserSkills)
- One user → many verifications
- One user → many projects

---

## How to Set Up the Database

Requires Python 3 (SQLite is built-in).

Run from project root:

bash
python -c "import sqlite3; conn = sqlite3.connect('database/ubuntuswap.db'); cur = conn.cursor(); cur.executescript(open('database/schema.sql').read()); cur.executescript(open('database/sample_data.sql').read()); conn.commit(); conn.close(); print('Database created successfully')"

## Security Notes

Sample passwords are placeholders only.
Real passwords are stored as bcrypt hashes in the authentication system.
Password hashing is handled in the auth service, not in SQL seed data.

---

## API Endpoints Index
Table	Method	Endpoint	Purpose
Skills	GET	/api/skills	List all skills
Skills	POST	/api/skills	Add skill (+ optional user link)
Skills	GET	/api/skills/<skill_id>	Skill details
Skills	PATCH	/api/skills/<skill_id>	Update skill
Skills	DELETE	/api/skills/<skill_id>	Delete skill
UserSkills	GET	/api/users/<user_id>/skills	Get user skills
UserSkills	DELETE	/api/users/<user_id>/skills/<skill_id>	Remove user skill
UserSkills	GET	/api/skills/<skill_id>/tutors	Tutors for a skill
Verifications	POST	/api/skills/verify	Submit verification
Verifications	GET	/api/verifications	List verifications
Verifications	GET	/api/verifications/<verification_id>	Verification detail
Verifications	GET	/api/users/<user_id>/verifications	User verification history
Verifications	PATCH	/api/verifications/<verification_id>	Approve/reject verification
Projects	POST	/api/projects	Log exchange session
Projects	GET	/api/projects/<project_id>	Project detail
Projects	GET	/api/users/<user_id>/projects	User exchange history

---

## What Has Been Completed

The system is now partially integrated and functional:

- Database schema is fully designed and implemented
- Sample data has been loaded for testing
- Backend API is fully connected to the database
- Authentication system is working with secure password hashing
- User registration and login flow is functional
- Skills are stored and linked correctly to users
- Frontend is connected to backend APIs using fetch requests
- User profiles dynamically load skills from the database
- REST API supports full CRUD operations for skills and verifications

---

## What Remains to Complete Full System

To reach a fully working application, the following remains:

### Core Improvements
- Improve validation for skill inputs (prevent duplicates and empty values)
- Ensure consistent handling of seeded users vs newly registered users
- Strengthen API consistency across all endpoints

### Feature Completion
- Skill matching system (auto pairing teach ↔ learn users)
- Messaging system between matched users
- Profile editing (bio and skills updates)

### System Enhancements
- UI/UX improvements for better usability
- Deployment of backend and frontend to a live environment
- Optional real-time updates for matches and messaging

---

## Final Note

The current system demonstrates a working full-stack pipeline:

Frontend → Authentication Service → API Service → SQLite Database

The application is functional end-to-end, and remaining work focuses on expanding features and improving user experience toward a complete production-ready platform.
