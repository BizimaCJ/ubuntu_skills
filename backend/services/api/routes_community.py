from flask import Blueprint, request, jsonify
import db_client
from db_client import DBServiceError

community_bp = Blueprint("community", __name__)


def error_response(message, status_code):
    return jsonify({"error": message}), status_code


def handle_db_error(e: DBServiceError):
    return error_response(e.message, e.status_code)


# host a group session, teacher is auto-added as the first member
@community_bp.route("/api/group-sessions", methods=["POST"])
def create_group_session():
    """
    Expected JSON body:
    { "teacher_id": 4, "category_id": 3, "topic": "Intro to React",
      "scheduled_time": "2026-07-22T18:00", "max_participants": 5 }
    Announces the session to every user who listed this category as
    something they want to learn, by sending each of them a notification.
    """
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body must be JSON", 400)

    teacher_id = data.get("teacher_id")
    category_id = data.get("category_id")
    topic = data.get("topic")
    scheduled_time = data.get("scheduled_time")
    max_participants = data.get("max_participants", 5)

    if not all([teacher_id, category_id, topic, scheduled_time]):
        return error_response("'teacher_id', 'category_id', 'topic', and 'scheduled_time' are required", 400)

    try:
        group_session_id = db_client.insert_group_session(
            teacher_id, category_id, topic, scheduled_time, max_participants
        )

        # The teacher is a member of their own group session from the start,
        # this is what makes the seat count start at 1 out of max_participants.
        db_client.insert_group_member(group_session_id, teacher_id)

        # A group chat is created up front, with just the teacher in it for now.
        conversation_id = db_client.insert_conversation(
            participant_ids=[teacher_id], is_group=True, group_session_id=group_session_id
        )

        learner_ids = db_client.category_learners(category_id)
        for learner_id in learner_ids:
            if learner_id == teacher_id:
                continue
            db_client.insert_notification(
                user_id=learner_id,
                notification_type="group_session_announced",
                message=f"A new group session on {topic} was just announced",
                related_group_session_id=group_session_id,
            )

        new_group_session = db_client.get_group_session(group_session_id)
        return jsonify({
            "message": "Group session created",
            "group_session": new_group_session,
            "conversation_id": conversation_id,
        }), 201

    except DBServiceError as e:
        return handle_db_error(e)
    except Exception as e:
        return error_response(str(e), 500)

