from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from database import db
from middleware import role_required
import logging

logger = logging.getLogger(__name__)
common_bp = Blueprint('common', __name__)

@common_bp.route('/bases', methods=['GET'])
@jwt_required()
def get_bases(**kwargs):
    """Get all bases"""
    try:
        query = "SELECT * FROM bases ORDER BY name"
        results = db.execute_query(query)
        
        return jsonify({
            "bases": [dict(r) for r in results] if results else []
        }), 200
        
    except Exception as e:
        logger.error(f"Get bases error: {e}")
        return jsonify({"error": str(e)}), 500

@common_bp.route('/equipment-types', methods=['GET'])
@jwt_required()
def get_equipment_types(**kwargs):
    """Get all equipment types"""
    try:
        category = request.args.get('category')
        
        query = "SELECT * FROM equipment_types"
        params = []
        
        if category:
            query += " WHERE category = %s"
            params.append(category)
        
        query += " ORDER BY category, name"
        
        results = db.execute_query(query, tuple(params) if params else None)
        
        return jsonify({
            "equipment_types": [dict(r) for r in results] if results else []
        }), 200
        
    except Exception as e:
        logger.error(f"Get equipment types error: {e}")
        return jsonify({"error": str(e)}), 500

@common_bp.route('/users', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_users(**kwargs):
    """Get all users (admin only)"""
    try:
        query = """
            SELECT u.id, u.username, u.full_name, u.role, u.base_id, u.email, u.is_active,
                   b.name as base_name
            FROM users u
            LEFT JOIN bases b ON u.base_id = b.id
            ORDER BY u.full_name
        """
        results = db.execute_query(query)
        
        return jsonify({
            "users": [dict(r) for r in results] if results else []
        }), 200
        
    except Exception as e:
        logger.error(f"Get users error: {e}")
        return jsonify({"error": str(e)}), 500

@common_bp.route('/audit-logs', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_audit_logs(**kwargs):
    """Get audit logs (admin only)"""
    try:
        action = request.args.get('action')
        user_id = request.args.get('user_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        limit = request.args.get('limit', 100, type=int)
        
        query = """
            SELECT a.*, u.full_name as user_name, u.username
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE 1=1
        """
        params = []
        
        if action:
            query += " AND a.action = %s"
            params.append(action)
        if user_id:
            query += " AND a.user_id = %s"
            params.append(user_id)
        if start_date:
            query += " AND a.created_at >= %s"
            params.append(start_date)
        if end_date:
            query += " AND a.created_at <= %s"
            params.append(end_date)
        
        query += f" ORDER BY a.created_at DESC LIMIT {limit}"
        
        results = db.execute_query(query, tuple(params) if params else None)
        
        return jsonify({
            "audit_logs": [dict(r) for r in results] if results else []
        }), 200
        
    except Exception as e:
        logger.error(f"Get audit logs error: {e}")
        return jsonify({"error": str(e)}), 500
