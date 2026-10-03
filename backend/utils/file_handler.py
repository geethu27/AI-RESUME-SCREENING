import os
import uuid
from typing import Tuple
from werkzeug.utils import secure_filename
from config import Config


def allowed_file(filename: str) -> bool:
    """Checks whether file has an allowed extension (.pdf or .docx)."""
    return "." in filename and filename.rsplit(".", 1)[-1].lower() in Config.ALLOWED_EXTENSIONS


def save_uploaded_file(file_obj) -> Tuple[bool, str, str, str]:
    """
    Saves an uploaded resume securely.
    
    Returns:
        (success, saved_file_path, original_filename, error_message)
    """
    if not file_obj or file_obj.filename == "":
        return False, "", "", "No file selected"

    orig_name = file_obj.filename
    if not allowed_file(orig_name):
        return False, "", orig_name, "Unsupported file format. Only .pdf and .docx are supported."

    # Sanitize filename
    clean_base = secure_filename(orig_name)
    if not clean_base:
        clean_base = "resume_file"

    # Generate a unique prefix to avoid filename collisions
    unique_id = uuid.uuid4().hex[:10]
    saved_filename = f"{unique_id}_{clean_base}"
    save_path = os.path.join(Config.UPLOAD_FOLDER, saved_filename)

    try:
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        file_obj.save(save_path)

        # Validate file size is not empty
        file_size = os.path.getsize(save_path)
        if file_size == 0:
            if os.path.exists(save_path):
                os.remove(save_path)
            return False, "", orig_name, "The uploaded file is empty (0 bytes)."

        if file_size > Config.MAX_CONTENT_LENGTH:
            if os.path.exists(save_path):
                os.remove(save_path)
            return False, "", orig_name, f"File exceeds maximum allowed size ({Config.MAX_CONTENT_LENGTH // (1024*1024)} MB)."

        return True, save_path, orig_name, ""

    except Exception as e:
        if os.path.exists(save_path):
            try:
                os.remove(save_path)
            except Exception:
                pass
        return False, "", orig_name, f"Failed to save file: {str(e)}"


def delete_uploaded_file(file_path: str) -> bool:
    """Safely removes an uploaded file from disk."""
    try:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception:
        return False
