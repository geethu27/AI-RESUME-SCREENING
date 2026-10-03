import re
from typing import Dict, Any, Tuple, Optional


def validate_job_data(data: Optional[Dict[str, Any]]) -> Tuple[bool, str]:
    """Validates job creation/update payload."""
    if not data or not isinstance(data, dict):
        return False, "Request body must be a JSON object"

    title = data.get("title", "").strip() if isinstance(data.get("title"), str) else ""
    if not title:
        return False, "Job title is required"
    if len(title) < 2 or len(title) > 255:
        return False, "Job title must be between 2 and 255 characters"

    description = data.get("description", "").strip() if isinstance(data.get("description"), str) else ""
    if not description:
        return False, "Job description is required"

    min_exp = data.get("minimum_experience", 0)
    try:
        exp_val = float(min_exp)
        if exp_val < 0 or exp_val > 50:
            return False, "Minimum experience must be between 0 and 50 years"
    except (ValueError, TypeError):
        return False, "Minimum experience must be a valid number"

    return True, ""


def validate_file_upload(file_obj) -> Tuple[bool, str]:
    """Validates uploaded resume file properties."""
    if not file_obj or file_obj.filename == "":
        return False, "No file selected for upload"

    filename = file_obj.filename
    if "." not in filename:
        return False, "File must have an extension (.pdf or .docx)"

    ext = filename.rsplit(".", 1)[-1].lower()
    if ext not in {"pdf", "docx"}:
        return False, f"Invalid file format '.{ext}'. Allowed formats: PDF (.pdf), Word (.docx)"

    return True, ""


def validate_screening_request(job_id: Any) -> Tuple[bool, str, Optional[int]]:
    """Validates job id for screening."""
    try:
        jid = int(job_id)
        if jid <= 0:
            return False, "Job ID must be a positive integer", None
        return True, "", jid
    except (ValueError, TypeError):
        return False, "Invalid job ID provided", None


def validate_auth_credentials(data: Optional[Dict[str, Any]]) -> Tuple[bool, str]:
    """Validates email and password for recruiter authentication."""
    if not data or not isinstance(data, dict):
        return False, "Invalid login credentials provided"

    email = data.get("email", "").strip() if isinstance(data.get("email"), str) else ""
    password = data.get("password", "") if isinstance(data.get("password"), str) else ""

    if not email:
        return False, "Email address is required"

    email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    if not re.match(email_regex, email):
        return False, "Please enter a valid email address"

    if not password:
        return False, "Password is required"

    return True, ""
