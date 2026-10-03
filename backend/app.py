import os
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from models.database import init_db, get_db
from routes import register_blueprints

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


def create_app(config_class=Config) -> Flask:
    """Application factory for Resume Screening System."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS for all routes (allows React frontend to connect)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize Database
    try:
        init_db()
    except Exception as e:
        logger.error(f"Error during database initialization: {e}")

    # Register blueprints
    register_blueprints(app)

    # Health Check API (Exact format required by specification)
    @app.route("/api/health", methods=["GET"])
    def health():
        db = get_db()
        db_info = db.check_connection()
        return jsonify({
            "success": True,
            "message": "Resume Screening backend is running",
            "server": "online",
            "database": "connected" if db_info["connected"] else "disconnected",
            "database_type": db_info["database_type"]
        }), 200

    # Dashboard Statistics API (Helper for dashboard cards)
    @app.route("/api/dashboard/stats", methods=["GET"])
    def dashboard_stats():
        db = get_db()
        try:
            total_jobs = db.fetch_one("SELECT COUNT(*) as count FROM jobs")
            total_resumes = db.fetch_one("SELECT COUNT(*) as count FROM resumes")
            total_candidates = db.fetch_one("SELECT COUNT(*) as count FROM candidates")
            screened_candidates = db.fetch_one("SELECT COUNT(DISTINCT candidate_id) as count FROM screening_results")
            shortlisted_candidates = db.fetch_one("SELECT COUNT(DISTINCT candidate_id) as count FROM screening_results WHERE status = 'Shortlisted'")

            return jsonify({
                "success": True,
                "message": "Dashboard statistics retrieved successfully",
                "data": {
                    "total_jobs": total_jobs["count"] if total_jobs else 0,
                    "total_resumes": total_resumes["count"] if total_resumes else 0,
                    "total_candidates": total_candidates["count"] if total_candidates else 0,
                    "screened_candidates": screened_candidates["count"] if screened_candidates else 0,
                    "shortlisted_candidates": shortlisted_candidates["count"] if shortlisted_candidates else 0
                }
            }), 200
        except Exception as e:
            return jsonify({
                "success": False,
                "message": f"Failed to retrieve stats: {str(e)}"
            }), 500

    # Global 404 Handler
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "success": False,
            "message": "Endpoint not found"
        }), 404

    # Global 405 Handler
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "success": False,
            "message": "HTTP method not allowed for this route"
        }), 405

    # Global 500 Handler (Safe error response)
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            "success": False,
            "message": "An internal server error occurred. Please try again."
        }), 500

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", Config.PORT))
    logger.info(f"Starting Resume Screening System on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=Config.DEBUG)
