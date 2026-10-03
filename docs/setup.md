# Smart Screen AI — Setup & Installation Guide

This guide walks you through setting up and running **Smart Screen AI — AI Resume Screening System** on Windows 11.

---

## 1. Prerequisites

Ensure the following tools are installed:
- **Python 3.10+** (verified with Python 3.11/3.12/3.14)
- **Node.js 18+** and **npm 9+**
- **MySQL Server 8.x** (Local installation or XAMPP / Docker)
- **Git**

---

## 2. Repository Structure

```
AI RESUME SCREENING/
├── backend/
│   ├── app/
│   │   ├── database/          # Connection manager & SQL schema
│   │   ├── models/            # Job, Candidate, Screening, Chat models
│   │   ├── routes/            # REST API endpoints
│   │   ├── services/          # Parsers, Cleaners, FAISS Vector Store, Embeddings, Screening Engine, RAG
│   │   ├── utils/             # File handlers & validators
│   │   └── config.py          # App configuration
│   ├── uploads/               # Uploaded resume files (auto-created)
│   ├── vector_data/           # FAISS index binary & metadata (auto-created)
│   ├── tests/                 # 88 automated pytest suites
│   ├── requirements.txt       # Backend dependencies
│   ├── run.py                 # Flask server runner
│   └── .env                   # Backend environment variables
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, Sidebar, Modal, Badges, EmptyStates
│   │   ├── pages/             # Dashboard, Jobs, Candidates, Screening, Assistant
│   │   ├── services/          # Axios API client
│   │   ├── App.jsx            # React router application
│   │   └── index.css          # Design system & CSS tokens
│   ├── package.json           # Frontend dependencies
│   └── vite.config.js         # Vite proxy configuration
├── docs/                      # Technical architecture, setup, interview guide
└── README.md                  # Project overview
```

---

## 3. Backend Setup

### Step 1: Open Terminal in `backend/`
```powershell
cd "c:\Users\geeth\Downloads\AI RESUME SCREENING\backend"
```

### Step 2: Install Python Dependencies
```powershell
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env` (already done for you):
```ini
FLASK_ENV=development
FLASK_PORT=5000
SECRET_KEY=smart_screen_ai_super_secret_production_key_2026

# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_DB=smart_screen_ai

# Embeddings & Vector Store
EMBEDDING_MODEL=all-MiniLM-L6-v2
VECTOR_STORE_PATH=vector_data/faiss_index.bin

# RAG & LLM Engine
LLM_PROVIDER=local
OPENAI_API_KEY=
```

### Step 4: Initialize MySQL Database
Make sure your local MySQL service is running, then run the database initialization script:
```powershell
python -m app.database.init_db
```
> **Note**: Even if MySQL is offline or disconnected, the backend server will start gracefully and report its disconnected status via the Health API without crashing.

### Step 5: Run the Flask API Server
```powershell
python run.py
```
Backend API will be accessible at: `http://localhost:5000`
Health API check: `http://localhost:5000/api/health`

---

## 4. Frontend Setup

### Step 1: Open Terminal in `frontend/`
```powershell
cd "c:\Users\geeth\Downloads\AI RESUME SCREENING\frontend"
```

### Step 2: Install NPM Packages
```powershell
npm install
```

### Step 3: Start Vite Development Server
```powershell
npm run dev
```
Frontend Web Dashboard will be accessible at: `http://localhost:5173`

---

## 5. Running Automated Backend Tests

The project includes an extensive suite of 88 automated tests covering database DDL, REST endpoints, text parsing (PDF, DOCX, TXT), FAISS vector store persistence, 4-factor screening formulas, and grounded RAG reasoning:

```powershell
cd "c:\Users\geeth\Downloads\AI RESUME SCREENING\backend"
python -m pytest -v
```

All 88 tests should execute and pass cleanly.
