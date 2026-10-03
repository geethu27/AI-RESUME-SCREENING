# Smart Screen AI — API Reference

## Health API

### GET `/api/health`
Checks server running status and tests connectivity to the configured MySQL database.

#### Request
```http
GET /api/health HTTP/1.1
Host: localhost:5000
```

#### Successful Response (Database Connected)
```json
{
  "success": true,
  "message": "Smart Screen AI backend is running",
  "server": "running",
  "database": "connected",
  "database_message": "MySQL connection successful.",
  "environment": "development",
  "version": "1.0.0",
  "timestamp": "2026-10-02T08:30:00.000000+00:00",
  "database_info": {
    "host": "localhost",
    "port": 3306,
    "database": "smart_screen_ai",
    "database_exists": true,
    "server_version": "8.0.36"
  }
}
```

---

## Job Management APIs (Phase 3)

### 1. Create Job
`POST /api/jobs`

Creates a new job role with required skills, experience, and education qualifications.

#### Request
```http
POST /api/jobs HTTP/1.1
Content-Type: application/json

{
  "title": "Python Full Stack Developer",
  "description": "Looking for an engineer proficient in Python, Flask, React, and MySQL to design and scale intelligent applicant processing systems.",
  "required_skills": ["Python", "Flask", "React", "MySQL"],
  "experience_required": "Fresher",
  "education_required": "B.Tech"
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Job created successfully",
  "job_id": 1,
  "job": {
    "id": 1,
    "title": "Python Full Stack Developer",
    "description": "...",
    "required_skills": ["Python", "Flask", "React", "MySQL"],
    "experience_required": "Fresher",
    "education_required": "B.Tech",
    "created_at": "2026-10-02T10:00:00",
    "updated_at": "2026-10-02T10:00:00"
  }
}
```

---

### 2. Get All Jobs
`GET /api/jobs`

Retrieves all job postings ordered by creation date descending.

#### Request
```http
GET /api/jobs HTTP/1.1
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "count": 1,
  "jobs": [...]
}
```

---

### 3. Get Single Job
`GET /api/jobs/<job_id>`

---

### 4. Update Job
`PUT /api/jobs/<job_id>`

---

### 5. Delete Job
`DELETE /api/jobs/<job_id>`

---

## Resume Upload & Candidates APIs (Phase 4, 5, 6)

### 1. Upload Resume
`POST /api/resumes/upload`

Uploads candidate resume file (`.pdf`, `.docx`, or `.txt`), performs security sanitization, text extraction via PyMuPDF/python-docx, text cleaning, metadata extraction, indexes into FAISS, and stores the candidate in MySQL.

#### Request
```http
POST /api/resumes/upload HTTP/1.1
Content-Type: multipart/form-data

file: [binary resume file]
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Resume uploaded and processed successfully",
  "candidate_id": 1,
  "candidate": {
    "candidate_id": 1,
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "phone": "+1-555-0199",
    "original_filename": "jane_doe_resume.pdf",
    "saved_filename": "9b12a8f3d4_jane_doe_resume.pdf",
    "character_count": 2840,
    "indexed_chunks": 4,
    "preview": "Jane Doe\nFull Stack Engineer..."
  },
  "errors": []
}
```

---

### 2. Get All Candidates
`GET /api/resumes/candidates`

---

### 3. Get Single Candidate
`GET /api/resumes/candidates/<candidate_id>`

---

### 4. Delete Candidate
`DELETE /api/resumes/candidates/<candidate_id>`

---

## Screening & Candidate Ranking APIs (Phase 11, 12, 13)

### 1. Run Screening for Job
`POST /api/screening/<job_id>`

Runs multi-factor candidate screening against the specified job role. Evaluates dense semantic similarity, exact/alias skill matching, experience alignment, and education credentials. Saves results to MySQL and returns ranked candidates.

#### Request
```http
POST /api/screening/1 HTTP/1.1
Content-Type: application/json

{
  "candidate_ids": [1, 2, 3]  // optional; screens all candidates if omitted
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Screening completed successfully for job 'Python Full Stack Developer'.",
  "job_id": 1,
  "job_title": "Python Full Stack Developer",
  "candidates_evaluated": 2,
  "ranked_candidates": [
    {
      "rank": 1,
      "id": 10,
      "candidate_id": 5,
      "candidate_name": "Alex Morgan",
      "candidate_email": "alex.morgan@example.com",
      "candidate_phone": "(555) 345-6789",
      "resume_filename": "d38a0f91b72e_sample_resume.txt",
      "similarity_score": 84.50,
      "skill_match_score": 100.00,
      "experience_match_score": 100.00,
      "education_match_score": 100.00,
      "final_score": 93.80,
      "recommendation": "Strong Match",
      "matched_skills": ["Python", "Flask", "React", "MySQL"],
      "missing_skills": [],
      "explanation": "Candidate 'Alex Morgan' received a screening score of 93.8% (Strong Match).\n• Skills Match (100.0%): Matched: [Python, Flask, React, MySQL]. Missing from resume: [None].\n• Experience: Candidate has 4.0 years experience, meeting the required 0.0+ years.\n• Education: Candidate holds B.Tech, satisfying requirement.\n• Semantic Relevance (84.5%): Dense vector alignment between resume context and job requirements.\nDecision Support Notice: This AI-generated score is an assistive signal for human recruiter review and does not represent an automated hiring decision."
    }
  ]
}
```

---

### 2. Get Screening Results for Job
`GET /api/screening/<job_id>`

Retrieves existing ranked screening evaluations for the given job.

#### Request
```http
GET /api/screening/1 HTTP/1.1
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "job_id": 1,
  "job_title": "Python Full Stack Developer",
  "count": 1,
  "ranked_candidates": [...]
}
```

---

### 3. Get Single Candidate Evaluation
`GET /api/screening/<job_id>/candidates/<candidate_id>`

Retrieves detailed scores, resume text, and AI explanation for a single candidate under a specific job.

#### Request
```http
GET /api/screening/1/candidates/5 HTTP/1.1
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "evaluation": {
    "job_id": 1,
    "candidate_id": 5,
    "candidate_name": "Alex Morgan",
    "final_score": 93.80,
    "recommendation": "Strong Match",
    "explanation": "..."
  }
}
```
