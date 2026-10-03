import re
from typing import List, Dict, Any, Optional, Set
from .text_preprocessor import clean_and_preprocess

# Predefined comprehensive skill dictionary (Deterministic rule-based catalog)
DEFAULT_SKILL_DICTIONARY: List[str] = [
    # Programming Languages
    "python", "java", "javascript", "typescript", "c++", "c#", ".net", "php", "ruby",
    "golang", "go", "rust", "swift", "kotlin", "scala", "dart", "perl", "r", "c",
    
    # Frontend Technologies
    "html", "html5", "css", "css3", "react", "react.js", "angular", "angularjs",
    "vue", "vue.js", "next.js", "nuxt.js", "svelte", "bootstrap", "tailwind",
    "tailwind css", "sass", "scss", "jquery", "redux",
    
    # Backend Frameworks
    "flask", "django", "fastapi", "node.js", "express", "express.js", "spring",
    "spring boot", "asp.net", "laravel", "ruby on rails", "nestjs",
    
    # Databases
    "mysql", "postgresql", "postgres", "sqlite", "mongodb", "redis", "oracle",
    "sql server", "ms sql", "mariadb", "cassandra", "dynamodb", "elasticsearch", "sql",
    
    # DevOps, Cloud & Tools
    "git", "github", "gitlab", "docker", "kubernetes", "aws", "azure", "gcp",
    "jenkins", "ci/cd", "terraform", "ansible", "linux", "nginx", "apache",
    "jira", "postman",
    
    # API & Architecture
    "rest api", "restful api", "restful", "graphql", "microservices", "soap",
    "websocket", "grpc",
    
    # Data & Analytics (Rule-based detection)
    "pandas", "numpy", "scipy", "scikit-learn", "data structures", "algorithms",
    "power bi", "tableau", "excel", "machine learning", "deep learning"
]

# Canonical mapping for skill synonyms / variations
SKILL_CANONICAL_MAP: Dict[str, str] = {
    "react.js": "react",
    "vue.js": "vue",
    "angularjs": "angular",
    "node.js": "node.js",
    "express.js": "express",
    "postgres": "postgresql",
    "tailwind css": "tailwind",
    "restful api": "rest api",
    "restful": "rest api",
    "ms sql": "sql server",
    "html5": "html",
    "css3": "css",
}

# Predefined education degrees
EDUCATION_PATTERNS = [
    (r"\bb\.?tech\b(?:\s+(?:in|of)\s+([a-zA-Z\s]{3,30}))?", "B.Tech"),
    (r"\bb\.?e\b(?:\s+(?:in|of)\s+([a-zA-Z\s]{3,30}))?", "B.E"),
    (r"\bbachelor\s+of\s+technology(?:\s+(?:in|of)\s+([a-zA-Z\s]{3,30}))?", "Bachelor of Technology"),
    (r"\bbachelor\s+of\s+engineering(?:\s+(?:in|of)\s+([a-zA-Z\s]{3,30}))?", "Bachelor of Engineering"),
    (r"\bmca\b(?:\s+(?:in|of)\s+([a-zA-Z\s]{3,30}))?", "MCA"),
    (r"\bm\.?tech\b(?:\s+(?:in|of)\s+([a-zA-Z\s]{3,30}))?", "M.Tech"),
    (r"\bm\.?e\b(?:\s+(?:in|of)\s+([a-zA-Z\s]{3,30}))?", "M.E"),
    (r"\bmaster\s+of\s+technology(?:\s+(?:in|of)\s+([a-zA-Z\s]{3,30}))?", "Master of Technology"),
    (r"\bmba\b(?:\s+(?:in|of)\s+([a-zA-Z\s]{3,30}))?", "MBA"),
    (r"\bbca\b(?:\s+(?:in|of)\s+([a-zA-Z\s]{3,30}))?", "BCA"),
    (r"\bb\.?sc\b(?:\s+(?:in|of)\s+([a-zA-Z\s]{3,30}))?", "B.Sc"),
    (r"\bm\.?sc\b(?:\s+(?:in|of)\s+([a-zA-Z\s]{3,30}))?", "M.Sc"),
    (r"\bdiploma(?:\s+(?:in|of)\s+([a-zA-Z\s]{3,30}))?", "Diploma"),
    (r"\bph\.?d\b", "Ph.D")
]

# Branch keywords
BRANCH_KEYWORDS = [
    "computer science engineering", "computer science and engineering", "computer science",
    "information technology", "electronics and communication", "electrical engineering",
    "mechanical engineering", "civil engineering", "data science", "artificial intelligence",
    "software engineering", "cyber security"
]


def _build_skill_regex(skill: str) -> re.Pattern:
    """Builds safe word-boundary regular expression for a skill name."""
    s = skill.strip().lower()
    if s == "c++":
        return re.compile(r'(?:^|[\s,;/()|])c\+\+(?:$|[\s,;/()|])', re.IGNORECASE)
    elif s == "c#":
        return re.compile(r'(?:^|[\s,;/()|])c\#(?:$|[\s,;/()|])', re.IGNORECASE)
    elif s == ".net":
        return re.compile(r'(?:^|[\s,;/()|])\.net(?:$|[\s,;/()|])', re.IGNORECASE)
    elif s == "c":
        # Strict boundary for single-letter 'C' to avoid false positives
        return re.compile(r'(?:^|[\s,;/()|])\bc\b(?:\s+(?:programming|language|developer))?', re.IGNORECASE)
    elif s == "r":
        return re.compile(r'(?:^|[\s,;/()|])\br\b(?:\s+(?:programming|language|studio))?', re.IGNORECASE)
    elif s == "go":
        return re.compile(r'(?:^|[\s,;/()|])\bgo(?:lang)?\b', re.IGNORECASE)
    else:
        # Multi-word or standard term
        escaped = re.escape(s).replace(r"\ ", r"\s+")
        return re.compile(r'\b' + escaped + r'\b', re.IGNORECASE)


def extract_skills_from_text(text: str, skill_dict: Optional[List[str]] = None) -> List[str]:
    """
    Extracts matching skills from text using deterministic keyword matching.
    Returns sorted list of distinct matched skills (canonical names).
    """
    if not text:
        return []

    dictionary = skill_dict if skill_dict is not None else DEFAULT_SKILL_DICTIONARY
    matched_skills: Set[str] = set()

    for skill in dictionary:
        pattern = _build_skill_regex(skill)
        if pattern.search(text):
            canonical = SKILL_CANONICAL_MAP.get(skill.lower(), skill.lower())
            matched_skills.add(canonical)

    return sorted(list(matched_skills))


def extract_job_skills(
    required_skills_str: str,
    preferred_skills_str: str = "",
    description_str: str = ""
) -> Dict[str, List[str]]:
    """
    Extracts and standardizes required and preferred skills from recruiter input.
    Splits comma or newline-separated inputs, normalizes, and removes duplicates.
    """
    def parse_skill_list(raw_input: str) -> List[str]:
        if not raw_input:
            return []
        items = re.split(r'[,;\n\r]+', raw_input)
        cleaned = []
        for item in items:
            name = item.strip().lower()
            if name:
                canonical = SKILL_CANONICAL_MAP.get(name, name)
                if canonical not in cleaned:
                    cleaned.append(canonical)
        return cleaned

    required = parse_skill_list(required_skills_str)
    preferred = parse_skill_list(preferred_skills_str)

    # If required skills was empty, check if we can extract skills from the job description
    if not required and description_str:
        required = extract_skills_from_text(description_str)

    # Avoid duplicate in preferred if already in required
    preferred = [s for s in preferred if s not in required]

    return {
        "required_skills": required,
        "preferred_skills": preferred
    }


def extract_experience(text: str) -> float:
    """
    Extracts numeric years of experience using regular expressions and rule-based patterns.
    Handles:
    - '2 years experience'
    - '2+ years of experience'
    - '3 years'
    - '5 yrs experience'
    - 'worked as a Python Developer for 2 years'
    - '2.5 years'
    
    Returns numeric float (e.g., 2.0). If no experience found, returns 0.0.
    """
    if not text:
        return 0.0

    patterns = [
        # 1. Explicit experience statement: '2+ years of experience', '3 years experience'
        r'(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience',
        # 2. 'experience: 3 years' or 'experience of 2 yrs'
        r'experience\s*(?:of|:)?\s*(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)',
        # 3. 'worked ... for 2 years'
        r'worked\s+.*?(?:for)?\s*(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)',
        # 4. 'total experience: 4.5'
        r'total\s+experience\s*[:\-]?\s*(\d+(?:\.\d+)?)',
        # 5. General 'X+ years' or 'X yrs'
        r'\b(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\b'
    ]

    candidate_years: List[float] = []
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            val_str = match.group(1)
            try:
                val = float(val_str)
                # Ignore values like 1999, 2020 (graduation years) or implausible > 40
                if 0.0 < val <= 40.0:
                    candidate_years.append(val)
            except ValueError:
                continue

    if candidate_years:
        # Return maximum detected reasonable work experience
        return max(candidate_years)

    return 0.0


def extract_education(text: str) -> Dict[str, str]:
    """
    Detects education degree and branch using predefined keyword patterns.
    Returns dict: {"degree": "B.Tech", "branch": "Computer Science Engineering", "summary": "B.Tech (Computer Science)"}
    """
    if not text:
        return {"degree": "Not specified", "branch": "Not specified", "summary": "Not specified"}

    detected_degree = ""
    detected_branch = ""

    # Check for degrees
    for pattern, degree_label in EDUCATION_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            detected_degree = degree_label
            # If degree regex caught branch group
            if match.groups() and match.group(1):
                branch_candidate = match.group(1).strip()
                if len(branch_candidate) > 2:
                    detected_branch = branch_candidate.title()
            break

    # If branch was not captured inline, check against known branch keywords
    if not detected_branch:
        for branch in BRANCH_KEYWORDS:
            if re.search(r'\b' + re.escape(branch) + r'\b', text, re.IGNORECASE):
                detected_branch = branch.title()
                break

    degree_result = detected_degree or "Graduation / Degree"
    branch_result = detected_branch or "Engineering / Technology"
    summary = f"{degree_result} in {branch_result}" if detected_branch else degree_result

    return {
        "degree": degree_result if detected_degree else "Not specified",
        "branch": branch_result if detected_branch else "Not specified",
        "summary": summary if detected_degree else "Not specified"
    }


def extract_contact_info(text: str) -> Dict[str, str]:
    """
    Extracts contact info (Email, Phone, Name) via rule-based patterns and heuristics.
    NOTE: Name extraction is heuristic-based (first non-header meaningful line)
    and may require recruiter verification.
    """
    if not text:
        return {"name": "Candidate", "email": "", "phone": ""}

    # 1. Email extraction (RFC compliant standard regex)
    email_match = re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
    email = email_match.group(0).strip().rstrip(".") if email_match else ""

    # 2. Phone extraction (Indian 10-digit format with optional +91 or 0 prefix, spaces, dashes)
    phone_pattern = r'(?:(?:\+91[\-\s]?)|(?:\b0))?([6-9]\d{4}[\-\s]?\d{5})\b'
    phone_match = re.search(phone_pattern, text)
    phone = ""
    if phone_match:
        phone = re.sub(r'[\-\s]', '', phone_match.group(0))
        if not phone.startswith("+91") and len(phone) == 10:
            phone = "+91 " + phone
    else:
        # Fallback general 10-digit number
        alt_match = re.search(r'\b[6-9]\d{9}\b', text)
        if alt_match:
            phone = "+91 " + alt_match.group(0)

    # 3. Name extraction heuristic:
    # First non-empty meaningful line, ignoring headers like 'Resume', 'CV', 'Curriculum Vitae', contact lines
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    candidate_name = "Candidate"
    
    ignored_headers = {
        "resume", "curriculum vitae", "cv", "bio-data", "biodata", "profile",
        "personal details", "contact", "experience", "education", "skills"
    }

    for line in lines[:10]:
        clean_line = line.strip()
        lower_line = clean_line.lower()

        # Skip obvious non-names
        if lower_line in ignored_headers or any(h == lower_line for h in ignored_headers):
            continue
        if "@" in clean_line or re.search(r'\d', clean_line):
            continue
        if len(clean_line.split()) > 5 or len(clean_line) < 2 or len(clean_line) > 50:
            continue
        if any(token in lower_line for token in ["developer", "engineer", "manager", "lead", "page"]):
            continue

        # Found candidate name candidate
        candidate_name = clean_line.title()
        break

    return {
        "name": candidate_name,
        "email": email,
        "phone": phone
    }
