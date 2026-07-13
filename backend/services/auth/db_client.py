"""
Thin HTTP client for database_service.
auth/app.py should never import sqlite3 - every read/write goes through here.
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


def get_user_by_email(email):
    return _request("GET", f"/users/by-email/{email}")["user"]


def insert_user(name, email, password_hash, bio=None):
    return _request(
        "POST", "/users",
        json={"name": name, "email": email, "password_hash": password_hash, "bio": bio},
    )["user_id"]


def get_skill_by_name(skill_name):
    return _request("GET", f"/skills/by-name/{skill_name}")["skill"]


def insert_skill(skill_name, category="general"):
    return _request("POST", "/skills", json={"skill_name": skill_name, "category": category})


def insert_user_skill(user_id, skill_id, skill_type):
    return _request("POST", "/user-skills", json={"user_id": user_id, "skill_id": skill_id, "type": skill_type})


def get_or_create_skill_id(skill_name):
    existing = get_skill_by_name(skill_name)
    if existing:
        return existing["skill_id"]
    return insert_skill(skill_name)["skill_id"]
