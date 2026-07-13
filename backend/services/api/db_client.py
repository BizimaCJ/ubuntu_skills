"""
Thin HTTP client for database_service.
api/app.py should never import sqlite3 - every read/write goes through here.
"""

import requests
from config import DB_SERVICE_URL


class DBServiceError(Exception):
    """Raised when database_service is unreachable or returns an error."""
    def __init__(self, message, status_code=502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _request(method, path, **kwargs):
    try:
        resp = requests.request(method, f"{DB_SERVICE_URL}{path}", timeout=5, **kwargs)
    except requests.exceptions.RequestException:
        raise DBServiceError("Could not reach database service", 503)

    try:
        body = resp.json()
    except ValueError:
        body = {}

    if resp.status_code >= 400:
        raise DBServiceError(body.get("error", "Database service error"), resp.status_code)

    return body


# ── Skills ──

def list_skills():
    return _request("GET", "/skills")["skills"]


def insert_skill(skill_name, category):
    return _request("POST", "/skills", json={"skill_name": skill_name, "category": category})


def get_skill_by_name(skill_name):
    return _request("GET", f"/skills/by-name/{skill_name}")["skill"]


def get_skill_by_id(skill_id):
    return _request("GET", f"/skills/{skill_id}")["skill"]


def update_skill(skill_id, skill_name, category):
    return _request("PATCH", f"/skills/{skill_id}", json={"skill_name": skill_name, "category": category})["skill"]


def delete_skill(skill_id):
    return _request("DELETE", f"/skills/{skill_id}")


def skill_usage_count(skill_id):
    return _request("GET", f"/skills/{skill_id}/usage-count")["count"]


def skill_tutors(skill_id):
    return _request("GET", f"/skills/{skill_id}/tutors")["tutors"]


# ── UserSkills ──

def insert_user_skill(user_id, skill_id, skill_type):
    return _request("POST", "/user-skills", json={"user_id": user_id, "skill_id": skill_id, "type": skill_type})


def get_user_skills(user_id, type_filter=None):
    params = {"type": type_filter} if type_filter else {}
    return _request("GET", f"/users/{user_id}/skills", params=params)["skills"]


def delete_user_skill(user_id, skill_id, type_filter=None):
    params = {"type": type_filter} if type_filter else {}
    return _request("DELETE", f"/users/{user_id}/skills/{skill_id}", params=params)["removed_count"]


# ── Verifications ──

def insert_verification(user_id, skill_id):
    return _request("POST", "/verifications", json={"user_id": user_id, "skill_id": skill_id})["verification_id"]


def list_verifications(status_filter=None):
    params = {"status": status_filter} if status_filter else {}
    return _request("GET", "/verifications", params=params)["verifications"]


def get_verification_by_id(verification_id):
    return _request("GET", f"/verifications/{verification_id}")["verification"]


def get_user_verifications(user_id):
    return _request("GET", f"/users/{user_id}/verifications")["verifications"]


def update_verification(verification_id, status, verified_by):
    return _request(
        "PATCH", f"/verifications/{verification_id}",
        json={"status": status, "verified_by": verified_by},
    )["verification"]


# ── Projects ──

def insert_project(user_id, skill_id, description):
    return _request("POST", "/projects", json={"user_id": user_id, "skill_id": skill_id, "description": description})["project_id"]


def get_project_by_id(project_id):
    return _request("GET", f"/projects/{project_id}")["project"]


def get_user_projects(user_id):
    return _request("GET", f"/users/{user_id}/projects")["projects"]
