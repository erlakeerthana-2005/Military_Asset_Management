from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from database import db
from middleware import role_required, base_access_check
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/metrics', methods=['GET'])
@jwt_required()
@role_required(['admin', 'base_commander', 'logistics_officer'])
@base_access_check
def get_dashboard_metrics(**kwargs):
    """Get dashboard metrics with filters"""
    try:
        current_user = kwargs.get('current_user', {})
        
        # Get query parameters
        base_id = request.args.get('base_id', type=int)
        equipment_type_id = request.args.get('equipment_type_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Apply base filter for base commanders
        if current_user['role'] == 'base_commander' and not base_id:
            base_id = current_user['base_id']
        
        # Default date range: last 30 days
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
        if not start_date:
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        
        # Build WHERE clause
        where_conditions = ["1=1"]
        params = []
        
        if base_id:
            where_conditions.append("inv.base_id = %s")
            params.append(base_id)
        
        if equipment_type_id:
            where_conditions.append("inv.equipment_type_id = %s")
            params.append(equipment_type_id)
        
        where_clause = " AND ".join(where_conditions)
        
        # Get current inventory (Closing Balance)
        closing_query = f"""
            SELECT 
                COALESCE(SUM(inv.quantity), 0) as closing_balance
            FROM asset_inventory inv
            WHERE {where_clause}
        """
        closing_result = db.execute_one(closing_query, tuple(params))
        closing_balance = int(closing_result['closing_balance'])
        
        # Get purchases within date range
        purchase_params = []
        purchase_query = "SELECT COALESCE(SUM(quantity), 0) as total_purchases FROM purchases WHERE 1=1"
        
        if base_id:
            purchase_query += " AND base_id = %s"
            purchase_params.append(base_id)
        
        if equipment_type_id:
            purchase_query += " AND equipment_type_id = %s"
            purchase_params.append(equipment_type_id)
        
        purchase_query += " AND purchase_date BETWEEN %s AND %s"
        purchase_params.extend([start_date, end_date])
            
        purchases = db.execute_one(purchase_query, tuple(purchase_params))
        total_purchases = int(purchases['total_purchases']) if purchases else 0
        
        # Get transfers in
        transfer_in_params = []
        transfer_in_query = "SELECT COALESCE(SUM(quantity), 0) as total_transfer_in FROM transfers WHERE 1=1"
        
        if base_id:
            transfer_in_query += " AND to_base_id = %s"
            transfer_in_params.append(base_id)
        
        if equipment_type_id:
            transfer_in_query += " AND equipment_type_id = %s"
            transfer_in_params.append(equipment_type_id)
        
        transfer_in_query += " AND transfer_date BETWEEN %s AND %s AND status = 'completed'"
        transfer_in_params.extend([start_date, end_date])
        
        transfers_in = db.execute_one(transfer_in_query, tuple(transfer_in_params))
        total_transfer_in = int(transfers_in['total_transfer_in']) if transfers_in else 0
        
        # Get transfers out
        transfer_out_params = []
        transfer_out_query = "SELECT COALESCE(SUM(quantity), 0) as total_transfer_out FROM transfers WHERE 1=1"
        
        if base_id:
            transfer_out_query += " AND from_base_id = %s"
            transfer_out_params.append(base_id)
        
        if equipment_type_id:
            transfer_out_query += " AND equipment_type_id = %s"
            transfer_out_params.append(equipment_type_id)
        
        transfer_out_query += " AND transfer_date BETWEEN %s AND %s AND status = 'completed'"
        transfer_out_params.extend([start_date, end_date])
        
        transfers_out = db.execute_one(transfer_out_query, tuple(transfer_out_params))
        total_transfer_out = int(transfers_out['total_transfer_out']) if transfers_out else 0
        
        # Get assignments
        assignment_params = []
        assignment_query = "SELECT COALESCE(SUM(quantity), 0) as total_assigned FROM assignments WHERE 1=1"
        
        if base_id:
            assignment_query += " AND base_id = %s"
            assignment_params.append(base_id)
        
        if equipment_type_id:
            assignment_query += " AND equipment_type_id = %s"
            assignment_params.append(equipment_type_id)
        
        assignment_query += " AND assigned_date BETWEEN %s AND %s AND status = 'active'"
        assignment_params.extend([start_date, end_date])
        
        assignments = db.execute_one(assignment_query, tuple(assignment_params))
        total_assigned = int(assignments['total_assigned']) if assignments else 0
        
        # Get expenditures
        expenditure_params = []
        expenditure_query = "SELECT COALESCE(SUM(quantity), 0) as total_expended FROM expenditures WHERE 1=1"
        
        if base_id:
            expenditure_query += " AND base_id = %s"
            expenditure_params.append(base_id)
        
        if equipment_type_id:
            expenditure_query += " AND equipment_type_id = %s"
            expenditure_params.append(equipment_type_id)
        
        expenditure_query += " AND expended_date BETWEEN %s AND %s"
        expenditure_params.extend([start_date, end_date])
        
        expenditures = db.execute_one(expenditure_query, tuple(expenditure_params))
        total_expended = int(expenditures['total_expended']) if expenditures else 0
        
        # Calculate net movement and opening balance
        net_movement = total_purchases + total_transfer_in - total_transfer_out
        opening_balance = closing_balance - net_movement + total_assigned + total_expended
        
        return jsonify({
            "metrics": {
                "opening_balance": opening_balance,
                "closing_balance": closing_balance,
                "net_movement": net_movement,
                "purchases": total_purchases,
                "transfer_in": total_transfer_in,
                "transfer_out": total_transfer_out,
                "assigned": total_assigned,
                "expended": total_expended
            },
            "filters": {
                "base_id": base_id,
                "equipment_type_id": equipment_type_id,
                "start_date": start_date,
                "end_date": end_date
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Dashboard metrics error: {e}")
        return jsonify({"error": str(e)}), 500

@dashboard_bp.route('/movement-details', methods=['GET'])
@jwt_required()
@role_required(['admin', 'base_commander', 'logistics_officer'])
def get_movement_details(**kwargs):
    """Get detailed breakdown of movements (purchases, transfers in/out)"""
    try:
        current_user = kwargs.get('current_user', {})
        
        base_id = request.args.get('base_id', type=int)
        equipment_type_id = request.args.get('equipment_type_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Apply base filter for base commanders
        if current_user['role'] == 'base_commander' and not base_id:
            base_id = current_user['base_id']
        
        # Get purchases
        purchase_query = """
            SELECT p.id, p.quantity, p.purchase_date, p.vendor, p.total_price,
                   et.name as equipment_name, b.name as base_name
            FROM purchases p
            JOIN equipment_types et ON p.equipment_type_id = et.id
            JOIN bases b ON p.base_id = b.id
            WHERE 1=1
        """
        purchase_params = []
        
        if base_id:
            purchase_query += " AND p.base_id = %s"
            purchase_params.append(base_id)
        if equipment_type_id:
            purchase_query += " AND p.equipment_type_id = %s"
            purchase_params.append(equipment_type_id)
        if start_date and end_date:
            purchase_query += " AND p.purchase_date BETWEEN %s AND %s"
            purchase_params.extend([start_date, end_date])
        
        purchase_query += " ORDER BY p.purchase_date DESC LIMIT 50"
        purchases = db.execute_query(purchase_query, tuple(purchase_params))
        
        # Get transfers in
        transfer_in_query = """
            SELECT t.id, t.quantity, t.transfer_date, t.status,
                   et.name as equipment_name,
                   b1.name as from_base_name,
                   b2.name as to_base_name
            FROM transfers t
            JOIN equipment_types et ON t.equipment_type_id = et.id
            JOIN bases b1 ON t.from_base_id = b1.id
            JOIN bases b2 ON t.to_base_id = b2.id
            WHERE 1=1
        """
        transfer_in_params = []
        
        if base_id:
            transfer_in_query += " AND t.to_base_id = %s"
            transfer_in_params.append(base_id)
        if equipment_type_id:
            transfer_in_query += " AND t.equipment_type_id = %s"
            transfer_in_params.append(equipment_type_id)
        if start_date and end_date:
            transfer_in_query += " AND t.transfer_date BETWEEN %s AND %s"
            transfer_in_params.extend([start_date, end_date])
        
        transfer_in_query += " AND t.status = 'completed' ORDER BY t.transfer_date DESC LIMIT 50"
        transfers_in = db.execute_query(transfer_in_query, tuple(transfer_in_params))
        
        # Get transfers out
        transfer_out_query = transfer_in_query.replace("t.to_base_id = %s", "t.from_base_id = %s")
        transfers_out = db.execute_query(transfer_out_query, tuple(transfer_in_params))
        
        return jsonify({
            "purchases": [dict(p) for p in purchases] if purchases else [],
            "transfers_in": [dict(t) for t in transfers_in] if transfers_in else [],
            "transfers_out": [dict(t) for t in transfers_out] if transfers_out else []
        }), 200
        
    except Exception as e:
        logger.error(f"Movement details error: {e}")
        return jsonify({"error": str(e)}), 500

@dashboard_bp.route('/inventory-summary', methods=['GET'])
@jwt_required()
@role_required(['admin', 'base_commander'])
def get_inventory_summary(**kwargs):
    """Get inventory summary by base and equipment type"""
    try:
        current_user = kwargs.get('current_user', {})
        base_id = request.args.get('base_id', type=int)
        
        if current_user['role'] == 'base_commander' and not base_id:
            base_id = current_user['base_id']
        
        query = """
            SELECT 
                b.name as base_name,
                et.name as equipment_name,
                et.category,
                inv.quantity,
                et.unit_of_measure
            FROM asset_inventory inv
            JOIN bases b ON inv.base_id = b.id
            JOIN equipment_types et ON inv.equipment_type_id = et.id
            WHERE 1=1
        """
        params = []
        
        if base_id:
            query += " AND inv.base_id = %s"
            params.append(base_id)
        
        query += " ORDER BY b.name, et.category, et.name"
        
        results = db.execute_query(query, tuple(params))
        
        return jsonify({
            "inventory": [dict(r) for r in results] if results else []
        }), 200
        
    except Exception as e:
        logger.error(f"Inventory summary error: {e}")
        return jsonify({"error": str(e)}), 500
