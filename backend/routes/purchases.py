from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from database import db
from middleware import role_required, base_access_check, log_api_call
import logging

logger = logging.getLogger(__name__)
purchases_bp = Blueprint('purchases', __name__)

@purchases_bp.route('', methods=['GET'])
@jwt_required()
@role_required(['admin', 'base_commander', 'logistics_officer'])
@base_access_check
def get_purchases(**kwargs):
    """Get all purchases with filters"""
    try:
        current_user = kwargs.get('current_user', {})
        
        base_id = request.args.get('base_id', type=int)
        equipment_type_id = request.args.get('equipment_type_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Apply base filter for base commanders
        if current_user['role'] == 'base_commander' and not base_id:
            base_id = current_user['base_id']
        
        query = """
            SELECT p.*, 
                   b.name as base_name,
                   et.name as equipment_name,
                   et.category,
                   u.full_name as created_by_name
            FROM purchases p
            JOIN bases b ON p.base_id = b.id
            JOIN equipment_types et ON p.equipment_type_id = et.id
            LEFT JOIN users u ON p.created_by = u.id
            WHERE 1=1
        """
        params = []
        
        if base_id:
            query += " AND p.base_id = %s"
            params.append(base_id)
        if equipment_type_id:
            query += " AND p.equipment_type_id = %s"
            params.append(equipment_type_id)
        if start_date:
            query += " AND p.purchase_date >= %s"
            params.append(start_date)
        if end_date:
            query += " AND p.purchase_date <= %s"
            params.append(end_date)
        
        query += " ORDER BY p.purchase_date DESC, p.id DESC"
        
        results = db.execute_query(query, tuple(params))
        
        return jsonify({
            "purchases": [dict(r) for r in results] if results else []
        }), 200
        
    except Exception as e:
        logger.error(f"Get purchases error: {e}")
        return jsonify({"error": str(e)}), 500

@purchases_bp.route('', methods=['POST'])
@jwt_required()
@role_required(['admin', 'logistics_officer', 'base_commander'])
@base_access_check
def create_purchase(**kwargs):
    """Create a new purchase"""
    try:
        current_user = kwargs.get('current_user', {})
        data = request.get_json()
        
        base_id = data.get('base_id')
        equipment_type_id = data.get('equipment_type_id')
        quantity = data.get('quantity')
        unit_price = data.get('unit_price')
        vendor = data.get('vendor')
        purchase_date = data.get('purchase_date')
        received_date = data.get('received_date')
        notes = data.get('notes')
        
        # Validate required fields
        if not all([base_id, equipment_type_id, quantity, purchase_date]):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Base commander can only create purchases for their base
        if current_user['role'] == 'base_commander' and base_id != current_user['base_id']:
            return jsonify({"error": "Access denied to this base"}), 403
        
        # Calculate total price
        total_price = None
        if unit_price:
            total_price = float(unit_price) * int(quantity)
        
        # Insert purchase
        insert_query = """
            INSERT INTO purchases 
            (base_id, equipment_type_id, quantity, unit_price, total_price, vendor, 
             purchase_date, received_date, created_by, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        result = db.execute_one(
            insert_query,
            (base_id, equipment_type_id, quantity, unit_price, total_price, vendor,
             purchase_date, received_date, current_user['id'], notes)
        )
        
        purchase_id = result['id']
        
        # Update inventory if purchase is received
        if received_date:
            update_inventory_query = """
                INSERT INTO asset_inventory (base_id, equipment_type_id, quantity)
                VALUES (%s, %s, %s)
                ON CONFLICT (base_id, equipment_type_id)
                DO UPDATE SET quantity = asset_inventory.quantity + EXCLUDED.quantity,
                             last_updated = CURRENT_TIMESTAMP
            """
            db.execute_query(update_inventory_query, (base_id, equipment_type_id, quantity), fetch=False)
        
        # Log the action
        log_api_call('create_purchase', 'purchases', purchase_id, {
            'base_id': base_id,
            'equipment_type_id': equipment_type_id,
            'quantity': quantity
        })
        
        return jsonify({
            "message": "Purchase created successfully",
            "purchase_id": purchase_id
        }), 201
        
    except Exception as e:
        logger.error(f"Create purchase error: {e}")
        return jsonify({"error": str(e)}), 500

@purchases_bp.route('/<int:purchase_id>', methods=['PUT'])
@jwt_required()
@role_required(['admin', 'logistics_officer'])
def update_purchase(purchase_id, **kwargs):
    """Update a purchase (e.g., mark as received)"""
    try:
        current_user = kwargs.get('current_user', {})
        data = request.get_json()
        
        received_date = data.get('received_date')
        notes = data.get('notes')
        
        # Get existing purchase
        get_query = "SELECT * FROM purchases WHERE id = %s"
        purchase = db.execute_one(get_query, (purchase_id,))
        
        if not purchase:
            return jsonify({"error": "Purchase not found"}), 404
        
        # Update purchase
        update_fields = []
        params = []
        
        if received_date:
            update_fields.append("received_date = %s")
            params.append(received_date)
        if notes is not None:
            update_fields.append("notes = %s")
            params.append(notes)
        
        if not update_fields:
            return jsonify({"error": "No fields to update"}), 400
        
        params.append(purchase_id)
        update_query = f"UPDATE purchases SET {', '.join(update_fields)} WHERE id = %s"
        db.execute_query(update_query, tuple(params), fetch=False)
        
        # If marking as received, update inventory
        if received_date and not purchase['received_date']:
            update_inventory_query = """
                INSERT INTO asset_inventory (base_id, equipment_type_id, quantity)
                VALUES (%s, %s, %s)
                ON CONFLICT (base_id, equipment_type_id)
                DO UPDATE SET quantity = asset_inventory.quantity + EXCLUDED.quantity,
                             last_updated = CURRENT_TIMESTAMP
            """
            db.execute_query(
                update_inventory_query,
                (purchase['base_id'], purchase['equipment_type_id'], purchase['quantity']),
                fetch=False
            )
        
        # Log the action
        log_api_call('update_purchase', 'purchases', purchase_id, {
            'received_date': received_date
        })
        
        return jsonify({"message": "Purchase updated successfully"}), 200
        
    except Exception as e:
        logger.error(f"Update purchase error: {e}")
        return jsonify({"error": str(e)}), 500

@purchases_bp.route('/<int:purchase_id>', methods=['DELETE'])
@jwt_required()
@role_required(['admin'])
def delete_purchase(purchase_id, **kwargs):
    """Delete a purchase (admin only)"""
    try:
        # Get purchase details first
        get_query = "SELECT * FROM purchases WHERE id = %s"
        purchase = db.execute_one(get_query, (purchase_id,))
        
        if not purchase:
            return jsonify({"error": "Purchase not found"}), 404
        
        # If purchase was received, adjust inventory
        if purchase['received_date']:
            update_inventory_query = """
                UPDATE asset_inventory
                SET quantity = quantity - %s,
                    last_updated = CURRENT_TIMESTAMP
                WHERE base_id = %s AND equipment_type_id = %s
            """
            db.execute_query(
                update_inventory_query,
                (purchase['quantity'], purchase['base_id'], purchase['equipment_type_id']),
                fetch=False
            )
        
        # Delete purchase
        delete_query = "DELETE FROM purchases WHERE id = %s"
        db.execute_query(delete_query, (purchase_id,), fetch=False)
        
        # Log the action
        log_api_call('delete_purchase', 'purchases', purchase_id, {
            'base_id': purchase['base_id'],
            'equipment_type_id': purchase['equipment_type_id']
        })
        
        return jsonify({"message": "Purchase deleted successfully"}), 200
        
    except Exception as e:
        logger.error(f"Delete purchase error: {e}")
        return jsonify({"error": str(e)}), 500
