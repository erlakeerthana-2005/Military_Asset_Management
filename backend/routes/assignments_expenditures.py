from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from database import db
from middleware import role_required, base_access_check, log_api_call
import logging

logger = logging.getLogger(__name__)
assignments_bp = Blueprint('assignments', __name__)

@assignments_bp.route('', methods=['GET'])
@jwt_required()
@role_required(['admin', 'base_commander', 'logistics_officer'])
@base_access_check
def get_assignments(**kwargs):
    """Get all assignments with filters"""
    try:
        current_user = kwargs.get('current_user', {})
        
        base_id = request.args.get('base_id', type=int)
        equipment_type_id = request.args.get('equipment_type_id', type=int)
        status = request.args.get('status', 'active')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Apply base filter for base commanders
        if current_user['role'] == 'base_commander' and not base_id:
            base_id = current_user['base_id']
        
        query = """
            SELECT a.*,
                   b.name as base_name,
                   et.name as equipment_name,
                   et.category,
                   u.full_name as created_by_name
            FROM assignments a
            JOIN bases b ON a.base_id = b.id
            JOIN equipment_types et ON a.equipment_type_id = et.id
            LEFT JOIN users u ON a.created_by = u.id
            WHERE 1=1
        """
        params = []
        
        if base_id:
            query += " AND a.base_id = %s"
            params.append(base_id)
        if equipment_type_id:
            query += " AND a.equipment_type_id = %s"
            params.append(equipment_type_id)
        if status:
            query += " AND a.status = %s"
            params.append(status)
        if start_date:
            query += " AND a.assigned_date >= %s"
            params.append(start_date)
        if end_date:
            query += " AND a.assigned_date <= %s"
            params.append(end_date)
        
        query += " ORDER BY a.assigned_date DESC, a.id DESC"
        
        results = db.execute_query(query, tuple(params))
        
        return jsonify({
            "assignments": [dict(r) for r in results] if results else []
        }), 200
        
    except Exception as e:
        logger.error(f"Get assignments error: {e}")
        return jsonify({"error": str(e)}), 500

@assignments_bp.route('', methods=['POST'])
@jwt_required()
@role_required(['admin', 'base_commander'])
@base_access_check
def create_assignment(**kwargs):
    """Create a new assignment"""
    try:
        current_user = kwargs.get('current_user', {})
        data = request.get_json()
        
        base_id = data.get('base_id')
        equipment_type_id = data.get('equipment_type_id')
        quantity = data.get('quantity')
        assigned_to = data.get('assigned_to')
        assigned_date = data.get('assigned_date')
        purpose = data.get('purpose')
        
        # Validate required fields
        if not all([base_id, equipment_type_id, quantity, assigned_to, assigned_date]):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Base commanders can only create assignments for their base
        if current_user['role'] == 'base_commander' and base_id != current_user['base_id']:
            return jsonify({"error": "Can only create assignments for your base"}), 403
        
        # Check if sufficient inventory exists
        check_inventory_query = """
            SELECT quantity FROM asset_inventory
            WHERE base_id = %s AND equipment_type_id = %s
        """
        inventory = db.execute_one(check_inventory_query, (base_id, equipment_type_id))
        
        if not inventory or inventory['quantity'] < quantity:
            return jsonify({"error": "Insufficient inventory for assignment"}), 400
        
        # Insert assignment
        insert_query = """
            INSERT INTO assignments
            (base_id, equipment_type_id, quantity, assigned_to, assigned_date, purpose, created_by, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        result = db.execute_one(
            insert_query,
            (base_id, equipment_type_id, quantity, assigned_to, assigned_date, purpose, current_user['id'], 'active')
        )
        
        assignment_id = result['id']
        
        # Deduct from inventory (assigned items are still tracked but not available)
        update_inventory_query = """
            UPDATE asset_inventory
            SET quantity = quantity - %s,
                last_updated = CURRENT_TIMESTAMP
            WHERE base_id = %s AND equipment_type_id = %s
        """
        db.execute_query(update_inventory_query, (quantity, base_id, equipment_type_id), fetch=False)
        
        # Log the action
        log_api_call('create_assignment', 'assignments', assignment_id, {
            'base_id': base_id,
            'equipment_type_id': equipment_type_id,
            'quantity': quantity,
            'assigned_to': assigned_to
        })
        
        return jsonify({
            "message": "Assignment created successfully",
            "assignment_id": assignment_id
        }), 201
        
    except Exception as e:
        logger.error(f"Create assignment error: {e}")
        return jsonify({"error": str(e)}), 500

@assignments_bp.route('/<int:assignment_id>/return', methods=['PUT'])
@jwt_required()
@role_required(['admin', 'base_commander'])
def return_assignment(assignment_id, **kwargs):
    """Mark an assignment as returned"""
    try:
        current_user = kwargs.get('current_user', {})
        data = request.get_json()
        
        return_date = data.get('return_date')
        
        if not return_date:
            return jsonify({"error": "Return date is required"}), 400
        
        # Get existing assignment
        get_query = "SELECT * FROM assignments WHERE id = %s"
        assignment = db.execute_one(get_query, (assignment_id,))
        
        if not assignment:
            return jsonify({"error": "Assignment not found"}), 404
        
        if assignment['status'] == 'returned':
            return jsonify({"error": "Assignment already returned"}), 400
        
        # Base commanders can only return assignments from their base
        if current_user['role'] == 'base_commander' and assignment['base_id'] != current_user['base_id']:
            return jsonify({"error": "Access denied to this assignment"}), 403
        
        # Update assignment status
        update_query = """
            UPDATE assignments
            SET status = 'returned', return_date = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        db.execute_query(update_query, (return_date, assignment_id), fetch=False)
        
        # Return to inventory
        update_inventory_query = """
            INSERT INTO asset_inventory (base_id, equipment_type_id, quantity)
            VALUES (%s, %s, %s)
            ON CONFLICT (base_id, equipment_type_id)
            DO UPDATE SET quantity = asset_inventory.quantity + EXCLUDED.quantity,
                         last_updated = CURRENT_TIMESTAMP
        """
        db.execute_query(
            update_inventory_query,
            (assignment['base_id'], assignment['equipment_type_id'], assignment['quantity']),
            fetch=False
        )
        
        # Log the action
        log_api_call('return_assignment', 'assignments', assignment_id, {
            'return_date': return_date
        })
        
        return jsonify({"message": "Assignment returned successfully"}), 200
        
    except Exception as e:
        logger.error(f"Return assignment error: {e}")
        return jsonify({"error": str(e)}), 500

@assignments_bp.route('/<int:assignment_id>', methods=['DELETE'])
@jwt_required()
@role_required(['admin'])
def delete_assignment(assignment_id, **kwargs):
    """Delete an assignment (admin only)"""
    try:
        # Get assignment details first
        get_query = "SELECT * FROM assignments WHERE id = %s"
        assignment = db.execute_one(get_query, (assignment_id,))
        
        if not assignment:
            return jsonify({"error": "Assignment not found"}), 404
        
        # If assignment is active, return to inventory
        if assignment['status'] == 'active':
            update_inventory_query = """
                UPDATE asset_inventory
                SET quantity = quantity + %s,
                    last_updated = CURRENT_TIMESTAMP
                WHERE base_id = %s AND equipment_type_id = %s
            """
            db.execute_query(
                update_inventory_query,
                (assignment['quantity'], assignment['base_id'], assignment['equipment_type_id']),
                fetch=False
            )
        
        # Delete assignment
        delete_query = "DELETE FROM assignments WHERE id = %s"
        db.execute_query(delete_query, (assignment_id,), fetch=False)
        
        # Log the action
        log_api_call('delete_assignment', 'assignments', assignment_id, {
            'base_id': assignment['base_id'],
            'equipment_type_id': assignment['equipment_type_id']
        })
        
        return jsonify({"message": "Assignment deleted successfully"}), 200
        
    except Exception as e:
        logger.error(f"Delete assignment error: {e}")
        return jsonify({"error": str(e)}), 500


# Expenditures Blueprint
expenditures_bp = Blueprint('expenditures', __name__)

@expenditures_bp.route('', methods=['GET'])
@jwt_required()
@role_required(['admin', 'base_commander', 'logistics_officer'])
@base_access_check
def get_expenditures(**kwargs):
    """Get all expenditures with filters"""
    try:
        current_user = kwargs.get('current_user', {})
        
        base_id = request.args.get('base_id', type=int)
        equipment_type_id = request.args.get('equipment_type_id', type=int)
        reason = request.args.get('reason')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Apply base filter for base commanders
        if current_user['role'] == 'base_commander' and not base_id:
            base_id = current_user['base_id']
        
        query = """
            SELECT e.*,
                   b.name as base_name,
                   et.name as equipment_name,
                   et.category,
                   u.full_name as created_by_name
            FROM expenditures e
            JOIN bases b ON e.base_id = b.id
            JOIN equipment_types et ON e.equipment_type_id = et.id
            LEFT JOIN users u ON e.created_by = u.id
            WHERE 1=1
        """
        params = []
        
        if base_id:
            query += " AND e.base_id = %s"
            params.append(base_id)
        if equipment_type_id:
            query += " AND e.equipment_type_id = %s"
            params.append(equipment_type_id)
        if reason:
            query += " AND e.reason ILIKE %s"
            params.append(f"%{reason}%")
        if start_date:
            query += " AND e.expended_date >= %s"
            params.append(start_date)
        if end_date:
            query += " AND e.expended_date <= %s"
            params.append(end_date)
        
        query += " ORDER BY e.expended_date DESC, e.id DESC"
        
        results = db.execute_query(query, tuple(params))
        
        return jsonify({
            "expenditures": [dict(r) for r in results] if results else []
        }), 200
        
    except Exception as e:
        logger.error(f"Get expenditures error: {e}")
        return jsonify({"error": str(e)}), 500

@expenditures_bp.route('', methods=['POST'])
@jwt_required()
@role_required(['admin', 'base_commander'])
@base_access_check
def create_expenditure(**kwargs):
    """Record a new expenditure"""
    try:
        current_user = kwargs.get('current_user', {})
        data = request.get_json()
        
        base_id = data.get('base_id')
        equipment_type_id = data.get('equipment_type_id')
        quantity = data.get('quantity')
        expended_date = data.get('expended_date')
        reason = data.get('reason')
        authorized_by = data.get('authorized_by')
        notes = data.get('notes')
        
        # Validate required fields
        if not all([base_id, equipment_type_id, quantity, expended_date, reason]):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Base commanders can only record expenditures for their base
        if current_user['role'] == 'base_commander' and base_id != current_user['base_id']:
            return jsonify({"error": "Can only record expenditures for your base"}), 403
        
        # Check if sufficient inventory exists
        check_inventory_query = """
            SELECT quantity FROM asset_inventory
            WHERE base_id = %s AND equipment_type_id = %s
        """
        inventory = db.execute_one(check_inventory_query, (base_id, equipment_type_id))
        
        if not inventory or inventory['quantity'] < quantity:
            return jsonify({"error": "Insufficient inventory for expenditure"}), 400
        
        # Insert expenditure
        insert_query = """
            INSERT INTO expenditures
            (base_id, equipment_type_id, quantity, expended_date, reason, authorized_by, created_by, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        result = db.execute_one(
            insert_query,
            (base_id, equipment_type_id, quantity, expended_date, reason, authorized_by, current_user['id'], notes)
        )
        
        expenditure_id = result['id']
        
        # Deduct from inventory
        update_inventory_query = """
            UPDATE asset_inventory
            SET quantity = quantity - %s,
                last_updated = CURRENT_TIMESTAMP
            WHERE base_id = %s AND equipment_type_id = %s
        """
        db.execute_query(update_inventory_query, (quantity, base_id, equipment_type_id), fetch=False)
        
        # Log the action
        log_api_call('create_expenditure', 'expenditures', expenditure_id, {
            'base_id': base_id,
            'equipment_type_id': equipment_type_id,
            'quantity': quantity,
            'reason': reason
        })
        
        return jsonify({
            "message": "Expenditure recorded successfully",
            "expenditure_id": expenditure_id
        }), 201
        
    except Exception as e:
        logger.error(f"Create expenditure error: {e}")
        return jsonify({"error": str(e)}), 500

@expenditures_bp.route('/<int:expenditure_id>', methods=['DELETE'])
@jwt_required()
@role_required(['admin'])
def delete_expenditure(expenditure_id, **kwargs):
    """Delete an expenditure (admin only)"""
    try:
        # Get expenditure details first
        get_query = "SELECT * FROM expenditures WHERE id = %s"
        expenditure = db.execute_one(get_query, (expenditure_id,))
        
        if not expenditure:
            return jsonify({"error": "Expenditure not found"}), 404
        
        # Return to inventory
        update_inventory_query = """
            UPDATE asset_inventory
            SET quantity = quantity + %s,
                last_updated = CURRENT_TIMESTAMP
            WHERE base_id = %s AND equipment_type_id = %s
        """
        db.execute_query(
            update_inventory_query,
            (expenditure['quantity'], expenditure['base_id'], expenditure['equipment_type_id']),
            fetch=False
        )
        
        # Delete expenditure
        delete_query = "DELETE FROM expenditures WHERE id = %s"
        db.execute_query(delete_query, (expenditure_id,), fetch=False)
        
        # Log the action
        log_api_call('delete_expenditure', 'expenditures', expenditure_id, {
            'base_id': expenditure['base_id'],
            'equipment_type_id': expenditure['equipment_type_id']
        })
        
        return jsonify({"message": "Expenditure deleted successfully"}), 200
        
    except Exception as e:
        logger.error(f"Delete expenditure error: {e}")
        return jsonify({"error": str(e)}), 500
