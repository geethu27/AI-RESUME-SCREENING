from flask import Blueprint, jsonify
from .auth_routes import auth_bp
from .job_routes import job_bp
from .resume_routes import resume_bp
from .screening_routes import screening_bp
from .candidate_routes import candidate_bp


def register_blueprints(app):
    """Registers all API route blueprints with the Flask application."""
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(job_bp, url_prefix="/api")
    app.register_blueprint(resume_bp, url_prefix="/api")
    app.register_blueprint(screening_bp, url_prefix="/api")
    app.register_blueprint(candidate_bp, url_prefix="/api")
