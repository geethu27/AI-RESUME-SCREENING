import re
from typing import Dict, Any, Optional
from config import Config


def _check_education_match(required_edu: str, candidate_edu: str) -> bool:
    """
    Checks whether candidate education satisfies the required education.
    Handles variations like 'B.Tech / B.E / MCA', 'Any', 'Not specified'.
    """
    if not required_edu or required_edu.lower() in ["not specified", "any", "none", "graduation"]:
        return True

    if not candidate_edu or candidate_edu.lower() in ["not specified", "none"]:
        return False

    req_lower = required_edu.lower()
    cand_lower = candidate_edu.lower()

    # Split slash/comma-separated requirements e.g. "B.Tech / B.E / MCA"
    options = [opt.strip() for opt in re.split(r'[/,;|]+', req_lower) if opt.strip()]

    for opt in options:
        # Standardize periods e.g. b.tech -> btech
        opt_clean = opt.replace(".", "")
        cand_clean = cand_lower.replace(".", "")

        if opt in cand_lower or opt_clean in cand_clean:
            return True

    return False


def calculate_matching_score(
    matching_result: Dict[str, Any],
    candidate_experience: float,
    required_experience: float,
    candidate_education: str,
    required_education: str,
    shortlist_threshold: Optional[float] = None,
    review_threshold: Optional[float] = None
) -> Dict[str, Any]:
    """
    Calculates a transparent, deterministic rule-based matching score out of 100 points.
    Formula:
      - Required Skills:   60 points max
      - Preferred Skills:  15 points max
      - Experience:        15 points max
      - Education:         10 points max
      - Total Score:      100 points max

    This is strictly rule-based scoring (NOT AI/ML).
    """
    shortlist_cut = shortlist_threshold if shortlist_threshold is not None else Config.SHORTLISTED_THRESHOLD
    review_cut = review_threshold if review_threshold is not None else Config.REVIEW_THRESHOLD

    # 1. Required Skills Score (60 points)
    total_req = matching_result.get("total_required", 0)
    matched_req_count = matching_result.get("matched_required_count", 0)
    if total_req > 0:
        required_score = (matched_req_count / total_req) * Config.REQUIRED_SKILLS_WEIGHT
    else:
        # If no specific required skills specified, award full weight
        required_score = Config.REQUIRED_SKILLS_WEIGHT

    # 2. Preferred Skills Score (15 points)
    total_pref = matching_result.get("total_preferred", 0)
    matched_pref_count = matching_result.get("matched_preferred_count", 0)
    if total_pref > 0:
        preferred_score = (matched_pref_count / total_pref) * Config.PREFERRED_SKILLS_WEIGHT
    else:
        # If no preferred skills specified, award full weight
        preferred_score = Config.PREFERRED_SKILLS_WEIGHT

    # 3. Experience Score (15 points)
    cand_exp = max(0.0, float(candidate_experience or 0.0))
    req_exp = max(0.0, float(required_experience or 0.0))
    if req_exp <= 0.0 or cand_exp >= req_exp:
        experience_score = Config.EXPERIENCE_WEIGHT
    else:
        # Proportional experience score
        experience_score = (cand_exp / req_exp) * Config.EXPERIENCE_WEIGHT

    # 4. Education Score (10 points)
    edu_matched = _check_education_match(required_education, candidate_education)
    education_score = Config.EDUCATION_WEIGHT if edu_matched else 0.0

    # Total Score
    total_score = round(required_score + preferred_score + experience_score + education_score, 2)

    # Determine Screening Status based on configurable thresholds
    if total_score >= shortlist_cut:
        status = "Shortlisted"
    elif total_score >= review_cut:
        status = "Review"
    else:
        status = "Not Shortlisted"

    return {
        "required_score": round(required_score, 2),
        "preferred_score": round(preferred_score, 2),
        "experience_score": round(experience_score, 2),
        "education_score": round(education_score, 2),
        "total_score": total_score,
        "status": status,
        "education_matched": edu_matched,
        "thresholds": {
            "shortlisted": shortlist_cut,
            "review": review_cut
        },
        "weights": {
            "required_skills": Config.REQUIRED_SKILLS_WEIGHT,
            "preferred_skills": Config.PREFERRED_SKILLS_WEIGHT,
            "experience": Config.EXPERIENCE_WEIGHT,
            "education": Config.EDUCATION_WEIGHT
        }
    }
