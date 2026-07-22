from flask import Blueprint, request, jsonify
import db_client
from db_client import DBServiceError

messages_bp = Blueprint("messages", __name__)


def error_response(message, status_code):
    return jsonify({"error": message}), status_code


def handle_db_error(e: DBServiceError):
    return error_response(e.message, e.status_code)


# start a 1:1 conversation, for example from the Message button on a profile
@messages_bp.route("/api/conversations", methods=["POST"])
def start_conversation():
    """Expected JSON body: { "participant_ids": [4, 9] }"""
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body must be JSON", 400)

    participant_ids = data.get("participant_ids")
    if not participant_ids or len(participant_ids) < 2:
        return error_response("'participant_ids' must include at least two users", 400)

    try:
        conversation_id = db_client.insert_conversation(participant_ids, is_group=False)
        return jsonify({"message": "Conversation started", "conversation_id": conversation_id}), 201
    except DBServiceError as e:
        return handle_db_error(e)
    except Exception as e:
        return error_response(str(e), 500)

# list every conversation a user is part of, for the Messages page's left panel
@messages_bp.route("/api/users/<int:user_id>/conversations", methods=["GET"])
def get_user_conversations(user_id):
    try:
        conversations = db_client.list_user_conversations(user_id)

        for conversation in conversations:
            conversation["participants"] = db_client.get_conversation_participants(
                conversation["conversation_id"]
            )

        return jsonify({"user_id": user_id, "count": len(conversations), "conversations": conversations}), 200
    except DBServiceError as e:
        return handle_db_error(e)
    except Exception as e:
        return error_response(str(e), 500)
