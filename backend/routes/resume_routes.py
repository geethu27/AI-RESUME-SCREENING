import os
from flask import Blueprint, request, jsonify
from models.database import get_db
from utils.file_handler import save_uploaded_file, allowed_file
from utils.validators import validate_file_upload
from services.resume_parser import parse_resume
from services.text_preprocessor import clean_and_preprocess
from services.skill_extractor import (
    extract_skills_from_text,
    extract_experience,
    extract_education,
    extract_contact_info
)

resume_bp = Blueprint("resumes", __name__)


def _sync_candidate_skills(db, candidate_id: int, skills: list):
    """Syncs candidate skills to master skills table and candidate_skills mapping."""
    db.execute_query("DELETE FROM candidate_skills WHERE candidate_id = %s", (candidate_id,))

    for s in skills:
        skill_name = s.strip().lower()
        if not skill_name:
            continue
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
                "INSERT INTO candidate_skills (candidate_id, skill_id) VALUES (%s, %s)",
                (candidate_id, skill_id)
            )


@resume_bp.route("/resumes/upload", methods=["POST"])
def upload_resumes():
    """
    Upload one or multiple resumes (.pdf or .docx).
    Completely rule-based extraction:
    - PyPDF2 / python-docx text extraction
    - Text cleaning & preprocessing
    - Keyword skill extraction
    - Regex experience & education extraction
    - Regex contact info extraction
    """
    if "resumes" not in request.files and "files" not in request.files and "file" not in request.files:
        return jsonify({
            "success": False,
            "message": "No file part in request. Please upload files with the 'resumes' key."
        }), 400

    uploaded_files = request.files.getlist("resumes")
    if not uploaded_files:
        uploaded_files = request.files.getlist("files")
    if not uploaded_files and "file" in request.files:
        uploaded_files = [request.files["file"]]

    if not uploaded_files or (len(uploaded_files) == 1 and uploaded_files[0].filename == ""):
        return jsonify({
            "success": False,
            "message": "No resume files selected for upload."
        }), 400

    db = get_db()
    processed_candidates = []
    errors = []

    for file_obj in uploaded_files:
        filename = file_obj.filename
        if not filename:
            continue

        # File validation
        is_valid, err_msg = validate_file_upload(file_obj)
        if not is_valid:
            errors.append({"filename": filename, "error": err_msg})
            continue

        # Save file safely
        success, saved_path, orig_name, save_err = save_uploaded_file(file_obj)
        if not success:
            errors.append({"filename": orig_name, "error": save_err})
            continue

        # Parse text from resume (PDF/DOCX)
        parse_result = parse_resume(saved_path)
        if not parse_result["success"]:
            errors.append({"filename": orig_name, "error": parse_result["error"]})
            continue

        raw_text = parse_result["text"]
        if not raw_text.strip():
            errors.append({
                "filename": orig_name,
                "error": "The resume text is empty or could not be extracted (scanned/image-only)."
            })
            continue

        # Rule-based text cleaning and preprocessing
        preprocessed_text = clean_and_preprocess(raw_text)

        # Rule-based entity & skill extraction
        contact_info = extract_contact_info(raw_text)
        exp_years = extract_experience(preprocessed_text)
        edu_info = extract_education(preprocessed_text)
        skills = extract_skills_from_text(preprocessed_text)

        cand_name = contact_info.get("name") or orig_name.rsplit(".", 1)[0].replace("_", " ").title()
        cand_email = contact_info.get("email") or ""
        cand_phone = contact_info.get("phone") or ""
        cand_edu = edu_info.get("summary") or "Not specified"

        try:
            # Check if candidate with same email already exists
            candidate_id = None
            if cand_email:
                existing_candidate = db.fetch_one("SELECT id FROM candidates WHERE email = %s", (cand_email,))
                if existing_candidate:
                    candidate_id = existing_candidate["id"]
                    # Update candidate info
                    db.execute_query("""
                        UPDATE candidates
                        SET name = %s, phone = %s, education = %s, experience = %s
                        WHERE id = %s
                    """, (cand_name, cand_phone, cand_edu, exp_years, candidate_id))

            if not candidate_id:
                candidate_id = db.execute_insert("""
                    INSERT INTO candidates (name, email, phone, education, experience)
                    VALUES (%s, %s, %s, %s, %s)
                """, (cand_name, cand_email if cand_email else None, cand_phone, cand_edu, exp_years))

            # Insert resume record
            resume_id = db.execute_insert("""
                INSERT INTO resumes (candidate_id, filename, file_path, extracted_text)
                VALUES (%s, %s, %s, %s)
            """, (candidate_id, orig_name, saved_path, raw_text))

            # Sync skills
            _sync_candidate_skills(db, candidate_id, skills)

            processed_candidates.append({
                "candidate_id": candidate_id,
                "resume_id": resume_id,
                "name": cand_name,
                "email": cand_email,
                "phone": cand_phone,
                "experience": exp_years,
                "education": cand_edu,
                "skills": skills,
                "filename": orig_name
            })

        except Exception as e:
            errors.append({"filename": orig_name, "error": f"Database storage failed: {str(e)}"})

    if not processed_candidates and errors:
        return jsonify({
            "success": False,
            "message": "Failed to process uploaded resumes",
            "errors": errors
        }), 400

    return jsonify({
        "success": True,
        "message": f"Successfully processed {len(processed_candidates)} resume(s)",
        "data": {
            "processed": processed_candidates,
            "errors": errors
        }
    }), 201


@resume_bp.route("/resumes", methods=["GET"])
def get_resumes():
    """Retrieve all uploaded resumes with candidate details."""
    db = get_db()
    try:
        rows = db.fetch_all("""
            SELECT r.id, r.candidate_id, r.filename, r.file_path, r.uploaded_at,
                   c.name as candidate_name, c.email, c.phone, c.experience, c.education
            FROM resumes r
            JOIN candidates c ON r.candidate_id = c.id
            ORDER BY r.id DESC
        """)

        resumes = []
        for r in rows:
            # Get candidate skills
            skills_rows = db.fetch_all("""
                SELECT s.skill_name
                FROM candidate_skills cs
                JOIN skills s ON cs.skill_id = s.id
                WHERE cs.candidate_id = %s
            """, (r["candidate_id"],))
            skills = [s["skill_name"] for s in skills_rows]

            resumes.append({
                "id": r["id"],
                "candidate_id": r["candidate_id"],
                "filename": r["filename"],
                "uploaded_at": str(r["uploaded_at"]) if r.get("uploaded_at") else "",
                "candidate_name": r["candidate_name"],
                "email": r["email"] or "Not provided",
                "phone": r["phone"] or "Not provided",
                "experience": r["experience"],
                "education": r["education"] or "Not specified",
                "skills": skills
            })

        return jsonify({
            "success": True,
            "message": "Resumes retrieved successfully",
            "data": resumes
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to retrieve resumes: {str(e)}"
        }), 500


@resume_bp.route("/resumes/<int:resume_id>", methods=["GET"])
def get_resume(resume_id: int):
    """Retrieve full resume details and extracted text."""
    db = get_db()
    try:
        r = db.fetch_one("""
            SELECT r.id, r.candidate_id, r.filename, r.file_path, r.extracted_text, r.uploaded_at,
                   c.name as candidate_name, c.email, c.phone, c.experience, c.education
            FROM resumes r
            JOIN candidates c ON r.candidate_id = c.id
            WHERE r.id = %s
        """, (resume_id,))

        if not r:
            return jsonify({
                "success": False,
                "message": f"Resume with ID {resume_id} not found"
            }), 404

        skills_rows = db.fetch_all("""
            SELECT s.skill_name
            FROM candidate_skills cs
            JOIN skills s ON cs.skill_id = s.id
            WHERE cs.candidate_id = %s
        """, (r["candidate_id"],))

        return jsonify({
            "success": True,
            "message": "Resume retrieved successfully",
            "data": {
                "id": r["id"],
                "candidate_id": r["candidate_id"],
                "filename": r["filename"],
                "extracted_text": r["extracted_text"],
                "uploaded_at": str(r["uploaded_at"]) if r.get("uploaded_at") else "",
                "candidate_name": r["candidate_name"],
                "email": r["email"],
                "phone": r["phone"],
                "experience": r["experience"],
                "education": r["education"],
                "skills": [s["skill_name"] for s in skills_rows]
            }
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to retrieve resume: {str(e)}"
        }), 500
