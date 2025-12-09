"""
WSGI entry point for Render deployment
"""
from app import create_app
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create the app instance
app = create_app()

if __name__ == "__main__":
    app.run()
