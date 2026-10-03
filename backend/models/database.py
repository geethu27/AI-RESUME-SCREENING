import os
import sqlite3
import logging
from typing import Dict, Any, List, Optional, Tuple
from werkzeug.security import generate_password_hash, check_password_hash
from config import Config

logger = logging.getLogger(__name__)

# Try importing pymysql
try:
    import pymysql
    from pymysql.cursors import DictCursor
    PYMYSQL_AVAILABLE = True
except ImportError:
    PYMYSQL_AVAILABLE = False


class Database:
    """
    Robust database management class.
    Connects to MySQL as the primary database.
    If MySQL server is unavailable or connection fails, falls back gracefully to
    local SQLite database so the application can run offline or in development
    without crashing.
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
            cls._instance._is_mysql = False
            cls._instance._connected = False
            cls._instance._db_type = "unknown"
            cls._instance._initialized = False
            cls._instance._sqlite_path = os.path.join(
                os.path.dirname(os.path.abspath(__file__)), "..", "resume_screening.db"
            )
        return cls._instance

    def initialize(self):
        """Attempt MySQL initialization; fallback to SQLite if unavailable."""
        if getattr(self, "_initialized", False):
            return

        self._connected = False
        self._is_mysql = False

        if PYMYSQL_AVAILABLE:
            try:
                # 1. First connect to MySQL server (without database selected) to create db if needed
                server_conn = pymysql.connect(
                    host=Config.DB_HOST,
                    port=Config.DB_PORT,
                    user=Config.DB_USER,
                    password=Config.DB_PASSWORD,
                    connect_timeout=1,
                    charset="utf8mb4",
                    cursorclass=DictCursor
                )
                with server_conn.cursor() as cur:
                    cur.execute(f"CREATE DATABASE IF NOT EXISTS `{Config.DB_NAME}` CHARACTER SET utf8mb4;")
                server_conn.close()

                # 2. Test connection directly to the database
                test_conn = pymysql.connect(
                    host=Config.DB_HOST,
                    port=Config.DB_PORT,
                    user=Config.DB_USER,
                    password=Config.DB_PASSWORD,
                    database=Config.DB_NAME,
                    connect_timeout=3,
                    charset="utf8mb4",
                    cursorclass=DictCursor
                )
                test_conn.close()

                self._is_mysql = True
                self._connected = True
                self._db_type = "mysql"
                logger.info(f"Connected successfully to MySQL at {Config.DB_HOST}:{Config.DB_PORT}/{Config.DB_NAME}")
                self._create_mysql_tables()
                self._seed_default_admin()
                self._initialized = True
                return
            except Exception as e:
                logger.warning(
                    f"MySQL connection to {Config.DB_HOST}:{Config.DB_PORT} failed ({e}). "
                    "Falling back to local SQLite database for uninterrupted execution."
                )

        # Fallback to SQLite
        self._is_mysql = False
        self._connected = True
        self._db_type = "sqlite"
        logger.info(f"Using SQLite database at {self._sqlite_path}")
        self._create_sqlite_tables()
        self._seed_default_admin()
        self._initialized = True

    def get_connection(self):
        """Returns a new active database connection."""
        if self._is_mysql:
            return pymysql.connect(
                host=Config.DB_HOST,
                port=Config.DB_PORT,
                user=Config.DB_USER,
                password=Config.DB_PASSWORD,
                database=Config.DB_NAME,
                charset="utf8mb4",
                cursorclass=DictCursor,
                autocommit=True
            )
        else:
            conn = sqlite3.connect(self._sqlite_path, timeout=10.0)
            conn.row_factory = sqlite3.Row
            return conn

    def _convert_sql(self, sql: str) -> str:
        """Converts %s placeholders to ? for SQLite compatibility."""
        if not self._is_mysql:
            return sql.replace("%s", "?")
        return sql

    def execute_query(self, sql: str, params: Optional[Tuple] = None) -> int:
        """Executes INSERT, UPDATE, or DELETE and returns row count."""
        converted_sql = self._convert_sql(sql)
        params = params or ()
        conn = self.get_connection()
        try:
            if self._is_mysql:
                with conn.cursor() as cur:
                    count = cur.execute(converted_sql, params)
                    return count
            else:
                cur = conn.cursor()
                cur.execute(converted_sql, params)
                conn.commit()
                return cur.rowcount
        finally:
            conn.close()

    def execute_insert(self, sql: str, params: Optional[Tuple] = None) -> int:
        """Executes INSERT and returns lastrowid."""
        converted_sql = self._convert_sql(sql)
        params = params or ()
        conn = self.get_connection()
        try:
            if self._is_mysql:
                with conn.cursor() as cur:
                    cur.execute(converted_sql, params)
                    return cur.lastrowid
            else:
                cur = conn.cursor()
                cur.execute(converted_sql, params)
                conn.commit()
                return cur.lastrowid
        finally:
            conn.close()

    def fetch_one(self, sql: str, params: Optional[Tuple] = None) -> Optional[Dict[str, Any]]:
        """Fetches a single row as a dictionary."""
        converted_sql = self._convert_sql(sql)
        params = params or ()
        conn = self.get_connection()
        try:
            if self._is_mysql:
                with conn.cursor() as cur:
                    cur.execute(converted_sql, params)
                    row = cur.fetchone()
                    return dict(row) if row else None
            else:
                cur = conn.cursor()
                cur.execute(converted_sql, params)
                row = cur.fetchone()
                return dict(row) if row else None
        finally:
            conn.close()

    def fetch_all(self, sql: str, params: Optional[Tuple] = None) -> List[Dict[str, Any]]:
        """Fetches all rows as a list of dictionaries."""
        converted_sql = self._convert_sql(sql)
        params = params or ()
        conn = self.get_connection()
        try:
            if self._is_mysql:
                with conn.cursor() as cur:
                    cur.execute(converted_sql, params)
                    rows = cur.fetchall()
                    return [dict(r) for r in rows] if rows else []
            else:
                cur = conn.cursor()
                cur.execute(converted_sql, params)
                rows = cur.fetchall()
                return [dict(r) for r in rows] if rows else []
        finally:
            conn.close()

    def check_connection(self) -> Dict[str, Any]:
        """Returns safe connectivity status without exposing credentials."""
        return {
            "connected": self._connected,
            "database_type": self._db_type,
            "is_mysql": self._is_mysql,
            "database_name": Config.DB_NAME if self._is_mysql else "resume_screening.db",
            "host": Config.DB_HOST if self._is_mysql else "localhost"
        }

    def _create_mysql_tables(self):
        """Create MySQL tables."""
        conn = self.get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(150) NOT NULL,
                    email VARCHAR(191) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB;
                """)

                cur.execute("""
                CREATE TABLE IF NOT EXISTS jobs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT NOT NULL,
                    minimum_experience FLOAT DEFAULT 0,
                    education VARCHAR(255) DEFAULT 'Not specified',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB;
                """)

                cur.execute("""
                CREATE TABLE IF NOT EXISTS skills (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    skill_name VARCHAR(100) NOT NULL UNIQUE
                ) ENGINE=InnoDB;
                """)

                cur.execute("""
                CREATE TABLE IF NOT EXISTS job_skills (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    job_id INT NOT NULL,
                    skill_id INT NOT NULL,
                    skill_type ENUM('required', 'preferred') NOT NULL DEFAULT 'required',
                    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
                    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
                ) ENGINE=InnoDB;
                """)

                cur.execute("""
                CREATE TABLE IF NOT EXISTS candidates (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(150) NOT NULL,
                    email VARCHAR(191) DEFAULT NULL,
                    phone VARCHAR(50) DEFAULT NULL,
                    education VARCHAR(255) DEFAULT NULL,
                    experience FLOAT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB;
                """)

                cur.execute("""
                CREATE TABLE IF NOT EXISTS resumes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    candidate_id INT NOT NULL,
                    filename VARCHAR(255) NOT NULL,
                    file_path VARCHAR(500) NOT NULL,
                    extracted_text MEDIUMTEXT DEFAULT NULL,
                    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
                ) ENGINE=InnoDB;
                """)

                cur.execute("""
                CREATE TABLE IF NOT EXISTS candidate_skills (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    candidate_id INT NOT NULL,
                    skill_id INT NOT NULL,
                    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
                    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
                ) ENGINE=InnoDB;
                """)

                cur.execute("""
                CREATE TABLE IF NOT EXISTS screening_results (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    job_id INT NOT NULL,
                    candidate_id INT NOT NULL,
                    required_score FLOAT DEFAULT 0,
                    preferred_score FLOAT DEFAULT 0,
                    experience_score FLOAT DEFAULT 0,
                    education_score FLOAT DEFAULT 0,
                    total_score FLOAT DEFAULT 0,
                    matched_skills TEXT DEFAULT NULL,
                    missing_skills TEXT DEFAULT NULL,
                    status VARCHAR(50) DEFAULT 'Review',
                    screened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
                    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
                ) ENGINE=InnoDB;
                """)
        finally:
            conn.close()

    def _create_sqlite_tables(self):
        """Create tables in SQLite for fallback mode."""
        conn = self.get_connection()
        try:
            cur = conn.cursor()
            cur.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                minimum_experience REAL DEFAULT 0,
                education TEXT DEFAULT 'Not specified',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS skills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                skill_name TEXT NOT NULL UNIQUE
            );

            CREATE TABLE IF NOT EXISTS job_skills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id INTEGER NOT NULL,
                skill_id INTEGER NOT NULL,
                skill_type TEXT NOT NULL DEFAULT 'required',
                FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
                FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS candidates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                education TEXT,
                experience REAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS resumes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                candidate_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                file_path TEXT NOT NULL,
                extracted_text TEXT,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS candidate_skills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                candidate_id INTEGER NOT NULL,
                skill_id INTEGER NOT NULL,
                FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
                FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS screening_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id INTEGER NOT NULL,
                candidate_id INTEGER NOT NULL,
                required_score REAL DEFAULT 0,
                preferred_score REAL DEFAULT 0,
                experience_score REAL DEFAULT 0,
                education_score REAL DEFAULT 0,
                total_score REAL DEFAULT 0,
                matched_skills TEXT,
                missing_skills TEXT,
                status TEXT DEFAULT 'Review',
                screened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
                FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
            );
            """)
            conn.commit()
        finally:
            conn.close()

    def _seed_default_admin(self):
        """Seed default admin recruiter if users table is empty."""
        try:
            user = self.fetch_one("SELECT id FROM users WHERE email = %s", ("admin@company.com",))
            if not user:
                default_password_hash = generate_password_hash("admin123")
                self.execute_insert(
                    "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s)",
                    ("Recruiter Admin", "admin@company.com", default_password_hash)
                )
                logger.info("Default recruiter seeded: admin@company.com / admin123")
        except Exception as e:
            logger.warning(f"Could not seed default recruiter: {e}")


# Global database accessor
_db = Database()


def get_db() -> Database:
    """Returns singleton database instance."""
    return _db


def init_db():
    """Initializes database connection and creates tables."""
    _db.initialize()
