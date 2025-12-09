import psycopg
from psycopg import sql
from config import Config
import logging

logger = logging.getLogger(__name__)

class Database:
    """Database connection manager"""
    
    def __init__(self):
        self.conn = None
        
    def get_connection(self):
        """Get database connection"""
        try:
            if self.conn is None or self.conn.closed:
                self.conn = psycopg.connect(
                    Config.DATABASE_URL,
                    autocommit=False
                )
            return self.conn
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            raise
    
    def close_connection(self):
        """Close database connection"""
        if self.conn and not self.conn.closed:
            self.conn.close()
            
    def execute_query(self, query, params=None, fetch=True):
        """Execute a query and optionally fetch results"""
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                if fetch:
                    results = cursor.fetchall()
                    conn.commit()
                    return results
                else:
                    conn.commit()
                    return cursor.rowcount
        except Exception as e:
            if self.conn:
                self.conn.rollback()
            logger.error(f"Query execution error: {e}")
            raise
    
    def execute_one(self, query, params=None):
        """Execute a query and fetch one result"""
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                result = cursor.fetchone()
                conn.commit()
                return result
        except Exception as e:
            if self.conn:
                self.conn.rollback()
            logger.error(f"Query execution error: {e}")
            raise

# Create global database instance
db = Database()
