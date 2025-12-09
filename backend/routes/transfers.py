from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from database import db
from middleware import role_required, log_api_call
import logging

logger = logging.getLogger(__name__)
transfers_bp = Blueprint('transfers', __name__)

@transfers_bp.route('', methods=['GET'])
@jwt_required()
@role_required(['admin', 'base_commander', 'logistics_officer'])
def get_transfers(**kwargs):
    """Get all transfers with filters"""
    try:
        current_user = kwargs.get('current_user', {})
        
        base_id = request.args.get('base_id', type=int)
        equipment_type_id = request.args.get('equipment_type_id', type=int)
        status = request.args.get('status')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = """
            SELECT t.*,
                   et.name as equipment_name,
                   et.category,
                   b1.name as from_base_name,
                   b2.name as to_base_name,
                   u1.full_name as initiated_by_name,
                   u2.full_name as approved_by_name
            FROM transfers t
            JOIN equipment_types et ON t.equipment_type_id = et.id
            JOIN bases b1 ON t.from_base_id = b1.id
            JOIN bases b2 ON t.to_base_id = b2.id
            LEFT JOIN users u1 ON t.initiated_by = u1.id
            LEFT JOIN users u2 ON t.approved_by = u2.id
            WHERE 1=1
        """
        params = []
        
        # Base commanders see transfers involving their base
        if current_user['role'] == 'base_commander':
            query += " AND (t.from_base_id = %s OR t.to_base_id = %s)"
            params.extend([current_user['base_id'], current_user['base_id']])
        elif base_id:
            query += " AND (t.from_base_id = %s OR t.to_base_id = %s)"
            params.extend([base_id, base_id])
        
        if equipment_type_id:
            query += " AND t.equipment_type_id = %s"
            params.append(equipment_type_id)
        if status:
            query += " AND t.status = %s"
            params.append(status)
        if start_date:
            query += " AND t.transfer_date >= %s"
            params.append(start_date)
        if end_date:
            query += " AND t.transfer_date <= %s"
            params.append(end_date)
        
        query += " ORDER BY t.transfer_date DESC, t.id DESC"
        
        results = db.execute_query(query, tuple(params))
        
        return jsonify({
            "transfers": [dict(r) for r in results] if results else []
        }), 200
        
    except Exception as e:
        logger.error(f"Get transfers error: {e}")
        return jsonify({"error": str(e)}), 500

@transfers_bp.route('', methods=['POST'])
@jwt_required()
@role_required(['admin', 'logistics_officer', 'base_commander'])
def create_transfer(**kwargs):
    """Create a new transfer"""
    try:
        current_user = kwargs.get('current_user', {})
        data = request.get_json()
        
        from_base_id = data.get('from_base_id')
        to_base_id = data.get('to_base_id')
        equipment_type_id = data.get('equipment_type_id')
        quantity = data.get('quantity')
        transfer_date = data.get('transfer_date')
        notes = data.get('notes')
        
        # Validate required fields
        if not all([from_base_id, to_base_id, equipment_type_id, quantity, transfer_date]):
            return jsonify({"error": "Missing required fields"}), 400
        
        if from_base_id == to_base_id:
            return jsonify({"error": "Cannot transfer to the same base"}), 400
        
        # Base commanders can only create transfers from their base
        if current_user['role'] == 'base_commander' and from_base_id != current_user['base_id']:
            return jsonify({"error": "Can only transfer from your assigned base"}), 403
        
        # Check if sufficient inventory exists
        check_inventory_query = """
            SELECT quantity FROM asset_inventory
            WHERE base_id = %s AND equipment_type_id = %s
        """
        inventory = db.execute_one(check_inventory_query, (from_base_id, equipment_type_id))
        
        if not inventory or inventory['quantity'] < quantity:
            return jsonify({"error": "Insufficient inventory for transfer"}), 400
        
        # Insert transfer
        insert_query = """
            INSERT INTO transfers
            (equipment_type_id, from_base_id, to_base_id, quantity, transfer_date, 
             status, initiated_by, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        result = db.execute_one(
            insert_query,
            (equipment_type_id, from_base_id, to_base_id, quantity, transfer_date,
             'pending', current_user['id'], notes)
        )
        
        transfer_id = result['id']
        
        # Deduct from source base inventory
        update_from_query = """
            UPDATE asset_inventory
            SET quantity = quantity - %s,
                last_updated = CURRENT_TIMESTAMP
            WHERE base_id = %s AND equipment_type_id = %s
        """
        db.execute_query(update_from_query, (quantity, from_base_id, equipment_type_id), fetch=False)
        
        # Log the action
        log_api_call('create_transfer', 'transfers', transfer_id, {
            'from_base_id': from_base_id,
            'to_base_id': to_base_id,
            'equipment_type_id': equipment_type_id,
            'quantity': quantity
        })
        
        return jsonify({
            "message": "Transfer created successfully",
            "transfer_id": transfer_id
        }), 201
        
    except Exception as e:
        logger.error(f"Create transfer error: {e}")
        return jsonify({"error": str(e)}), 500

@transfers_bp.route('/<int:transfer_id>/status', methods=['PUT'])
@jwt_required()
@role_required(['admin', 'base_commander', 'logistics_officer'])
def update_transfer_status(transfer_id, **kwargs):
    """Update transfer status"""
    try:
        current_user = kwargs.get('current_user', {})
        data = request.get_json()
        
        new_status = data.get('status')
        received_date = data.get('received_date')
        
        if not new_status:
            return jsonify({"error": "Status is required"}), 400
        
        # Get existing transfer
        get_query = "SELECT * FROM transfers WHERE id = %s"
        transfer = db.execute_one(get_query, (transfer_id,))
        
        if not transfer:
            return jsonify({"error": "Transfer not found"}), 404
        
        # Base commanders can only update transfers involving their base
        if current_user['role'] == 'base_commander':
            if transfer['from_base_id'] != current_user['base_id'] and transfer['to_base_id'] != current_user['base_id']:
                return jsonify({"error": "Access denied to this transfer"}), 403
        
        # Update transfer status
        update_query = """
            UPDATE transfers
            SET status = %s, received_date = %s, approved_by = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        db.execute_query(update_query, (new_status, received_date, current_user['id'], transfer_id), fetch=False)
        
        # If completed, add to destination base inventory
        if new_status == 'completed' and transfer['status'] != 'completed':
            update_to_query = """
                INSERT INTO asset_inventory (base_id, equipment_type_id, quantity)
                VALUES (%s, %s, %s)
                ON CONFLICT (base_id, equipment_type_id)
                DO UPDATE SET quantity = asset_inventory.quantity + EXCLUDED.quantity,
                             last_updated = CURRENT_TIMESTAMP
            """
            db.execute_query(
                update_to_query,
                (transfer['to_base_id'], transfer['equipment_type_id'], transfer['quantity']),
                fetch=False
            )
        
        # If cancelled, return to source base
        if new_status == 'cancelled' and transfer['status'] != 'cancelled':
            update_from_query = """
                UPDATE asset_inventory
                SET quantity = quantity + %s,
                    last_updated = CURRENT_TIMESTAMP
                WHERE base_id = %s AND equipment_type_id = %s
            """
            db.execute_query(
                update_from_query,
                (transfer['quantity'], transfer['from_base_id'], transfer['equipment_type_id']),
                fetch=False
            )
        
        # Log the action
        log_api_call('update_transfer_status', 'transfers', transfer_id, {
            'new_status': new_status,
            'old_status': transfer['status']
        })
        
        return jsonify({"message": "Transfer status updated successfully"}), 200
        
    except Exception as e:
        logger.error(f"Update transfer status error: {e}")
        return jsonify({"error": str(e)}), 500

@transfers_bp.route('/<int:transfer_id>', methods=['DELETE'])
@jwt_required()
@role_required(['admin'])
def delete_transfer(transfer_id, **kwargs):
    """Delete a transfer (admin only)"""
    try:
        # Get transfer details first
        get_query = "SELECT * FROM transfers WHERE id = %s"
        transfer = db.execute_one(get_query, (transfer_id,))
        
        if not transfer:
            return jsonify({"error": "Transfer not found"}), 404
        
        # Reverse inventory changes based on status
        if transfer['status'] == 'completed':
            # Remove from destination
            db.execute_query(
                "UPDATE asset_inventory SET quantity = quantity - %s WHERE base_id = %s AND equipment_type_id = %s",
                (transfer['quantity'], transfer['to_base_id'], transfer['equipment_type_id']),
                fetch=False
            )
        
        if transfer['status'] != 'cancelled':
            # Return to source
            db.execute_query(
                "UPDATE asset_inventory SET quantity = quantity + %s WHERE base_id = %s AND equipment_type_id = %s",
                (transfer['quantity'], transfer['from_base_id'], transfer['equipment_type_id']),
                fetch=False
            )
        
        # Delete transfer
        delete_query = "DELETE FROM transfers WHERE id = %s"
        db.execute_query(delete_query, (transfer_id,), fetch=False)
        
        # Log the action
        log_api_call('delete_transfer', 'transfers', transfer_id, {
            'from_base_id': transfer['from_base_id'],
            'to_base_id': transfer['to_base_id']
        })
        
        return jsonify({"message": "Transfer deleted successfully"}), 200
        
    except Exception as e:
        logger.error(f"Delete transfer error: {e}")
        return jsonify({"error": str(e)}), 500
