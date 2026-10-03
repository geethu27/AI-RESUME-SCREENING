import os
from dotenv import load_dotenv

# Load environment variables from .env file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)


class Config:
    """Application configuration loaded from environment variables."""

    # Server configuration
    PORT = int(os.getenv('PORT', 5000))
    DEBUG = os.getenv('FLASK_ENV', 'development') == 'development'
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-rule-based-screening-secret-key-2026')

    # MySQL Database configuration
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME = os.getenv('DB_NAME', 'resume_screening')

    # File Uploads
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16 MB default
    ALLOWED_EXTENSIONS = {'pdf', 'docx'}

    # Scoring weights (predefined, deterministic rule-based scoring)
    REQUIRED_SKILLS_WEIGHT = 60.0
    PREFERRED_SKILLS_WEIGHT = 15.0
    EXPERIENCE_WEIGHT = 15.0
    EDUCATION_WEIGHT = 10.0

    # Default Screening status thresholds
    SHORTLISTED_THRESHOLD = 80.0
    REVIEW_THRESHOLD = 60.0


# Ensure upload folder exists
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
