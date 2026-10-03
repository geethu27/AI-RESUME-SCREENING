import json
from flask import Blueprint, request, jsonify
from models.database import get_db
from utils.validators import validate_job_data
from services.skill_extractor import extract_job_skills

job_bp = Blueprint("jobs", __name__)


def _sync_job_skills(db, job_id: int, required_skills: list, preferred_skills: list):
    """Syncs skills into skills table and job_skills table."""
    # Remove existing skills for this job
    db.execute_query("DELETE FROM job_skills WHERE job_id = %s", (job_id,))

    def insert_skill_type(skill_list, skill_type):
        for s in skill_list:
            skill_name = s.strip().lower()
            if not skill_name:
                continue
            # Ensure skill exists in master skills table
            existing = db.fetch_one("SELECT id FROM skills WHERE skill_name = %s", (skill_name,))
            if existing:
                skill_id = existing["id"]
            else:
                try:
                    skill_id = db.execute_insert("INSERT INTO skills (skill_name) VALUES (%s)", (skill_name,))
                except Exception:
                    existing2 = db.fetch_one("SELECT id FROM skills WHERE skill_name = %s", (skill_name,))
                    skill_id = existing2["id"] if existing2 else None

            if skill_id:
                db.execute_insert(
                    "INSERT INTO job_skills (job_id, skill_id, skill_type) VALUES (%s, %s, %s)",
                    (job_id, skill_id, skill_type)
                )

    insert_skill_type(required_skills, "required")
    insert_skill_type(preferred_skills, "preferred")


def _get_skills_for_job(db, job_id: int):
    """Retrieves required and preferred skills for a specific job."""
    rows = db.fetch_all("""
        SELECT s.skill_name, js.skill_type
        FROM job_skills js
        JOIN skills s ON js.skill_id = s.id
        WHERE js.job_id = %s
    """, (job_id,))

    required = [r["skill_name"] for r in rows if r["skill_type"] == "required"]
    preferred = [r["skill_name"] for r in rows if r["skill_type"] == "preferred"]
    return required, preferred


@job_bp.route("/jobs", methods=["POST"])
def create_job():
    """Create a new job with required and preferred skills."""
    data = request.get_json(silent=True) or {}
    is_valid, err_msg = validate_job_data(data)
    if not is_valid:
        return jsonify({"success": False, "message": err_msg}), 400

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    min_exp = float(data.get("minimum_experience", 0))
    education = data.get("education", "Not specified").strip() or "Not specified"

    # Extract skills
    req_input = data.get("required_skills", "")
    pref_input = data.get("preferred_skills", "")

    if isinstance(req_input, list):
        req_str = ", ".join(req_input)
    else:
        req_str = str(req_input or "")

    if isinstance(pref_input, list):
        pref_str = ", ".join(pref_input)
    else:
        pref_str = str(pref_input or "")

    extracted = extract_job_skills(req_str, pref_str, description)
    required_skills = extracted["required_skills"]
    preferred_skills = extracted["preferred_skills"]

    db = get_db()
    try:
        job_id = db.execute_insert("""
            INSERT INTO jobs (title, description, minimum_experience, education)
            VALUES (%s, %s, %s, %s)
        """, (title, description, min_exp, education))

        _sync_job_skills(db, job_id, required_skills, preferred_skills)

        created_job = {
            "id": job_id,
            "title": title,
            "description": description,
            "minimum_experience": min_exp,
            "education": education,
            "required_skills": required_skills,
            "preferred_skills": preferred_skills
        }

        return jsonify({
            "success": True,
            "message": "Job created successfully",
            "data": created_job
        }), 201

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Unable to create job: {str(e)}"
        }), 500


@job_bp.route("/jobs", methods=["GET"])
def get_jobs():
    """Get all jobs with their skills and candidate counts."""
    db = get_db()
    try:
        jobs = db.fetch_all("SELECT * FROM jobs ORDER BY id DESC")
        result = []
        for j in jobs:
            req_skills, pref_skills = _get_skills_for_job(db, j["id"])
            # Count screening results for this job
            screened_count = db.fetch_one(
                "SELECT COUNT(*) as count FROM screening_results WHERE job_id = %s",
                (j["id"],)
            )
            result.append({
                "id": j["id"],
                "title": j["title"],
                "description": j["description"],
                "minimum_experience": j["minimum_experience"],
                "education": j["education"],
                "created_at": str(j["created_at"]) if j.get("created_at") else "",
                "required_skills": req_skills,
                "preferred_skills": pref_skills,
                "screened_count": screened_count["count"] if screened_count else 0
            })

        return jsonify({
            "success": True,
            "message": "Jobs retrieved successfully",
            "data": result
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to retrieve jobs: {str(e)}"
        }), 500


@job_bp.route("/jobs/<int:job_id>", methods=["GET"])
def get_job(job_id: int):
    """Get a single job by ID."""
    db = get_db()
    try:
        job = db.fetch_one("SELECT * FROM jobs WHERE id = %s", (job_id,))
        if not job:
            return jsonify({
                "success": False,
                "message": f"Job with ID {job_id} not found"
            }), 404

        req_skills, pref_skills = _get_skills_for_job(db, job_id)
        job_data = {
            "id": job["id"],
            "title": job["title"],
            "description": job["description"],
            "minimum_experience": job["minimum_experience"],
            "education": job["education"],
            "created_at": str(job["created_at"]) if job.get("created_at") else "",
            "required_skills": req_skills,
            "preferred_skills": pref_skills
        }

        return jsonify({
            "success": True,
            "message": "Job retrieved successfully",
            "data": job_data
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to retrieve job: {str(e)}"
        }), 500


@job_bp.route("/jobs/<int:job_id>", methods=["PUT"])
def update_job(job_id: int):
    """Update job details and skills."""
    db = get_db()
    try:
        existing = db.fetch_one("SELECT id FROM jobs WHERE id = %s", (job_id,))
        if not existing:
            return jsonify({
                "success": False,
                "message": f"Job with ID {job_id} not found"
            }), 404

        data = request.get_json(silent=True) or {}
        is_valid, err_msg = validate_job_data(data)
        if not is_valid:
            return jsonify({"success": False, "message": err_msg}), 400

        title = data.get("title", "").strip()
        description = data.get("description", "").strip()
        min_exp = float(data.get("minimum_experience", 0))
        education = data.get("education", "Not specified").strip() or "Not specified"

        req_input = data.get("required_skills", "")
        pref_input = data.get("preferred_skills", "")
        req_str = ", ".join(req_input) if isinstance(req_input, list) else str(req_input or "")
        pref_str = ", ".join(pref_input) if isinstance(pref_input, list) else str(pref_input or "")

        extracted = extract_job_skills(req_str, pref_str, description)
        required_skills = extracted["required_skills"]
        preferred_skills = extracted["preferred_skills"]

        db.execute_query("""
            UPDATE jobs
            SET title = %s, description = %s, minimum_experience = %s, education = %s
            WHERE id = %s
        """, (title, description, min_exp, education, job_id))

        _sync_job_skills(db, job_id, required_skills, preferred_skills)

        return jsonify({
            "success": True,
            "message": "Job updated successfully",
            "data": {
                "id": job_id,
                "title": title,
                "description": description,
                "minimum_experience": min_exp,
                "education": education,
                "required_skills": required_skills,
                "preferred_skills": preferred_skills
            }
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to update job: {str(e)}"
        }), 500


@job_bp.route("/jobs/<int:job_id>", methods=["DELETE"])
def delete_job(job_id: int):
    """Delete a job and its associated data."""
    db = get_db()
    try:
        existing = db.fetch_one("SELECT id FROM jobs WHERE id = %s", (job_id,))
        if not existing:
            return jsonify({
                "success": False,
                "message": f"Job with ID {job_id} not found"
            }), 404

        db.execute_query("DELETE FROM jobs WHERE id = %s", (job_id,))

        return jsonify({
            "success": True,
            "message": "Job deleted successfully",
            "data": {"id": job_id}
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to delete job: {str(e)}"
        }), 500
