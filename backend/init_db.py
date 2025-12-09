
import os
import psycopg2
from config import Config
import logging

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
        conn = psycopg2.connect(Config.DATABASE_URL)
        cursor = conn.cursor()
        
        # Check if users table exists
        cursor.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users');")
        exists = cursor.fetchone()[0]
        
        if not exists:
            logger.info("Initializing database schema and sample data...")
            cursor.execute(schema_sql)
            conn.commit()
            logger.info("Database initialized successfully.")
        else:
            logger.info("Database already initialized.")
            
        cursor.close()
        conn.close()
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise

if __name__ == "__main__":
    init_db()
