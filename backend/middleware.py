from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from database import db
import logging
import json

logger = logging.getLogger(__name__)

def log_api_call(action, table_name, record_id=None, details=None):
    """Log API calls to audit_logs table"""
    try:
        user_id = get_jwt_identity()
        ip_address = request.remote_addr
        
        query = """
            INSERT INTO audit_logs (user_id, action, table_name, record_id, details, ip_address)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        db.execute_query(
            query,
            (user_id, action, table_name, record_id, json.dumps(details) if details else None, ip_address),
            fetch=False
        )
        logger.info(f"Audit log created: {action} on {table_name} by user {user_id}")
    except Exception as e:
        logger.error(f"Failed to create audit log: {e}")

def role_required(allowed_roles):
    """Decorator to check if user has required role"""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
                user_id = get_jwt_identity()
            except Exception as e:
                logger.error(f"JWT verification failed: {e}")
                return jsonify({"error": "Invalid or missing token"}), 401
            
            # Get user role from database
            query = "SELECT role, base_id FROM users WHERE id = %s AND is_active = TRUE"
            user = db.execute_one(query, (user_id,))
            
            if not user:
                return jsonify({"error": "User not found or inactive"}), 403
            
            user_role = user['role']
            
            # Check if user has required role
            if user_role not in allowed_roles:
                return jsonify({"error": "Insufficient permissions"}), 403
            
            # Add user info to kwargs for use in route
            kwargs['current_user'] = {
                'id': user_id,
                'role': user_role,
                'base_id': user['base_id']
            }
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def base_access_check(fn):
    """Decorator to check if user has access to specific base data"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        current_user = kwargs.get('current_user', {})
        user_role = current_user.get('role')
        user_base_id = current_user.get('base_id')
        
        # Admin has access to all bases
        if user_role == 'admin':
            return fn(*args, **kwargs)
        
        # Base commander can only access their base
        if user_role == 'base_commander':
            base_id = request.args.get('base_id') or request.json.get('base_id') if request.json else None
            if base_id and int(base_id) != user_base_id:
                return jsonify({"error": "Access denied to this base"}), 403
        
        return fn(*args, **kwargs)
    return wrapper
