import os
import sys
import unittest
import io
import docx
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from services.resume_parser import parse_resume
from services.scoring_engine import calculate_matching_score
from services.matching_engine import match_resume_with_job


class TestUnhappyPaths(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    def test_unhappy_path_empty_resume(self):
        """Unhappy path: Uploading a 0-byte or empty content file."""
        # Empty byte stream
        empty_io = io.BytesIO(b"")
        res = self.client.post(
            "/api/resumes/upload",
            data={"resumes": (empty_io, "empty_file.docx")},
            content_type="multipart/form-data"
        )
        self.assertEqual(res.status_code, 400)
        self.assertFalse(res.get_json()["success"])

    def test_unhappy_path_invalid_file_extension(self):
        """Unhappy path: Uploading an unsupported file format (.exe, .txt)."""
        bad_io = io.BytesIO(b"Plain text content")
        res = self.client.post(
            "/api/resumes/upload",
            data={"resumes": (bad_io, "malicious.exe")},
            content_type="multipart/form-data"
        )
        self.assertEqual(res.status_code, 400)
        self.assertFalse(res.get_json()["success"])

    def test_unhappy_path_resume_with_no_matching_skills(self):
        """Unhappy path: Candidate with zero required or preferred skills matches."""
        req_skills = ["kubernetes", "golang", "terraform"]
        pref_skills = ["rust"]
        cand_skills = ["cooking", "painting", "gardening"]  # completely unrelated

        match_res = match_resume_with_job(req_skills, pref_skills, cand_skills)
        self.assertEqual(match_res["matched_required_count"], 0)
        self.assertEqual(match_res["matched_preferred_count"], 0)
        self.assertEqual(len(match_res["all_matched_skills"]), 0)

        score_res = calculate_matching_score(
            matching_result=match_res,
            candidate_experience=0.0,
            required_experience=5.0,
            candidate_education="High School",
            required_education="B.Tech"
        )
        self.assertEqual(score_res["required_score"], 0.0)
        self.assertEqual(score_res["preferred_score"], 0.0)
        self.assertEqual(score_res["experience_score"], 0.0)
        self.assertEqual(score_res["education_score"], 0.0)
        self.assertEqual(score_res["total_score"], 0.0)
        self.assertEqual(score_res["status"], "Not Shortlisted")

    def test_unhappy_path_missing_job(self):
        """Unhappy path: Screening against a non-existent job ID."""
        non_existent_id = 999999
        res = self.client.post(f"/api/screening/{non_existent_id}")
        self.assertEqual(res.status_code, 404)
        self.assertFalse(res.get_json()["success"])

        get_res = self.client.get(f"/api/screening/{non_existent_id}")
        self.assertEqual(get_res.status_code, 404)
        self.assertFalse(get_res.get_json()["success"])

    def test_unhappy_path_corrupted_file(self):
        """Unhappy path: Parsing a corrupted file that claims to be docx/pdf."""
        corrupted_io = io.BytesIO(b"Not a real docx or pdf binary format")
        res = self.client.post(
            "/api/resumes/upload",
            data={"resumes": (corrupted_io, "corrupted.docx")},
            content_type="multipart/form-data"
        )
        self.assertEqual(res.status_code, 400)
        self.assertFalse(res.get_json()["success"])

    def test_unhappy_path_invalid_job_creation(self):
        """Unhappy path: Attempting to create job with empty title or invalid experience."""
        res = self.client.post("/api/jobs", json={
            "title": "",
            "description": "Some description",
            "minimum_experience": -5
        })
        self.assertEqual(res.status_code, 400)
        self.assertFalse(res.get_json()["success"])


if __name__ == "__main__":
    unittest.main()
