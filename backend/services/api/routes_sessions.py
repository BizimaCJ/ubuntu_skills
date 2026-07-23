from flask import Blueprint, request, jsonify

import db_client
from db_client import DBServiceError

sessions_bp = Blueprint("sessions", __name__, url_prefix="/api")

VALID_STATUSES = ("pending", "approved", "declined", "cancelled", "completed")

# Anti-farming: each additional review the same reviewer leaves for the same
# reviewee is worth half as much as their last one, floored at
# MIN_REVIEW_WEIGHT so it never hits zero - it just stops mattering much.
BASE_REVIEW_WEIGHT = 1.0
MIN_REVIEW_WEIGHT = 0.1


def error_response(message, status_code):
    return jsonify({"error": message}), status_code


def _require_int(data, field_name):
    """Pull an int field out of a JSON body. Returns (value, error_response)
    where exactly one of the two is None."""
    value = data.get(field_name)
    if value is None:
        return None, error_response(f"'{field_name}' is required", 400)
    try:
        return int(value), None
    except (TypeError, ValueError):
        return None, error_response(f"'{field_name}' must be an integer", 400)


def _notify(user_id, notification_type, message, related_session_id=None):
    """Best-effort notification - a failed notification should never break
    the session/review flow that triggered it."""
    try:
        db_client.insert_notification(
            user_id, notification_type, message, related_session_id=related_session_id
        )
    except DBServiceError:
        pass


def _compute_review_weight(prior_review_count):
    weight = BASE_REVIEW_WEIGHT / (2 ** prior_review_count)
    return max(weight, MIN_REVIEW_WEIGHT)


def _recalculate_rating(reviewee_id):
    """Recompute a user's cached credits_average/credits_count from the full
    weighted set of reviews they've received, then persist it via
    database_service."""
    reviews = db_client.get_user_reviews(reviewee_id)
    if not reviews:
        db_client.update_user_credits(reviewee_id, 0, 0)
        return 0, 0

    total_weight = sum(r["weight"] for r in reviews)
    weighted_sum = sum(r["rating"] * r["weight"] for r in reviews)
    average = round(weighted_sum / total_weight, 2) if total_weight else 0
    count = len(reviews)

    db_client.update_user_credits(reviewee_id, average, count)
    return average, count


# ── Sessions: request / approve / decline / cancel / complete ──

@sessions_bp.route("/sessions", methods=["POST"])
def request_session():
    """
    A learner requests a session against a teacher's 'teach' listing.

    Expected JSON body:
    { "learner_id": 4, "user_skill_id": 1, "scheduled_time": "2026-08-01T15:00:00" }
    """
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body must be JSON", 400)

    learner_id, err = _require_int(data, "learner_id")
    if err:
        return err
    user_skill_id, err = _require_int(data, "user_skill_id")
    if err:
        return err
    scheduled_time = data.get("scheduled_time")
    if not scheduled_time:
        return error_response("'scheduled_time' is required", 400)

    user_skill = db_client.get_user_skill(user_skill_id)
    if not user_skill:
        return error_response(f"No listing found with user_skill_id {user_skill_id}", 404)
    if user_skill["skill_type"] != "teach":
        return error_response("Sessions can only be requested against a 'teach' listing", 400)

    teacher_id = user_skill["user_id"]
    if learner_id == teacher_id:
        return error_response("You cannot request a session with yourself", 400)

    session_id = db_client.insert_session(teacher_id, learner_id, user_skill_id, scheduled_time)
    session = db_client.get_session(session_id)

    _notify(
        teacher_id, "session_requested",
        f"You have a new session request (#{session_id}).",
        related_session_id=session_id,
    )

    return jsonify({"message": "Session requested", "session": session}), 201


@sessions_bp.route("/sessions/<int:session_id>", methods=["GET"])
def get_session(session_id):
    """Get a single session's details."""
    session = db_client.get_session(session_id)
    if not session:
        return error_response(f"No session found with session_id {session_id}", 404)
    return jsonify({"session": session}), 200


@sessions_bp.route("/users/<int:user_id>/sessions", methods=["GET"])
def list_user_sessions(user_id):
    """Query string: ?status=&role=teacher|learner"""
    status_filter = request.args.get("status")
    role_filter = request.args.get("role")

    if status_filter and status_filter not in VALID_STATUSES:
        return error_response(f"'status' query param must be one of {VALID_STATUSES}", 400)
    if role_filter and role_filter not in ("teacher", "learner"):
        return error_response("'role' query param must be 'teacher' or 'learner'", 400)

    sessions = db_client.get_user_sessions(user_id, status_filter, role_filter)
    return jsonify({"user_id": user_id, "count": len(sessions), "sessions": sessions}), 200


def _teacher_only_transition(session_id, new_status, notification_type, notification_message):
    data = request.get_json(silent=True) or {}
    user_id, err = _require_int(data, "user_id")
    if err:
        return err

    session = db_client.get_session(session_id)
    if not session:
        return error_response(f"No session found with session_id {session_id}", 404)

    if session["status"] != "pending":
        return error_response(
            f"Session #{session_id} is '{session['status']}' and can no longer be responded to", 409
        )
    if user_id != session["teacher_id"]:
        return error_response("Only the teacher on this session can respond to it", 403)

    updated = db_client.update_session(session_id, new_status)

    _notify(session["learner_id"], notification_type, notification_message, related_session_id=session_id)

    return jsonify({"message": f"Session #{session_id} {new_status}", "session": updated}), 200


@sessions_bp.route("/sessions/<int:session_id>/approve", methods=["PATCH"])
def approve_session(session_id):
    """Body: { "user_id": <teacher_id> }"""
    return _teacher_only_transition(
        session_id, "approved", "session_approved", "Your session request was approved."
    )


@sessions_bp.route("/sessions/<int:session_id>/decline", methods=["PATCH"])
def decline_session(session_id):
    """Body: { "user_id": <teacher_id> }"""
    return _teacher_only_transition(
        session_id, "declined", "session_declined", "Your session request was declined."
    )


@sessions_bp.route("/sessions/<int:session_id>/cancel", methods=["PATCH"])
def cancel_session(session_id):
    """
    Either the teacher or the learner on a still-pending/approved session
    may cancel it. Body: { "user_id": <teacher_id or learner_id> }
    """
    data = request.get_json(silent=True) or {}
    user_id, err = _require_int(data, "user_id")
    if err:
        return err

    session = db_client.get_session(session_id)
    if not session:
        return error_response(f"No session found with session_id {session_id}", 404)

    if session["status"] not in ("pending", "approved"):
        return error_response(
            f"Session #{session_id} is '{session['status']}' and can no longer be cancelled", 409
        )

    teacher_id, learner_id = session["teacher_id"], session["learner_id"]
    if user_id not in (teacher_id, learner_id):
        return error_response("Only the teacher or learner on this session can cancel it", 403)

    updated = db_client.update_session(session_id, "cancelled", cancelled_by=user_id)

    other_party = learner_id if user_id == teacher_id else teacher_id
    _notify(
        other_party, "session_cancelled",
        f"Session #{session_id} was cancelled.", related_session_id=session_id,
    )

    return jsonify({"message": f"Session #{session_id} cancelled", "session": updated}), 200


@sessions_bp.route("/sessions/<int:session_id>/complete", methods=["PATCH"])
def complete_session(session_id):
    """
    Marks the caller's side of an approved session as complete. Body:
    { "user_id": <teacher_id or learner_id> }

    Once both sides have confirmed, database_service flips the session's
    status to 'completed' in the same update, at which point both
    participants get a review_prompt notification.
    """
    data = request.get_json(silent=True) or {}
    user_id, err = _require_int(data, "user_id")
    if err:
        return err

    session = db_client.get_session(session_id)
    if not session:
        return error_response(f"No session found with session_id {session_id}", 404)

    if session["status"] != "approved":
        return error_response(
            f"Session #{session_id} must be 'approved' before it can be marked complete "
            f"(currently '{session['status']}')", 409,
        )

    teacher_id, learner_id = session["teacher_id"], session["learner_id"]
    if user_id == teacher_id:
        role = "teacher"
    elif user_id == learner_id:
        role = "learner"
    else:
        return error_response("Only the teacher or learner on this session can mark it complete", 403)

    updated = db_client.mark_session_completed(session_id, role)

    if updated["status"] == "completed":
        _notify(
            teacher_id, "review_prompt",
            f"Session #{session_id} is complete - leave a review.", related_session_id=session_id,
        )
        _notify(
            learner_id, "review_prompt",
            f"Session #{session_id} is complete - leave a review.", related_session_id=session_id,
        )

    return jsonify({"message": f"Marked complete by {role}", "session": updated}), 200


# ── Reviews ──

@sessions_bp.route("/sessions/<int:session_id>/review", methods=["POST"])
def submit_review(session_id):
    """
    Submit the review for a completed session. Only one review is stored
    per session (schema enforces session_id as UNIQUE), by whichever
    participant reviews it first.

    Expected JSON body:
    { "reviewer_id": 4, "rating": 5, "comment": "Great tutor!" }
    """
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body must be JSON", 400)

    reviewer_id, err = _require_int(data, "reviewer_id")
    if err:
        return err
    rating, err = _require_int(data, "rating")
    if err:
        return err
    if rating < 1 or rating > 5:
        return error_response("'rating' must be an integer between 1 and 5", 400)
    comment = data.get("comment")

    session = db_client.get_session(session_id)
    if not session:
        return error_response(f"No session found with session_id {session_id}", 404)

    if session["status"] != "completed":
        return error_response(f"Session #{session_id} must be 'completed' before it can be reviewed", 409)

    teacher_id, learner_id = session["teacher_id"], session["learner_id"]
    if reviewer_id == teacher_id:
        reviewee_id = learner_id
    elif reviewer_id == learner_id:
        reviewee_id = teacher_id
    else:
        return error_response("Only the teacher or learner on this session can review it", 403)

    # Anti-farming weight: discount this review based on how many times
    # reviewer_id has already reviewed reviewee_id before.
    prior_review_count = db_client.count_reviews_between(reviewer_id, reviewee_id)
    weight = _compute_review_weight(prior_review_count)

    try:
        review_id = db_client.insert_review(session_id, reviewer_id, reviewee_id, rating, comment, weight)
    except DBServiceError as e:
        if e.status_code == 409:
            return error_response(f"Session #{session_id} has already been reviewed", 409)
        raise

    new_average, new_count = _recalculate_rating(reviewee_id)

    return jsonify({
        "message": "Review submitted",
        "review": {
            "review_id": review_id,
            "session_id": session_id,
            "reviewer_id": reviewer_id,
            "reviewee_id": reviewee_id,
            "rating": rating,
            "comment": comment,
            "weight": weight,
        },
        "reviewee_credits_average": new_average,
        "reviewee_credits_count": new_count,
    }), 201


@sessions_bp.route("/sessions/<int:session_id>/review", methods=["GET"])
def get_session_review(session_id):
    """
    database_service has no direct 'review by session_id' lookup, so this
    checks both possible reviewees' review lists for a match - cheap given
    a session only ever has zero or one review.
    """
    session = db_client.get_session(session_id)
    if not session:
        return error_response(f"No session found with session_id {session_id}", 404)

    candidates = (
        db_client.get_user_reviews(session["teacher_id"])
        + db_client.get_user_reviews(session["learner_id"])
    )
    review = next((r for r in candidates if r["session_id"] == session_id), None)

    if not review:
        return error_response(f"Session #{session_id} has not been reviewed yet", 404)

    return jsonify({"review": review}), 200


@sessions_bp.route("/users/<int:user_id>/reviews", methods=["GET"])
def list_user_reviews(user_id):
    """Reviews received by this user, newest first (profile page)."""
    reviews = db_client.get_user_reviews(user_id)
    return jsonify({"user_id": user_id, "count": len(reviews), "reviews": reviews}), 200
