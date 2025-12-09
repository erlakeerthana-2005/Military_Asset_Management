-- Military Asset Management System Database Schema

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS expenditures CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS transfers CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS asset_inventory CASCADE;
DROP TABLE IF EXISTS equipment_types CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS bases CASCADE;
DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS transfer_status;

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('admin', 'base_commander', 'logistics_officer');
CREATE TYPE transfer_status AS ENUM ('pending', 'in_transit', 'completed', 'cancelled');

-- Bases Table
CREATE TABLE bases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(200) NOT NULL,
    commander_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    base_id INTEGER REFERENCES bases(id),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Equipment Types Table
CREATE TABLE equipment_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL, -- e.g., 'weapon', 'vehicle', 'ammunition'
    description TEXT,
    unit_of_measure VARCHAR(20) NOT NULL, -- e.g., 'units', 'rounds', 'vehicles'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asset Inventory Table (Current Stock)
CREATE TABLE asset_inventory (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL REFERENCES bases(id),
    equipment_type_id INTEGER NOT NULL REFERENCES equipment_types(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(base_id, equipment_type_id)
);

-- Purchases Table
CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL REFERENCES bases(id),
    equipment_type_id INTEGER NOT NULL REFERENCES equipment_types(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12, 2),
    total_price DECIMAL(12, 2),
    vendor VARCHAR(200),
    purchase_date DATE NOT NULL,
    received_date DATE,
    created_by INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transfers Table
CREATE TABLE transfers (
    id SERIAL PRIMARY KEY,
    equipment_type_id INTEGER NOT NULL REFERENCES equipment_types(id),
    from_base_id INTEGER NOT NULL REFERENCES bases(id),
    to_base_id INTEGER NOT NULL REFERENCES bases(id),
    quantity INTEGER NOT NULL,
    transfer_date DATE NOT NULL,
    received_date DATE,
    status transfer_status DEFAULT 'pending',
    initiated_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT different_bases CHECK (from_base_id != to_base_id)
);

-- Assignments Table
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL REFERENCES bases(id),
    equipment_type_id INTEGER NOT NULL REFERENCES equipment_types(id),
    quantity INTEGER NOT NULL,
    assigned_to VARCHAR(100) NOT NULL, -- Personnel name/ID
    assigned_date DATE NOT NULL,
    return_date DATE,
    purpose TEXT,
    created_by INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active', -- active, returned
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenditures Table
CREATE TABLE expenditures (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL REFERENCES bases(id),
    equipment_type_id INTEGER NOT NULL REFERENCES equipment_types(id),
    quantity INTEGER NOT NULL,
    expended_date DATE NOT NULL,
    reason VARCHAR(200) NOT NULL, -- e.g., 'training', 'combat', 'maintenance'
    authorized_by VARCHAR(100),
    created_by INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- e.g., 'purchase', 'transfer', 'assignment', 'expenditure'
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_asset_inventory_base ON asset_inventory(base_id);
CREATE INDEX idx_asset_inventory_equipment ON asset_inventory(equipment_type_id);
CREATE INDEX idx_purchases_base ON purchases(base_id);
CREATE INDEX idx_purchases_date ON purchases(purchase_date);
CREATE INDEX idx_transfers_from_base ON transfers(from_base_id);
CREATE INDEX idx_transfers_to_base ON transfers(to_base_id);
CREATE INDEX idx_transfers_date ON transfers(transfer_date);
CREATE INDEX idx_assignments_base ON assignments(base_id);
CREATE INDEX idx_expenditures_base ON expenditures(base_id);
CREATE INDEX idx_expenditures_date ON expenditures(expended_date);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Insert Sample Data

-- Insert Bases
INSERT INTO bases (name, location, commander_name) VALUES
('Base Alpha', 'Northern Region', 'Colonel John Smith'),
('Base Bravo', 'Eastern Region', 'Colonel Sarah Johnson'),
('Base Charlie', 'Western Region', 'Colonel Michael Brown'),
('Central Depot', 'Central Region', 'Colonel Emily Davis');

-- Insert Equipment Types
INSERT INTO equipment_types (name, category, description, unit_of_measure) VALUES
('M4 Rifle', 'weapon', 'Standard issue assault rifle', 'units'),
('M249 SAW', 'weapon', 'Squad automatic weapon', 'units'),
('9mm Pistol', 'weapon', 'Sidearm', 'units'),
('Humvee', 'vehicle', 'Multi-purpose vehicle', 'units'),
('M1 Abrams Tank', 'vehicle', 'Main battle tank', 'units'),
('5.56mm Ammunition', 'ammunition', 'Rifle ammunition', 'rounds'),
('9mm Ammunition', 'ammunition', 'Pistol ammunition', 'rounds'),
('Hand Grenades', 'ammunition', 'Fragmentation grenades', 'units'),
('Night Vision Goggles', 'equipment', 'NVG Gen 3', 'units'),
('Body Armor', 'equipment', 'Tactical vest with plates', 'units');

-- Insert Users (passwords are hashed - these are placeholders, will be generated properly in backend)
-- Default password for all: password123
INSERT INTO users (username, password_hash, full_name, role, base_id, email) VALUES
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNlLqPGiW', 'System Administrator', 'admin', NULL, 'admin@military.gov'),
('commander_alpha', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNlLqPGiW', 'John Smith', 'base_commander', 1, 'commander.alpha@military.gov'),
('commander_bravo', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNlLqPGiW', 'Sarah Johnson', 'base_commander', 2, 'commander.bravo@military.gov'),
('commander_charlie', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNlLqPGiW', 'Michael Brown', 'base_commander', 3, 'commander.charlie@military.gov'),
('logistics_alpha', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNlLqPGiW', 'Robert Wilson', 'logistics_officer', 1, 'logistics.alpha@military.gov'),
('logistics_bravo', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNlLqPGiW', 'Jennifer Martinez', 'logistics_officer', 2, 'logistics.bravo@military.gov');

-- Insert Initial Asset Inventory
INSERT INTO asset_inventory (base_id, equipment_type_id, quantity) VALUES
-- Base Alpha
(1, 1, 150), -- M4 Rifles
(1, 2, 20),  -- M249 SAW
(1, 3, 100), -- 9mm Pistols
(1, 4, 25),  -- Humvees
(1, 5, 5),   -- M1 Abrams
(1, 6, 50000), -- 5.56mm Ammo
(1, 7, 10000), -- 9mm Ammo
(1, 8, 500),   -- Grenades
(1, 9, 80),    -- NVGs
(1, 10, 150),  -- Body Armor

-- Base Bravo
(2, 1, 120),
(2, 2, 15),
(2, 3, 80),
(2, 4, 20),
(2, 5, 3),
(2, 6, 40000),
(2, 7, 8000),
(2, 8, 400),
(2, 9, 60),
(2, 10, 120),

-- Base Charlie
(3, 1, 100),
(3, 2, 12),
(3, 3, 70),
(3, 4, 15),
(3, 5, 2),
(3, 6, 35000),
(3, 7, 7000),
(3, 8, 300),
(3, 9, 50),
(3, 10, 100),

-- Central Depot
(4, 1, 500),
(4, 2, 100),
(4, 3, 300),
(4, 4, 50),
(4, 5, 15),
(4, 6, 200000),
(4, 7, 50000),
(4, 8, 2000),
(4, 9, 200),
(4, 10, 500);

-- Insert Sample Purchases
INSERT INTO purchases (base_id, equipment_type_id, quantity, unit_price, total_price, vendor, purchase_date, received_date, created_by) VALUES
(1, 1, 50, 800.00, 40000.00, 'Colt Manufacturing', '2024-01-15', '2024-01-20', 2),
(2, 4, 10, 150000.00, 1500000.00, 'AM General', '2024-02-01', '2024-02-15', 3),
(3, 6, 10000, 0.50, 5000.00, 'Federal Premium', '2024-03-10', '2024-03-12', 4);

-- Insert Sample Transfers
INSERT INTO transfers (equipment_type_id, from_base_id, to_base_id, quantity, transfer_date, status, initiated_by) VALUES
(1, 4, 1, 30, '2024-04-01', 'completed', 2),
(6, 4, 2, 5000, '2024-04-15', 'completed', 3),
(4, 1, 3, 5, '2024-05-01', 'in_transit', 5);

-- Insert Sample Assignments
INSERT INTO assignments (base_id, equipment_type_id, quantity, assigned_to, assigned_date, purpose, created_by, status) VALUES
(1, 1, 30, 'Platoon 1-A', '2024-06-01', 'Training Exercise', 2, 'active'),
(2, 4, 5, 'Convoy Team B', '2024-06-15', 'Patrol Mission', 3, 'active');

-- Insert Sample Expenditures
INSERT INTO expenditures (base_id, equipment_type_id, quantity, expended_date, reason, authorized_by, created_by) VALUES
(1, 6, 2000, '2024-07-01', 'Training Exercise', 'Colonel John Smith', 2),
(2, 8, 50, '2024-07-15', 'Combat Simulation', 'Colonel Sarah Johnson', 3);

-- Create trigger function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_bases_updated_at BEFORE UPDATE ON bases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON transfers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
