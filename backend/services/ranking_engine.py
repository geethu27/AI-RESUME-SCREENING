from typing import List, Dict, Any, Optional


def rank_candidates(
    candidates_screening_data: List[Dict[str, Any]],
    sort_by: str = "score",
    ascending: bool = False,
    status_filter: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Ranks screened candidates deterministically using standard Python sorting.
    No ML ranking models are used.

    Arguments:
        candidates_screening_data: List of screened candidate result dictionaries
        sort_by: "score" | "name" | "experience"
        ascending: bool (default False for highest score first)
        status_filter: Optional filter by "Shortlisted", "Review", "Not Shortlisted"
    """
    if not candidates_screening_data:
        return []

    # Copy list so we don't mutate input in-place
    data = list(candidates_screening_data)

    # Optional status filter
    if status_filter and status_filter.lower() != "all":
        data = [
            c for c in data
            if str(c.get("status", "")).strip().lower() == status_filter.strip().lower()
        ]

    # Deterministic sorting
    if sort_by == "name":
        data.sort(
            key=lambda x: str(x.get("candidate_name") or x.get("name") or "").lower(),
            reverse=not ascending
        )
    elif sort_by == "experience":
        data.sort(
            key=lambda x: float(x.get("experience") or 0.0),
            reverse=not ascending
        )
    else:  # default: score
        data.sort(
            key=lambda x: float(x.get("total_score") or 0.0),
            reverse=not ascending
        )

    # Attach rank order (1-based index)
    for index, item in enumerate(data, start=1):
        item["rank"] = index

    return data
