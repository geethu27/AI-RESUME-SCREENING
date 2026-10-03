-- Resume Screening System MySQL Schema
-- Rule-Based and Deterministic (No AI/ML)
-- Database: resume_screening

CREATE DATABASE IF NOT EXISTS resume_screening
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE resume_screening;

-- 1. Users table (Recruiter authentication)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    minimum_experience FLOAT DEFAULT 0,
    education VARCHAR(255) DEFAULT 'Not specified',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Skills master table
CREATE TABLE IF NOT EXISTS skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    skill_name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 4. Job skills mapping table
CREATE TABLE IF NOT EXISTS job_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    skill_id INT NOT NULL,
    skill_type ENUM('required', 'preferred') NOT NULL DEFAULT 'required',
    CONSTRAINT fk_job_skills_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    CONSTRAINT fk_job_skills_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Candidates table
CREATE TABLE IF NOT EXISTS candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(191) DEFAULT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    education VARCHAR(255) DEFAULT NULL,
    experience FLOAT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 6. Resumes table
CREATE TABLE IF NOT EXISTS resumes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    extracted_text MEDIUMTEXT DEFAULT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resumes_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Candidate skills mapping table
CREATE TABLE IF NOT EXISTS candidate_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    skill_id INT NOT NULL,
    CONSTRAINT fk_cand_skills_cand FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    CONSTRAINT fk_cand_skills_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Screening results table
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
    CONSTRAINT fk_screening_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    CONSTRAINT fk_screening_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Default sample recruiter user (password: admin123)
-- PBKDF2 hash for 'admin123' generated with Werkzeug security
INSERT IGNORE INTO users (id, name, email, password_hash)
VALUES (1, 'Recruiter Admin', 'admin@company.com', 'scrypt:32768:8:1$hB87YhA06UeXz6k1$8004fcfd3ff69bb40624067a9cf60a7e025ec1394c8e762c95d8fe42b78a0ef93c9d784aee6705ec767e76e5df489cf8b1935eecad0d27038ea822855146c91a');
