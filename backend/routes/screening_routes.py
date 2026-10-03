import json
from flask import Blueprint, request, jsonify
from models.database import get_db
from utils.validators import validate_screening_request
from services.matching_engine import match_resume_with_job
from services.scoring_engine import calculate_matching_score
from services.ranking_engine import rank_candidates

screening_bp = Blueprint("screening", __name__)


def _get_job_requirements(db, job_id: int):
    """Fetches job metadata and its required and preferred skills."""
    job = db.fetch_one("SELECT * FROM jobs WHERE id = %s", (job_id,))
    if not job:
        return None

    skill_rows = db.fetch_all("""
        SELECT s.skill_name, js.skill_type
        FROM job_skills js
        JOIN skills s ON js.skill_id = s.id
        WHERE js.job_id = %s
    """, (job_id,))

    required_skills = [s["skill_name"] for s in skill_rows if s["skill_type"] == "required"]
    preferred_skills = [s["skill_name"] for s in skill_rows if s["skill_type"] == "preferred"]

    return {
        "id": job["id"],
        "title": job["title"],
        "description": job["description"],
        "minimum_experience": float(job["minimum_experience"] or 0.0),
        "education": job["education"] or "Not specified",
        "required_skills": required_skills,
        "preferred_skills": preferred_skills
    }


def _get_candidate_details(db, candidate_id: int):
    """Fetches candidate profile, latest resume, and extracted skills."""
    cand = db.fetch_one("SELECT * FROM candidates WHERE id = %s", (candidate_id,))
    if not cand:
        return None

    skills_rows = db.fetch_all("""
        SELECT s.skill_name
        FROM candidate_skills cs
        JOIN skills s ON cs.skill_id = s.id
        WHERE cs.candidate_id = %s
    """, (candidate_id,))

    resume = db.fetch_one("""
        SELECT id, filename, extracted_text, uploaded_at
        FROM resumes
        WHERE candidate_id = %s
        ORDER BY id DESC LIMIT 1
    """, (candidate_id,))

    return {
        "id": cand["id"],
        "name": cand["name"],
        "email": cand["email"] or "Not provided",
        "phone": cand["phone"] or "Not provided",
        "education": cand["education"] or "Not specified",
        "experience": float(cand["experience"] or 0.0),
        "skills": [s["skill_name"] for s in skills_rows],
        "resume": resume or {}
    }


@screening_bp.route("/screening/<job_id>", methods=["POST"])
def screen_candidates(job_id):
    """
    Screens candidates against a job description.
    Deterministic, rule-based matching and scoring algorithm (NO AI/ML).
    """
    is_valid, err_msg, jid = validate_screening_request(job_id)
    if not is_valid:
        return jsonify({"success": False, "message": err_msg}), 400

    db = get_db()
    try:
        job = _get_job_requirements(db, jid)
        if not job:
            return jsonify({
                "success": False,
                "message": f"Job with ID {jid} not found."
            }), 404

        # Read optional query params for custom thresholds
        data = request.get_json(silent=True) or {}
        shortlist_cut = float(data.get("shortlist_threshold", 80.0))
        review_cut = float(data.get("review_threshold", 60.0))

        # Fetch all candidates
        candidates = db.fetch_all("SELECT id FROM candidates ORDER BY id ASC")
        if not candidates:
            return jsonify({
                "success": False,
                "message": "No candidates available for screening. Please upload resumes first."
            }), 400

        screened_list = []

        for c_row in candidates:
            cand_id = c_row["id"]
            cand_info = _get_candidate_details(db, cand_id)
            if not cand_info:
                continue

            # 1. Rule-based skill matching
            match_res = match_resume_with_job(
                job_required_skills=job["required_skills"],
                job_preferred_skills=job["preferred_skills"],
                candidate_skills=cand_info["skills"]
            )

            # 2. Rule-based scoring
            score_res = calculate_matching_score(
                matching_result=match_res,
                candidate_experience=cand_info["experience"],
                required_experience=job["minimum_experience"],
                candidate_education=cand_info["education"],
                required_education=job["education"],
                shortlist_threshold=shortlist_cut,
                review_threshold=review_cut
            )

            matched_skills_json = json.dumps(match_res["all_matched_skills"])
            missing_skills_json = json.dumps(match_res["all_missing_skills"])

            # 3. Store or update result in screening_results table
            existing_result = db.fetch_one(
                "SELECT id FROM screening_results WHERE job_id = %s AND candidate_id = %s",
                (jid, cand_id)
            )

            if existing_result:
                db.execute_query("""
                    UPDATE screening_results
                    SET required_score = %s, preferred_score = %s, experience_score = %s,
                        education_score = %s, total_score = %s, matched_skills = %s,
                        missing_skills = %s, status = %s, screened_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (
                    score_res["required_score"], score_res["preferred_score"],
                    score_res["experience_score"], score_res["education_score"],
                    score_res["total_score"], matched_skills_json, missing_skills_json,
                    score_res["status"], existing_result["id"]
                ))
                result_id = existing_result["id"]
            else:
                result_id = db.execute_insert("""
                    INSERT INTO screening_results
                    (job_id, candidate_id, required_score, preferred_score, experience_score,
                     education_score, total_score, matched_skills, missing_skills, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    jid, cand_id,
                    score_res["required_score"], score_res["preferred_score"],
                    score_res["experience_score"], score_res["education_score"],
                    score_res["total_score"], matched_skills_json, missing_skills_json,
                    score_res["status"]
                ))

            screened_list.append({
                "id": result_id,
                "job_id": jid,
                "candidate_id": cand_id,
                "candidate_name": cand_info["name"],
                "email": cand_info["email"],
                "phone": cand_info["phone"],
                "experience": cand_info["experience"],
                "education": cand_info["education"],
                "required_score": score_res["required_score"],
                "preferred_score": score_res["preferred_score"],
                "experience_score": score_res["experience_score"],
                "education_score": score_res["education_score"],
                "total_score": score_res["total_score"],
                "matched_skills": match_res["all_matched_skills"],
                "missing_skills": match_res["all_missing_skills"],
                "matched_required": match_res["matched_required_skills"],
                "missing_required": match_res["missing_required_skills"],
                "matched_preferred": match_res["matched_preferred_skills"],
                "missing_preferred": match_res["missing_preferred_skills"],
                "status": score_res["status"]
            })

        # Rank candidates by total_score descending
        ranked_results = rank_candidates(screened_list, sort_by="score", ascending=False)

        return jsonify({
            "success": True,
            "message": f"Successfully screened and ranked {len(ranked_results)} candidate(s)",
            "data": {
                "job": job,
                "results": ranked_results
            }
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Screening process failed: {str(e)}"
        }), 500


@screening_bp.route("/screening/<job_id>", methods=["GET"])
def get_screening_results(job_id):
    """
    Get screening results for a job, ranked and optionally filtered.
    Query params:
      - sort_by: score (default) | name | experience
      - order: desc (default) | asc
      - status: all (default) | Shortlisted | Review | Not Shortlisted
    """
    is_valid, err_msg, jid = validate_screening_request(job_id)
    if not is_valid:
        return jsonify({"success": False, "message": err_msg}), 400

    db = get_db()
    try:
        job = _get_job_requirements(db, jid)
        if not job:
            return jsonify({"success": False, "message": f"Job with ID {jid} not found."}), 404

        sort_by = request.args.get("sort_by", "score").lower()
        order = request.args.get("order", "desc").lower()
        status_filter = request.args.get("status", "all")
        ascending = (order == "asc")

        rows = db.fetch_all("""
            SELECT sr.*, c.name as candidate_name, c.email, c.phone, c.experience, c.education
            FROM screening_results sr
            JOIN candidates c ON sr.candidate_id = c.id
            WHERE sr.job_id = %s
        """, (jid,))

        results = []
        for r in rows:
            matched = []
            missing = []
            try:
                matched = json.loads(r["matched_skills"]) if r.get("matched_skills") else []
            except Exception:
                matched = [s.strip() for s in str(r.get("matched_skills", "")).split(",") if s.strip()]

            try:
                missing = json.loads(r["missing_skills"]) if r.get("missing_skills") else []
            except Exception:
                missing = [s.strip() for s in str(r.get("missing_skills", "")).split(",") if s.strip()]

            results.append({
                "id": r["id"],
                "job_id": r["job_id"],
                "candidate_id": r["candidate_id"],
                "candidate_name": r["candidate_name"],
                "email": r["email"] or "Not provided",
                "phone": r["phone"] or "Not provided",
                "experience": r["experience"],
                "education": r["education"] or "Not specified",
                "required_score": r["required_score"],
                "preferred_score": r["preferred_score"],
                "experience_score": r["experience_score"],
                "education_score": r["education_score"],
                "total_score": r["total_score"],
                "matched_skills": matched,
                "missing_skills": missing,
                "status": r["status"],
                "screened_at": str(r["screened_at"]) if r.get("screened_at") else ""
            })

        # Rank and filter deterministically
        ranked = rank_candidates(results, sort_by=sort_by, ascending=ascending, status_filter=status_filter)

        return jsonify({
            "success": True,
            "message": "Screening results retrieved successfully",
            "data": {
                "job": job,
                "results": ranked,
                "total_screened": len(ranked)
            }
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to retrieve screening results: {str(e)}"
        }), 500


@screening_bp.route("/screening/<job_id>/candidate/<candidate_id>", methods=["GET"])
def get_candidate_screening_detail(job_id, candidate_id):
    """
    Get detailed screening evaluation report for a candidate on a job.
    Includes full score breakdown, matched/missing skills, candidate profile, and resume text.
    """
    try:
        jid = int(job_id)
        cid = int(candidate_id)
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "Invalid job or candidate ID"}), 400

    db = get_db()
    try:
        job = _get_job_requirements(db, jid)
        if not job:
            return jsonify({"success": False, "message": "Job not found"}), 404

        cand_info = _get_candidate_details(db, cid)
        if not cand_info:
            return jsonify({"success": False, "message": "Candidate not found"}), 404

        # Screening result from database or calculate fresh
        sr = db.fetch_one("""
            SELECT * FROM screening_results
            WHERE job_id = %s AND candidate_id = %s
        """, (jid, cid))

        # Calculate live breakdown
        match_res = match_resume_with_job(
            job_required_skills=job["required_skills"],
            job_preferred_skills=job["preferred_skills"],
            candidate_skills=cand_info["skills"]
        )

        score_res = calculate_matching_score(
            matching_result=match_res,
            candidate_experience=cand_info["experience"],
            required_experience=job["minimum_experience"],
            candidate_education=cand_info["education"],
            required_education=job["education"]
        )

        detail = {
            "job": job,
            "candidate": {
                "id": cand_info["id"],
                "name": cand_info["name"],
                "email": cand_info["email"],
                "phone": cand_info["phone"],
                "experience": cand_info["experience"],
                "education": cand_info["education"],
                "skills": cand_info["skills"],
                "resume_text": cand_info["resume"].get("extracted_text", ""),
                "resume_filename": cand_info["resume"].get("filename", "")
            },
            "matching": match_res,
            "scoring": score_res,
            "status": sr["status"] if sr else score_res["status"],
            "screened_at": str(sr["screened_at"]) if sr and sr.get("screened_at") else "Just now"
        }

        return jsonify({
            "success": True,
            "message": "Candidate screening detail retrieved successfully",
            "data": detail
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to retrieve screening detail: {str(e)}"
        }), 500
