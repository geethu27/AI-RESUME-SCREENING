from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from models.database import get_db
from utils.validators import validate_auth_credentials

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Recruiter login endpoint.
    Deterministic authentication with hashed passwords.
    """
    data = request.get_json(silent=True) or {}
    is_valid, err_msg = validate_auth_credentials(data)
    if not is_valid:
        return jsonify({
            "success": False,
            "message": err_msg
        }), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    db = get_db()
    try:
        user = db.fetch_one("SELECT id, name, email, password_hash FROM users WHERE email = %s", (email,))
        if not user:
            return jsonify({
                "success": False,
                "message": "Invalid email or password"
            }), 401

        # Check password hash
        if not check_password_hash(user["password_hash"], password):
            return jsonify({
                "success": False,
                "message": "Invalid email or password"
            }), 401

        return jsonify({
            "success": True,
            "message": "Login successful",
            "data": {
                "user": {
                    "id": user["id"],
                    "name": user["name"],
                    "email": user["email"]
                }
            }
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": "An error occurred during authentication. Please check database connection."
        }), 500
