from flask import Blueprint, jsonify
from models.database import get_db

candidate_bp = Blueprint("candidates", __name__)


@candidate_bp.route("/candidates", methods=["GET"])
def get_candidates():
    """Retrieve all candidates with skills and resume details."""
    db = get_db()
    try:
        candidates = db.fetch_all("SELECT * FROM candidates ORDER BY id DESC")
        result = []

        for c in candidates:
            skills_rows = db.fetch_all("""
                SELECT s.skill_name
                FROM candidate_skills cs
                JOIN skills s ON cs.skill_id = s.id
                WHERE cs.candidate_id = %s
            """, (c["id"],))
            skills = [s["skill_name"] for s in skills_rows]

            # Get resume count
            resumes_count = db.fetch_one(
                "SELECT COUNT(*) as count FROM resumes WHERE candidate_id = %s",
                (c["id"],)
            )

            # Get latest screening result if any
            latest_screen = db.fetch_one("""
                SELECT sr.status, sr.total_score, j.title as job_title
                FROM screening_results sr
                JOIN jobs j ON sr.job_id = j.id
                WHERE sr.candidate_id = %s
                ORDER BY sr.id DESC LIMIT 1
            """, (c["id"],))

            result.append({
                "id": c["id"],
                "name": c["name"],
                "email": c["email"] or "Not provided",
                "phone": c["phone"] or "Not provided",
                "education": c["education"] or "Not specified",
                "experience": float(c["experience"] or 0.0),
                "created_at": str(c["created_at"]) if c.get("created_at") else "",
                "skills": skills,
                "resumes_count": resumes_count["count"] if resumes_count else 0,
                "latest_status": latest_screen["status"] if latest_screen else "Not Screened",
                "latest_score": latest_screen["total_score"] if latest_screen else None,
                "latest_job": latest_screen["job_title"] if latest_screen else None
            })

        return jsonify({
            "success": True,
            "message": "Candidates retrieved successfully",
            "data": result
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to retrieve candidates: {str(e)}"
        }), 500


@candidate_bp.route("/candidates/<int:candidate_id>", methods=["GET"])
def get_candidate(candidate_id: int):
    """Retrieve single candidate profile, resumes, and screening history."""
    db = get_db()
    try:
        cand = db.fetch_one("SELECT * FROM candidates WHERE id = %s", (candidate_id,))
        if not cand:
            return jsonify({
                "success": False,
                "message": f"Candidate with ID {candidate_id} not found"
            }), 404

        skills_rows = db.fetch_all("""
            SELECT s.skill_name
            FROM candidate_skills cs
            JOIN skills s ON cs.skill_id = s.id
            WHERE cs.candidate_id = %s
        """, (candidate_id,))

        resumes = db.fetch_all("""
            SELECT id, filename, file_path, extracted_text, uploaded_at
            FROM resumes
            WHERE candidate_id = %s
            ORDER BY id DESC
        """, (candidate_id,))

        screenings = db.fetch_all("""
            SELECT sr.*, j.title as job_title
            FROM screening_results sr
            JOIN jobs j ON sr.job_id = j.id
            WHERE sr.candidate_id = %s
            ORDER BY sr.id DESC
        """, (candidate_id,))

        return jsonify({
            "success": True,
            "message": "Candidate details retrieved successfully",
            "data": {
                "id": cand["id"],
                "name": cand["name"],
                "email": cand["email"] or "Not provided",
                "phone": cand["phone"] or "Not provided",
                "education": cand["education"] or "Not specified",
                "experience": float(cand["experience"] or 0.0),
                "created_at": str(cand["created_at"]) if cand.get("created_at") else "",
                "skills": [s["skill_name"] for s in skills_rows],
                "resumes": [
                    {
                        "id": r["id"],
                        "filename": r["filename"],
                        "uploaded_at": str(r["uploaded_at"]) if r.get("uploaded_at") else "",
                        "extracted_text": r["extracted_text"]
                    } for r in resumes
                ],
                "screenings": [
                    {
                        "id": s["id"],
                        "job_id": s["job_id"],
                        "job_title": s["job_title"],
                        "total_score": s["total_score"],
                        "status": s["status"],
                        "screened_at": str(s["screened_at"]) if s.get("screened_at") else ""
                    } for s in screenings
                ]
            }
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to retrieve candidate: {str(e)}"
        }), 500
