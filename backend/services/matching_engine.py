from typing import List, Dict, Any


def match_resume_with_job(
    job_required_skills: List[str],
    job_preferred_skills: List[str],
    candidate_skills: List[str]
) -> Dict[str, Any]:
    """
    Compares job requirements with candidate skills in a completely deterministic,
    rule-based manner. No AI/ML or embeddings are used.

    Returns:
        dict: {
            "matched_required_skills": list of str,
            "missing_required_skills": list of str,
            "matched_preferred_skills": list of str,
            "missing_preferred_skills": list of str,
            "all_matched_skills": list of str,
            "all_missing_skills": list of str,
            "total_required": int,
            "matched_required_count": int,
            "total_preferred": int,
            "matched_preferred_count": int
        }
    """
    # Normalize candidate skills to lowercase for exact matching
    cand_skill_set = {s.strip().lower() for s in candidate_skills if s.strip()}

    matched_required = []
    missing_required = []

    for req in job_required_skills:
        req_norm = req.strip().lower()
        if req_norm in cand_skill_set:
            matched_required.append(req.title() if len(req) > 3 else req.upper())
        else:
            missing_required.append(req.title() if len(req) > 3 else req.upper())

    matched_preferred = []
    missing_preferred = []

    for pref in job_preferred_skills:
        pref_norm = pref.strip().lower()
        if pref_norm in cand_skill_set:
            matched_preferred.append(pref.title() if len(pref) > 3 else pref.upper())
        else:
            missing_preferred.append(pref.title() if len(pref) > 3 else pref.upper())

    return {
        "matched_required_skills": matched_required,
        "missing_required_skills": missing_required,
        "matched_preferred_skills": matched_preferred,
        "missing_preferred_skills": missing_preferred,
        "all_matched_skills": matched_required + matched_preferred,
        "all_missing_skills": missing_required + missing_preferred,
        "total_required": len(job_required_skills),
        "matched_required_count": len(matched_required),
        "total_preferred": len(job_preferred_skills),
        "matched_preferred_count": len(matched_preferred)
    }
