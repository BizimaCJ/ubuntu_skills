# UbuntuSkills Database

This folder contains the database design and setup for the UbuntuSkills project, a skill exchange platform where users can teach and learn skills from each other without money involved.

## Team Members

- Chance Jesca Bizima
- Martha Stacey Kanogo
- Emna Barezi
- Divin Semana
- Bertrand Rusanganwa



## Project Summary

UbuntuSkills connects people who want to teach a skill with people who want to learn it. This database stores users, their skills, verification status, and completed exchange sessions.

## Files in This Folder

| File | Purpose |
|------|---------|
| schema.sql | Creates the 5 database tables and their relationships |
| sample_data.sql | Adds fake data for testing |
| ubuntuskills.db | The actual working SQLite database file |
| README.md | This file, explaining the database setup |

## Database Tables

**Users**
Stores everyone who signs up on the platform, including their name, email, hashed password, and bio.

**Skills**
A master list of all skills available on the platform, such as Graphic Design, Python Programming, and French Language.

**UserSkills**
Connects a user to a skill and records whether they want to teach that skill or learn it.

**Verifications**
Tracks whether a user's claimed skill has been checked and approved by an admin.

**Projects**
Records a completed skill exchange session between two users.

## Entity Relationships

- One user can have many skills (through UserSkills)
- One skill can belong to many users (through UserSkills)
- One user can have many verifications
- One user can have many completed projects

## How to Set Up the Database

You need Python 3 installed. SQLite comes built into Python, so no extra installation is needed.

Run this command from the project's main folder to build the database from scratch:
python -c "import sqlite3; conn = sqlite3.connect('database/ubuntuswap.db'); cur = conn.cursor(); cur.executescript(open('database/schema.sql').read()); cur.executescript(open('database/sample_data.sql').read()); conn.commit(); conn.close(); print('Database created successfully')"

To view the data, open `ubuntuskills.db` using a free tool like DB Browser for SQLite (https://sqlitebrowser.org), or use the built-in database viewer in VS Code.

## Security Notes

- Passwords in the sample data are placeholder text, not real hashed passwords.
- Real password hashing will be handled by the Login System and connected to the password field in the Users table.

## Notes for the Team

- All data in sample_data.sql is fake and only for testing.
- Person 3 (APIs) and Person 5 (Integration) will use ubuntuskills.db to connect the backend to real data.
- If the schema changes later, update schema.sql and rebuild the database using the command above.

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