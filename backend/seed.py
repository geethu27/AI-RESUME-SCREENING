"""
Database Seeding Script for Resume Screening System
Populates default jobs and sample screened candidates.
"""

import os
import sys

# Ensure backend root is on python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models.database import get_db, init_db
from services.skill_extractor import extract_job_skills
from services.matching_engine import match_resume_with_job
from services.scoring_engine import calculate_matching_score
import json


def seed_database():
    init_db()
    db = get_db()
    print(f"[*] Initializing database seeding (Target DB: {db.check_connection()['database_type']})...")

    # 1. Seed Sample Job (Section 16 from Specification)
    existing_job = db.fetch_one("SELECT id FROM jobs WHERE title = %s", ("Python Full Stack Developer",))
    if not existing_job:
        job_id = db.execute_insert("""
            INSERT INTO jobs (title, description, minimum_experience, education)
            VALUES (%s, %s, %s, %s)
        """, (
            "Python Full Stack Developer",
            "Looking for an experienced Python developer with React and MySQL skills to build scalable web platforms.",
            1.0,
            "B.Tech / B.E / MCA"
        ))
        print(f"[+] Created Job: 'Python Full Stack Developer' (ID: {job_id})")

        # Job skills
        req_skills = ["python", "flask", "react", "mysql"]
        pref_skills = ["git", "docker", "rest api"]

        for s in req_skills:
            ex_s = db.fetch_one("SELECT id FROM skills WHERE skill_name = %s", (s,))
            s_id = ex_s["id"] if ex_s else db.execute_insert("INSERT INTO skills (skill_name) VALUES (%s)", (s,))
            db.execute_insert("INSERT INTO job_skills (job_id, skill_id, skill_type) VALUES (%s, %s, 'required')", (job_id, s_id))

        for s in pref_skills:
            ex_s = db.fetch_one("SELECT id FROM skills WHERE skill_name = %s", (s,))
            s_id = ex_s["id"] if ex_s else db.execute_insert("INSERT INTO skills (skill_name) VALUES (%s)", (s,))
            db.execute_insert("INSERT INTO job_skills (job_id, skill_id, skill_type) VALUES (%s, %s, 'preferred')", (job_id, s_id))
    else:
        job_id = existing_job["id"]

    # 2. Seed Sample Candidates
    sample_candidates = [
        {
            "name": "Jane Doe",
            "email": "jane.doe@example.com",
            "phone": "+91 9876543210",
            "education": "B.Tech in Computer Science Engineering",
            "experience": 2.0,
            "skills": ["python", "flask", "mysql", "git", "rest api", "html", "css", "javascript"],
            "filename": "jane_doe_python_developer.docx",
            "text": "Jane Doe\njane.doe@example.com | +91 9876543210\nB.Tech in Computer Science Engineering\nPython developer with 2+ years of experience in Flask and MySQL. Worked with Git."
        },
        {
            "name": "Rajesh Kumar",
            "email": "rajesh.kumar@example.com",
            "phone": "+91 9812345678",
            "education": "MCA in Computer Science",
            "experience": 4.0,
            "skills": ["python", "flask", "react", "mysql", "git", "docker", "rest api", "linux"],
            "filename": "rajesh_kumar_senior_fullstack.docx",
            "text": "Rajesh Kumar\nrajesh.kumar@example.com | +91 9812345678\nMCA in Computer Science\nFull Stack Software Engineer with 4 years of experience in Python, Flask, React, MySQL, Git and Docker."
        },
        {
            "name": "Priya Sharma",
            "email": "priya.sharma@example.com",
            "phone": "+91 9123456789",
            "education": "B.Sc in Information Technology",
            "experience": 0.5,
            "skills": ["react", "javascript", "html", "css", "git"],
            "filename": "priya_sharma_junior_developer.docx",
            "text": "Priya Sharma\npriya.sharma@example.com | +91 9123456789\nB.Sc in Information Technology\nJunior Frontend Developer with 0.5 years experience in React, HTML, CSS, JavaScript."
        },
        {
            "name": "Amit Patel",
            "email": "amit.patel@example.com",
            "phone": "+91 9012345678",
            "education": "Diploma in Mechanical Engineering",
            "experience": 1.0,
            "skills": [],
            "filename": "amit_patel_mechanical.docx",
            "text": "Amit Patel\namit.patel@example.com | +91 9012345678\nDiploma in Mechanical Engineering\nCAD technician with 1 year experience in industrial plant maintenance."
        }
    ]

    for cand in sample_candidates:
        c_exist = db.fetch_one("SELECT id FROM candidates WHERE email = %s", (cand["email"],))
        if not c_exist:
            c_id = db.execute_insert("""
                INSERT INTO candidates (name, email, phone, education, experience)
                VALUES (%s, %s, %s, %s, %s)
            """, (cand["name"], cand["email"], cand["phone"], cand["education"], cand["experience"]))

            db.execute_insert("""
                INSERT INTO resumes (candidate_id, filename, file_path, extracted_text)
                VALUES (%s, %s, %s, %s)
            """, (c_id, cand["filename"], f"uploads/{cand['filename']}", cand["text"]))

            for s in cand["skills"]:
                ex_s = db.fetch_one("SELECT id FROM skills WHERE skill_name = %s", (s,))
                s_id = ex_s["id"] if ex_s else db.execute_insert("INSERT INTO skills (skill_name) VALUES (%s)", (s,))
                db.execute_insert("INSERT INTO candidate_skills (candidate_id, skill_id) VALUES (%s, %s)", (c_id, s_id))

            print(f"[+] Seeded Candidate: {cand['name']}")
        else:
            c_id = c_exist["id"]

        # Run screening against job 1
        req_skills = ["python", "flask", "react", "mysql"]
        pref_skills = ["git", "docker", "rest api"]
        match_res = match_resume_with_job(req_skills, pref_skills, cand["skills"])
        score_res = calculate_matching_score(
            matching_result=match_res,
            candidate_experience=cand["experience"],
            required_experience=1.0,
            candidate_education=cand["education"],
            required_education="B.Tech / B.E / MCA"
        )

        existing_sr = db.fetch_one("SELECT id FROM screening_results WHERE job_id = %s AND candidate_id = %s", (job_id, c_id))
        if not existing_sr:
            db.execute_insert("""
                INSERT INTO screening_results
                (job_id, candidate_id, required_score, preferred_score, experience_score,
                 education_score, total_score, matched_skills, missing_skills, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                job_id, c_id,
                score_res["required_score"], score_res["preferred_score"],
                score_res["experience_score"], score_res["education_score"],
                score_res["total_score"],
                json.dumps(match_res["all_matched_skills"]),
                json.dumps(match_res["all_missing_skills"]),
                score_res["status"]
            ))

    print("[*] Database seeding completed successfully!")


if __name__ == "__main__":
    seed_database()
