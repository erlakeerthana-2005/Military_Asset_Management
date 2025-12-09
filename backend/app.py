from flask import Flask, jsonify
from dotenv import load_dotenv

load_dotenv()
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    """Application factory"""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize extensions
    CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)
    jwt = JWTManager(app)
    
    # Register blueprints
    from routes.auth import auth_bp
    from routes.dashboard import dashboard_bp
    from routes.purchases import purchases_bp
    from routes.transfers import transfers_bp
    from routes.assignments_expenditures import assignments_bp, expenditures_bp
    from routes.common import common_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(purchases_bp, url_prefix='/api/purchases')
    app.register_blueprint(transfers_bp, url_prefix='/api/transfers')
    app.register_blueprint(assignments_bp, url_prefix='/api/assignments')
    app.register_blueprint(expenditures_bp, url_prefix='/api/expenditures')
    app.register_blueprint(common_bp, url_prefix='/api/common')
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not found"}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal error: {error}")
        return jsonify({"error": "Internal server error"}), 500
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        logger.warning("Token expired")
        return jsonify({"error": "Token has expired"}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        logger.warning(f"Invalid token: {error}")
        return jsonify({"error": "Invalid token"}), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        logger.warning("Missing token in request")
        return jsonify({"error": "Authorization token is missing"}), 401
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "healthy", "message": "Military Asset Management API"}), 200
    
    return app

if __name__ == '__main__':
    app = create_app()
    logger.info(f"Starting server on {Config.HOST}:{Config.PORT}")
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
