from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from database import db
import bcrypt
import logging
import traceback

logger = logging.getLogger(__name__)
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({"error": "Username and password required"}), 400
        
        # Get user from database
        query = """
            SELECT u.id, u.username, u.password_hash, u.full_name, u.role, u.base_id, b.name as base_name
            FROM users u
            LEFT JOIN bases b ON u.base_id = b.id
            WHERE u.username = %s AND u.is_active = TRUE
        """
        user = db.execute_one(query, (username,))
        
        if not user:
            return jsonify({"error": "Invalid credentials"}), 401
        
        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({"error": "Invalid credentials"}), 401
        
        # Create access token
        access_token = create_access_token(identity=str(user['id']))
        
        return jsonify({
            "access_token": access_token,
            "user": {
                "id": user['id'],
                "username": user['username'],
                "full_name": user['full_name'],
                "role": user['role'],
                "base_id": user['base_id'],
                "base_name": user['base_name']
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({"error": "Login failed"}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    try:
        user_id = get_jwt_identity()
        
        query = """
            SELECT u.id, u.username, u.full_name, u.role, u.base_id, u.email, b.name as base_name
            FROM users u
            LEFT JOIN bases b ON u.base_id = b.id
            WHERE u.id = %s AND u.is_active = TRUE
        """
        user = db.execute_one(query, (user_id,))
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({"user": dict(user)}), 200
        
    except Exception as e:
        logger.error(f"Get user error: {e}")
        return jsonify({"error": "Failed to get user info"}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        old_password = data.get('old_password')
        new_password = data.get('new_password')
        
        if not old_password or not new_password:
            return jsonify({"error": "Old and new passwords required"}), 400
        
        # Get current password hash
        query = "SELECT password_hash FROM users WHERE id = %s"
        user = db.execute_one(query, (user_id,))
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Verify old password
        if not bcrypt.checkpw(old_password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({"error": "Invalid old password"}), 401
        
        # Hash new password
        new_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Update password
        update_query = "UPDATE users SET password_hash = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s"
        db.execute_query(update_query, (new_hash, user_id), fetch=False)
        
        return jsonify({"message": "Password changed successfully"}), 200
        
    except Exception as e:
        logger.error(f"Change password error: {e}")
        return jsonify({"error": "Failed to change password"}), 500
