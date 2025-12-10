```python
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from models import db, User, Base, AssetType, Transaction
from datetime import datetime
from sqlalchemy import func, and_
import os

app = Flask(__name__)

# Database Configuration
database_url = os.environ.get('DATABASE_URL', 'sqlite:///military.db')
# Fix for Render's postgres:// URLs (SQLAlchemy requires postgresql://)
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['JWT_SECRET_KEY'] = 'super-secret-key-change-this'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app)
db.init_app(app)
jwt = JWTManager(app)
bcrypt = Bcrypt(app)

# Init DB
with app.app_context():
    db.create_all()
    
    # Ensure Bases
    b1 = Base.query.filter_by(name='Base Alpha').first()
    if not b1:
        b1 = Base(name='Base Alpha', location='Sector 1')
        db.session.add(b1)
    
    b2 = Base.query.filter_by(name='Base Bravo').first()
    if not b2:
        b2 = Base(name='Base Bravo', location='Sector 2')
        db.session.add(b2)
    
    db.session.commit()
    
    # Ensure Asset Types
    if not AssetType.query.first():
        at1 = AssetType(name='M4 Carbine', category='Weapon')
        at2 = AssetType(name='Humvee', category='Vehicle')
        at3 = AssetType(name='5.56mm Ammo', category='Ammo')
        db.session.add_all([at1, at2, at3])
        db.session.commit()
        
    # Ensure Users
    hashed = bcrypt.generate_password_hash('password123').decode('utf-8')
    
    if not User.query.filter_by(username='admin').first():
        admin = User(username='admin', password_hash=hashed, role='admin')
        db.session.add(admin)
        
    if not User.query.filter_by(username='logistics').first():
        log_officer = User(username='logistics', password_hash=hashed, role='logistics', base_id=b1.id)
        db.session.add(log_officer)
        
    if not User.query.filter_by(username='commander').first():
        commander = User(username='commander', password_hash=hashed, role='commander', base_id=b1.id)
        db.session.add(commander)
        
    db.session.commit()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    if user and bcrypt.check_password_hash(user.password_hash, password):
        identity = {'id': user.id, 'username': user.username, 'role': user.role, 'base_id': user.base_id}
        token = create_access_token(identity=identity)
        return jsonify({'token': token, 'user': identity})
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/metadata', methods=['GET'])
@jwt_required()
def get_metadata():
    bases = Base.query.all()
    types = AssetType.query.all()
    return jsonify({
        'bases': [b.to_dict() for b in bases],
        'assetTypes': [t.to_dict() for t in types]
    })

@app.route('/api/transactions', methods=['POST'])
@jwt_required()
def create_transaction():
    current_user = get_jwt_identity()
    data = request.get_json()
    
    # RBAC Enforcement
    role = current_user['role']
    txn_type = data['type'] # PURCHASE, TRANSFER, ASSIGN, EXPEND
    
    if role == 'logistics':
        if txn_type not in ['PURCHASE', 'TRANSFER']:
            return jsonify({'error': 'Logistics Officer authorized for Purchases and Transfers only.'}), 403
            
    if role == 'commander':
        if txn_type not in ['ASSIGN', 'EXPEND']:
             # Commanders mainly manage base stock usage, but maybe transfers too? 
             # Requirement: "Logistics Officer: Limited access to purchases and transfers." -> implies Commanders do others? 
             # Or Commanders do everything? "Base Commander: Access to data and operations for their assigned base."
             # Usually Commanders can request transfers too. But let's stick to the specific "Logistics limited to P&T" meaning others (Assignments/Expend) are NOT for Logistics.
             # User said: "base Commander: Access to data and operations for their assigned base." (Full scope for base).
             pass

    # Force base_id to user's base if not admin
    if role != 'admin':
        # Ensure the operation is for their base
        if int(data['base_id']) != current_user['base_id']:
             return jsonify({'error': 'Unauthorized operation on another base.'}), 403

    new_txn = Transaction(
        type=txn_type,
        asset_type_id=data['asset_type_id'],
        quantity=data['quantity'],
        base_id=data['base_id'],
        related_base_id=data.get('related_base_id'),
        user_id=current_user['id'],
        notes=data.get('notes'),
        timestamp=datetime.utcnow()
    )
    db.session.add(new_txn)
    db.session.commit()
    return jsonify({'message': 'Transaction recorded', 'transaction': new_txn.to_dict()}), 201

@app.route('/api/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    current_user = get_jwt_identity()
    
    # Filters
    type_filter = request.args.get('type')
    base_id = request.args.get('base_id')
    
    # Security: If not admin, FORCE base_id filter
    if current_user['role'] != 'admin':
        base_id = current_user['base_id']
    
    query = Transaction.query
    if type_filter:
        query = query.filter_by(type=type_filter)
    if base_id:
        query = query.filter(
            (Transaction.base_id == base_id) | (Transaction.related_base_id == base_id)
        )
        
    txns = query.order_by(Transaction.timestamp.desc()).all()
    return jsonify([t.to_dict() for t in txns])

@app.route('/api/dashboard', methods=['GET'])
@jwt_required()
def dashboard_metrics():
    current_user = get_jwt_identity()
    base_id = request.args.get('base_id')
    
    # Security: Force base_id if not admin
    if current_user['role'] != 'admin':
        base_id = current_user['base_id']
    
    query = Transaction.query
    if base_id:
        query = query.filter(
            (Transaction.base_id == base_id) | (Transaction.related_base_id == base_id)
        )
    
    txns = query.all()
    
    purchases = 0
    transfers_in = 0
    transfers_out = 0
    assigned = 0
    expended = 0
    
    # If base_id is provided, limit scope. If not (Admin overview), count everything?
    # For Admin view without base_id, straightforward sums might be weird for transfers (net 0 globally).
    # Assuming base-specific view for now.
    target_base = int(base_id) if base_id else None

    for t in txns:
        # If no target_base (Global Admin), we might just show global Purchase/Expend.
        # Transfers cancel out globally.
        
        if t.type == 'PURCHASE':
            purchases += t.quantity
        elif t.type == 'ASSIGN':
            assigned += t.quantity
        elif t.type == 'EXPEND':
            expended += t.quantity
        elif t.type == 'TRANSFER':
            if target_base:
                if t.base_id == target_base:
                    transfers_out += t.quantity
                elif t.related_base_id == target_base:
                    transfers_in += t.quantity
            else:
                # Global view: Show total movement volume? Or just ignore for Net?
                # For net movement globally: Purchases - Expended.
                pass 

    opening = 0 
    # Net Movement for a Base = Purchases + In - Out
    net_movement = purchases + transfers_in - transfers_out
    
    # Closing = Opening + Net - Expended (Assuming Assigned is just a state, not removed from inventory yet. Expended is removed.)
    # Actually User Req: "Assigned to personnel and track expended"
    # Usually Assigned assets are still on Closing Balance (just checked out). Expended are gone.
    closing = opening + net_movement - expended
    
    return jsonify({
        'opening_balance': opening,
        'closing_balance': closing,
        'net_movement': net_movement,
        'assigned': assigned,
        'expended': expended,
        'breakdown': {
            'purchases': purchases,
            'transfer_in': transfers_in,
            'transfer_out': transfers_out
        }
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
