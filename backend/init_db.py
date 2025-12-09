
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from config import Config
import logging
import bcrypt

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    """Initialize database with schema and sample data if tables don't exist"""
    try:
        # Read schema file
        schema_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'schema.sql')
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
            
        # Connect to database
        conn = psycopg2.connect(Config.DATABASE_URL, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        
        # Check if users table exists
        cursor.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users');")
        exists = cursor.fetchone()['exists']
        
        if not exists:
            logger.info("Initializing database schema...")
            cursor.execute(schema_sql)
            conn.commit()
            logger.info("Database schema created successfully.")
            
            # Insert test bases
            logger.info("Creating test bases...")
            cursor.execute("""
                INSERT INTO bases (name, location, commander_name) VALUES
                ('Alpha Base', 'North Region', 'Commander Alpha'),
                ('Beta Base', 'South Region', 'Commander Beta'),
                ('Gamma Base', 'East Region', 'Commander Gamma')
                ON CONFLICT (name) DO NOTHING;
            """)
            conn.commit()
            
            # Insert test equipment types
            logger.info("Creating test equipment types...")
            cursor.execute("""
                INSERT INTO equipment_types (name, category, unit_of_measure) VALUES
                ('Rifle', 'weapon', 'units'),
                ('Ammunition', 'ammunition', 'rounds'),
                ('Jeep', 'vehicle', 'units'),
                ('Helmet', 'protective', 'units'),
                ('Boots', 'uniform', 'pairs')
                ON CONFLICT (name) DO NOTHING;
            """)
            conn.commit()
            
            # Create test users with hashed passwords
            logger.info("Creating test users...")
            password_hash = bcrypt.hashpw(b'password123', bcrypt.gensalt()).decode('utf-8')
            
            cursor.execute("""
                INSERT INTO users (username, password_hash, full_name, role, base_id, email, is_active) VALUES
                (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (username) DO NOTHING;
            """, ('admin', password_hash, 'Admin User', 'admin', None, 'admin@example.com', True))
            
            cursor.execute("""
                SELECT id FROM bases WHERE name = 'Alpha Base' LIMIT 1;
            """)
            base_alpha = cursor.fetchone()
            base_id_alpha = base_alpha['id'] if base_alpha else 1
            
            cursor.execute("""
                INSERT INTO users (username, password_hash, full_name, role, base_id, email, is_active) VALUES
                (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (username) DO NOTHING;
            """, ('commander_alpha', password_hash, 'Commander Alpha', 'base_commander', base_id_alpha, 'commander@alpha.com', True))
            
            cursor.execute("""
                INSERT INTO users (username, password_hash, full_name, role, base_id, email, is_active) VALUES
                (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (username) DO NOTHING;
            """, ('logistics_alpha', password_hash, 'Logistics Officer Alpha', 'logistics_officer', base_id_alpha, 'logistics@alpha.com', True))
            
            conn.commit()
            logger.info("Database initialized successfully with test data.")
        else:
            logger.info("Database already initialized.")
            
        cursor.close()
        conn.close()
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise

if __name__ == "__main__":
    init_db()
