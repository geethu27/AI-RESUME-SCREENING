# Resume Screening System

> **A Complete, Deterministic, Rule-Based Full-Stack Web Application for Automated Recruiter Resume Screening.**  
> *Built with Python (Flask), React.js, and MySQL. Strictly contains NO Artificial Intelligence, Machine Learning, or LLM models.*

---

## 1. Project Title & Overview

The **Resume Screening System** is a full-stack recruitment tool designed to assist human recruiters in evaluating and ranking candidate resumes against detailed job requirements.

Unlike black-box AI algorithms, this system is **100% deterministic and rule-based**. Every calculation is transparent, reproducible, and explainable:
- Text is extracted using standard document parsers (`PyPDF2`, `python-docx`).
- Preprocessing standardizes tokens while protecting technical terms like `C++`, `C#`, and `.NET`.
- Skills, experience, education, and contact details are extracted using keyword catalogs and regular expressions.
- Matching compares candidate attributes directly against job specifications.
- Scoring awards points according to a strict 100-point transparent formula.
- Candidates are ranked using deterministic Python sorting.

---

## 2. Key Features

- **Recruiter Authentication**: Simple, secure credentials authentication with password hashing (`Werkzeug PBKDF2/scrypt`).
- **Recruiter Dashboard**: Live statistics showing Total Jobs, Resumes, Candidates, Screened Candidates, and Shortlisted Candidates.
- **Job Position Management**:
  - Full CRUD operations (Create, Read, Update, Delete).
  - Configurable Job Title, Description, Minimum Experience, and Required Education.
  - Separate definitions for **Required Skills** (mandatory) and **Preferred Skills** (bonus).
  - One-click template loader for quick testing.
- **Multi-File Resume Upload**:
  - Supports **PDF (.pdf)** and **Word (.docx)** documents.
  - Bulk multi-file upload support.
  - Client and server-side validation: file type, 16 MB size limit, and empty file prevention.
  - Error detection for password-protected or scanned image-only PDFs.
- **Rule-Based Entity & Skill Extraction**:
  - **Skills**: Exact word-boundary matching over a curated dictionary of 50+ languages, frameworks, and databases.
  - **Experience**: Regular expression extraction from phrases like `2+ years of experience` or `worked for 3 years`.
  - **Education**: Degree keyword recognition (`B.Tech`, `B.E`, `MCA`, `M.Tech`, `MBA`, `B.Sc`, `Diploma`) and branch identification (`Computer Science`, `IT`, etc.).
  - **Contact Information**: Standard RFC email regex and Indian 10-digit phone number detection.
- **Deterministic 100-Point Scoring Engine**:
  - **Required Skills**: 60 Points maximum (proportional to matched count).
  - **Preferred Skills**: 15 Points maximum (proportional to matched count).
  - **Experience**: 15 Points maximum (awarded proportionally if below minimum requirement, full points if met).
  - **Education**: 10 Points (awarded if degree matches or satisfies criteria).
  - **Total**: 100 Points maximum.
- **Screening & Ranking Dashboard**:
  - Automatic status classification:
    - **Shortlisted**: Score ≥ 80 points
    - **Review**: Score ≥ 60 points
    - **Not Shortlisted**: Score < 60 points
  - **Interactive Threshold Sliders**: Adjust cutoff thresholds live on screen.
  - **Sorting**: Sort by Score, Candidate Name, or Experience.
  - **Status Filters**: Filter candidates by Shortlisted, Review, or Not Shortlisted.
- **Detailed Candidate Evaluation Modal**:
  - Candidate contact information and full extracted resume text viewer.
  - Point-by-point breakdown cards (Required /60, Preferred /15, Experience /15, Education /10).
  - Side-by-side lists of matched skills (`✓`) and missing skills (`✗`).

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, JavaScript (ES6+), React Router v6, Axios, Lucide Icons, Pure CSS |
| **Backend** | Python 3.10+, Flask 3.x, Flask-CORS, python-dotenv, Werkzeug |
| **Database** | MySQL (with automatic local SQLite compatibility fallback) |
| **Document Parsers** | `PyPDF2` (PDF text extraction), `python-docx` (DOCX extraction) |
| **Text Processing** | Python `re` (Regular Expressions), string normalization |
| **Testing** | `unittest` / `pytest` test suite |

> **IMPORTANT**: This project strictly avoids OpenAI, Gemini, Claude, LangChain, Hugging Face, Transformers, BERT, PyTorch embeddings, FAISS, and vector databases.

---

## 4. System Architecture

```text
                        ┌─────────────────────────────────┐
                        │      React 18 User Interface    │
                        │ (Vite, Axios, React Router, UI) │
                        └────────────────┬────────────────┘
                                         │
                                         │ HTTP REST API (JSON)
                                         ▼
                        ┌─────────────────────────────────┐
                        │          Flask Backend          │
                        ├─────────────────────────────────┤
                        │  ├── Auth & Job Routes          │
                        │  ├── Resume Upload Handler      │
                        │  ├── Resume Parser (PDF/DOCX)   │
                        │  ├── Text Preprocessor          │
                        │  ├── Skill & Entity Extractor   │
                        │  ├── Rule-Based Matching Engine │
                        │  ├── 100-Point Scoring Engine   │
                        │  └── Python Ranking Engine      │
                        └────────────────┬────────────────┘
                                         │
                                         │ PyMySQL / SQL
                                         ▼
                        ┌─────────────────────────────────┐
                        │         MySQL Database          │
                        │       (resume_screening)        │
                        └─────────────────────────────────┘
```

---

## 5. Screening Workflow

```text
Recruiter Login
      │
      ▼
Dashboard Overview
      │
      ▼
Create Job Position ──► Enter Title, Description, Required/Preferred Skills, Exp & Edu ──► Save in MySQL
      │
      ▼
Upload Resumes ──────► Validate File (PDF/DOCX, Size, Not Empty)
      │
      ▼
Resume Parser ───────► PyPDF2 / python-docx Extract Raw Text
      │
      ▼
Text Preprocessor ───► Lowercase, protect technical symbols (C++, C#, .NET), normalize spaces
      │
      ▼
Entity Extraction ───► Extract Skills, Experience (regex), Education (keywords), Email & Phone
      │
      ▼
Rule Matching Engine ► Compare Resume Skills vs Job Required & Preferred Skills
      │
      ▼
Scoring Engine ──────► Compute 100-Point Score (Req: 60, Pref: 15, Exp: 15, Edu: 10)
      │
      ▼
Status Assignment ───► Shortlisted (≥80) | Review (≥60) | Not Shortlisted (<60)
      │
      ▼
Database Storage ────► Persist results in MySQL `screening_results` table
      │
      ▼
Candidate Ranking ───► Deterministic Python sorting by total_score DESC
      │
      ▼
Recruiter Review ────► View detailed breakdown & make final hiring decision manually
```

---

## 6. Folder Structure

```text
AI RESUME SCREENING/
├── backend/
│   ├── app.py                     # Main Flask application & factory
│   ├── config.py                  # Environment settings & constants
│   ├── requirements.txt           # Python dependencies
│   ├── run.py                     # Server entrypoint
│   ├── schema.sql                 # MySQL schema creation script
│   ├── seed.py                    # Sample database seeder
│   ├── .env                       # Environment variables
│   ├── .env.example               # Environment template
│   ├── models/
│   │   ├── __init__.py
│   │   └── database.py            # MySQL database wrapper & queries
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth_routes.py         # Login endpoint
│   │   ├── job_routes.py          # Jobs CRUD endpoints
│   │   ├── resume_routes.py       # Resume upload and parsing
│   │   ├── screening_routes.py    # Rule matching & scoring
│   │   └── candidate_routes.py    # Candidate records & history
│   ├── services/
│   │   ├── __init__.py
│   │   ├── resume_parser.py       # PyPDF2 & python-docx extractors
│   │   ├── text_preprocessor.py   # Rule-based text cleaning
│   │   ├── skill_extractor.py     # Keyword & regex entity extractors
│   │   ├── matching_engine.py     # Requirements vs resume comparison
│   │   ├── scoring_engine.py      # 100-Point scoring algorithm
│   │   └── ranking_engine.py      # Deterministic Python sorter
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── validators.py          # Input and file validators
│   │   └── file_handler.py        # Secure file saving
│   ├── uploads/                   # Stored resume documents
│   └── tests/
│       ├── __init__.py
│       ├── test_services.py       # Unit tests for rule algorithms
│       ├── test_api_endpoints.py  # End-to-end API test cases
│       └── test_unhappy_paths.py  # Negative and edge test cases
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx                # Router & shell
│       ├── main.jsx
│       ├── index.css              # Custom styling
│       ├── components/
│       │   ├── Navbar.jsx         # Header & health status
│       │   ├── Sidebar.jsx        # Navigation sidebar
│       │   ├── ScoreBadge.jsx     # Color-coded score component
│       │   └── Modal.jsx          # Reusable modal
│       ├── pages/
│       │   ├── Login.jsx          # Page 1: Login
│       │   ├── Dashboard.jsx      # Page 2: Dashboard metrics
│       │   ├── Jobs.jsx           # Page 3 & 4: Create Job & Details
│       │   ├── ResumeUpload.jsx   # Page 5: Multi-resume upload
│       │   ├── Screening.jsx      # Page 6 & 7: Screening & Details
│       │   ├── Candidates.jsx     # Candidates catalog
│       │   └── Settings.jsx       # Rule engine walkthrough
│       └── services/
│           └── api.js             # Axios API service client
├── sample_resumes/                # Test resumes in .pdf and .docx
└── README.md                      # Project documentation
```

---

## 7. Installation & Setup Guide

### Prerequisites
- **Python 3.10+**
- **Node.js v18+** & **npm**
- **MySQL Server** (Optional for local testing; SQLite fallback is built-in)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/resume-screening-system.git
cd "AI RESUME SCREENING"
```

---

### Step 2: MySQL Database Setup
1. Start your local MySQL service (e.g. via MySQL Workbench or command line):
   ```bash
   mysql -u root -p
   ```
2. Run the database schema script:
   ```sql
   SOURCE backend/schema.sql;
   ```
   *(Alternatively, run the queries in `backend/schema.sql` directly inside MySQL Workbench).*

---

### Step 3: Backend Setup
1. Open a terminal in the root directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   python -m pip install -r requirements.txt
   ```
3. Configure environment variables in `backend/.env`:
   ```ini
   PORT=5000
   FLASK_ENV=development
   SECRET_KEY=your-secure-random-secret-key

   # MySQL Database Credentials
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=resume_screening

   MAX_CONTENT_LENGTH=16777216
   ```
4. Optional: Seed the database with sample jobs and candidates:
   ```bash
   python seed.py
   ```
5. Start the Flask server:
   ```bash
   python app.py
   ```
   The backend API will start on `http://localhost:5000`.

---

### Step 4: Frontend Setup
1. Open a new terminal in the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   ```text
   http://localhost:5173
   ```
5. Sign in using the default recruiter credentials:
   - **Email:** `admin@company.com`
   - **Password:** `admin123`

---

## 8. REST API Documentation

All API responses follow a uniform JSON structure:
- **Success:** `{"success": true, "message": "...", "data": {...}}`
- **Error:** `{"success": false, "message": "..."}`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Check backend server and database status |
| `GET` | `/api/dashboard/stats` | Retrieve metrics for dashboard cards |
| `POST` | `/api/login` | Recruiter authentication |
| `GET` | `/api/jobs` | List all job positions |
| `POST` | `/api/jobs` | Create a new job position |
| `GET` | `/api/jobs/<id>` | Retrieve specific job position |
| `PUT` | `/api/jobs/<id>` | Update an existing job position |
| `DELETE` | `/api/jobs/<id>` | Delete a job position |
| `POST` | `/api/resumes/upload` | Upload one or multiple resumes (.pdf, .docx) |
| `GET` | `/api/resumes` | List all uploaded resumes |
| `GET` | `/api/resumes/<id>` | Retrieve resume details and full extracted text |
| `POST` | `/api/screening/<job_id>` | Execute rule-based screening and ranking |
| `GET` | `/api/screening/<job_id>` | Retrieve ranked screening results |
| `GET` | `/api/screening/<job_id>/candidate/<candidate_id>` | Retrieve candidate screening evaluation report |
| `GET` | `/api/candidates` | List all candidate profiles |
| `GET` | `/api/candidates/<id>` | Retrieve single candidate profile & history |

---

## 9. Scoring Algorithm Walkthrough

### Example from Section 16 of the Specification:
- **Job Requirements:**
  - **Required Skills:** `Python`, `Flask`, `React`, `MySQL` (Total: 4)
  - **Preferred Skills:** `Git`, `Docker` (Total: 2)
  - **Minimum Experience:** 1 Year
  - **Required Education:** `B.Tech`
- **Candidate Resume:**
  - *Extracted text mentions Python, Flask, MySQL, Git, 1 year experience, B.Tech graduate.*
- **Calculation:**
  $$\text{Required Skills Score} = \left(\frac{3}{4}\right) \times 60 = 45.00$$
  $$\text{Preferred Skills Score} = \left(\frac{1}{2}\right) \times 15 = 7.50$$
  $$\text{Experience Score} = 15.00 \quad (\text{Candidate } 1 \ge \text{Required } 1)$$
  $$\text{Education Score} = 10.00 \quad (\text{B.Tech detected})$$
  $$\mathbf{\text{Total Score}} = 45.00 + 7.50 + 15.00 + 10.00 = \mathbf{77.50} \implies \textbf{Review Status}$$

---

## 10. Automated Testing

The project includes an automated test suite covering unit parsing, preprocessing, scoring, end-to-end API flows, and negative edge cases.

To execute the test suite:
```bash
python -m unittest discover -s backend/tests -p "test_*.py"
```

### Verified Test Cases:
1. `test_text_preprocessing`: Verifies lowercase normalization and technical symbol preservation (`C++`, `C#`, `.NET`).
2. `test_docx_extraction`: Verifies Word text and table extraction.
3. `test_pdf_extraction`: Verifies PDF text extraction via PyPDF2.
4. `test_skill_extraction`: Verifies exact word-boundary keyword matching.
5. `test_experience_extraction`: Verifies regex extraction of numeric experience (`2+ years` $\to$ `2.0`).
6. `test_education_extraction`: Verifies degrees (`B.Tech`, `MCA`, `B.Sc`, `Diploma`).
7. `test_rule_based_matching_and_scoring_section_16_example`: Validates the exact 77.5 Review calculation.
8. `test_candidate_ranking`: Verifies Python deterministic sorting by score.
9. `test_unhappy_path_empty_resume`: Verifies rejection of 0-byte resumes.
10. `test_unhappy_path_invalid_file_extension`: Verifies rejection of non-PDF/DOCX files.
11. `test_unhappy_path_resume_with_no_matching_skills`: Verifies score = 0.0 for unrelated profiles.
12. `test_unhappy_path_missing_job`: Verifies clean 404 response on missing job ID.

---

## 11. Important Project Limitations

1. **Rule-Based & Keyword Dependent**: The system uses deterministic keyword matching. If a candidate uses an uncommon synonym not registered in the skill dictionary, the skill will not be matched.
2. **Formatting & Structure**: Text extraction depends on the underlying PDF or DOCX formatting. Unconventional multi-column layouts or broken font encodings may affect string order.
3. **No OCR**: The system explicitly does not use AI or OCR. Scanned document images containing no selectable text cannot be read, and the system prompts the recruiter accordingly.
4. **Heuristic Candidate Names**: Name extraction utilizes the first non-empty, non-header line of the resume as a heuristic. Recruiters can verify candidate identity via email and phone.
5. **Human Decision-Maker**: This tool is strictly a screening assistant designed to save recruiters time; final hiring decisions must always be made by a human recruiter.

---

## 12. Future Enhancements

The following features can be added in future iterations:
- NLP-based semantic matching for synonyms.
- Machine learning ranking models.
- LLM-based narrative resume summaries.
- RAG-based knowledge retrieval across company job descriptions.
- Vector database indexing for cross-lingual search.
- Multilingual resume parsing.
- OCR integration for scanned image-only PDFs.
- Recruiter analytics and interview scheduling integrations.

*(These features are intentionally excluded from the current version to maintain strict determinism and rule-based auditability).*

---

## 13. License & Authors

Created for Academic Demonstration & Software Engineering Pair-Programming.  
Suitable for B.Tech final-year viva, code defense, and technical recruitment interviews.
