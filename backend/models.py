from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Base(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    location = db.Column(db.String(100))
    
    def to_dict(self):
        return {"id": self.id, "name": self.name, "location": self.location}

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False) # admin, commander, logistics
    base_id = db.Column(db.Integer, db.ForeignKey('base.id'), nullable=True)
    
    base = db.relationship('Base')

    def to_dict(self):
        return {
            "id": self.id, 
            "username": self.username, 
            "role": self.role, 
            "base_name": self.base.name if self.base else None
        }

class AssetType(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    category = db.Column(db.String(50)) # Weapon, Vehicle, Ammo
    
    def to_dict(self):
        return {"id": self.id, "name": self.name, "category": self.category}

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    type = db.Column(db.String(50), nullable=False) 
    # Types: PURCHASE, TRANSFER_IN, TRANSFER_OUT, ASSIGN, EXPEND
    asset_type_id = db.Column(db.Integer, db.ForeignKey('asset_type.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    
    # Context
    base_id = db.Column(db.Integer, db.ForeignKey('base.id'), nullable=False) # The base where this action physically happens/is recorded
    related_base_id = db.Column(db.Integer, db.ForeignKey('base.id'), nullable=True) # For transfers: where it came from or went to
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    notes = db.Column(db.String(200))

    asset_type = db.relationship('AssetType')
    base = db.relationship('Base', foreign_keys=[base_id])
    related_base = db.relationship('Base', foreign_keys=[related_base_id])
    user = db.relationship('User')

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat(),
            "type": self.type,
            "asset_name": self.asset_type.name,
            "quantity": self.quantity,
            "base_name": self.base.name,
            "related_base_name": self.related_base.name if self.related_base else None,
            "user": self.user.username,
            "notes": self.notes
        }
