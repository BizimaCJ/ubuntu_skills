## Endpoint Index

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
| UserSkills | GET | `/api/skills/<skill_id>/learners` | Users who want to learn this skill |
| Verifications | POST | `/api/skills/verify` | Submit a skill for verification |
| Verifications | GET | `/api/verifications` | List verifications (`?status=`) |
| Verifications | GET | `/api/verifications/<verification_id>` | Single verification detail |
| Verifications | GET | `/api/users/<user_id>/verifications` | A user's verification history |
| Verifications | PATCH | `/api/verifications/<verification_id>` | Admin approve/reject |
| Projects | POST | `/api/projects` | Log a completed skill exchange |
| Projects | GET | `/api/projects/<project_id>` | Single project detail |
| Projects | GET | `/api/users/<user_id>/projects` | A user's exchange history |