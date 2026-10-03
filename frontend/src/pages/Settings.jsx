import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Layers,
  Database,
  Calculator,
  Code,
  FileCheck,
  CheckCircle2,
  Info,
  Server
} from 'lucide-react';

export default function Settings() {
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)' }}>
          Rule Engine Architecture & Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Technical specifications, deterministic scoring formulas, and architectural walkthrough for interviews.
        </p>
      </div>

      {/* 1. Core Rule-Based Principle Card */}
      <div
        className="card"
        style={{
          padding: '1.75rem',
          marginBottom: '1.75rem',
          borderLeft: '4px solid #2563eb',
          background: 'linear-gradient(to right, #eff6ff, #ffffff)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <ShieldCheck size={26} color="#2563eb" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e40af' }}>
            Deterministic & Rule-Based Guarantee (No AI/ML Models)
          </h2>
        </div>
        <p style={{ color: '#334155', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1rem' }}>
          This system is 100% deterministic and rule-based. It <strong>never</strong> uses LLMs, OpenAI, Gemini, Hugging Face transformers, vector databases, or probabilistic embeddings. Every screening score is calculated using transparent mathematical rules that produce identical, reproducible results every single time.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className="badge badge-green">✓ 100% Deterministic</span>
          <span className="badge badge-blue">✓ Zero Hallucination Risk</span>
          <span className="badge badge-purple">✓ Instant Execution</span>
          <span className="badge badge-amber">✓ Explainable for Interviews</span>
        </div>
      </div>

      {/* 2. 100-Point Scoring Breakdown */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calculator size={20} color="#2563eb" />
          Scoring Formula Breakdown (Total = 100 Points)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0', background: '#f0fdf4' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#166534', textTransform: 'uppercase' }}>
              Required Skills
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#15803d', margin: '0.25rem 0' }}>
              60 Points
            </div>
            <code style={{ fontSize: '0.78rem', color: '#166534', background: '#dcfce7', padding: '0.2rem 0.4rem', borderRadius: '4px', display: 'block' }}>
              (matched / total) × 60
            </code>
            <p style={{ fontSize: '0.8rem', color: '#334155', marginTop: '0.5rem' }}>
              Mandatory core technical skills specified by the recruiter.
            </p>
          </div>

          <div style={{ padding: '1rem', borderRadius: '8px', border: '1px solid #ddd6fe', background: '#f5f3ff' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6d28d9', textTransform: 'uppercase' }}>
              Preferred Skills
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#7c3aed', margin: '0.25rem 0' }}>
              15 Points
            </div>
            <code style={{ fontSize: '0.78rem', color: '#6d28d9', background: '#ede9fe', padding: '0.2rem 0.4rem', borderRadius: '4px', display: 'block' }}>
              (matched / total) × 15
            </code>
            <p style={{ fontSize: '0.8rem', color: '#334155', marginTop: '0.5rem' }}>
              Secondary and bonus competencies.
            </p>
          </div>

          <div style={{ padding: '1rem', borderRadius: '8px', border: '1px solid #bfdbfe', background: '#eff6ff' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1e40af', textTransform: 'uppercase' }}>
              Experience Match
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#2563eb', margin: '0.25rem 0' }}>
              15 Points
            </div>
            <code style={{ fontSize: '0.78rem', color: '#1e40af', background: '#dbeafe', padding: '0.2rem 0.4rem', borderRadius: '4px', display: 'block' }}>
              min(15, (exp / req_exp) × 15)
            </code>
            <p style={{ fontSize: '0.8rem', color: '#334155', marginTop: '0.5rem' }}>
              Regex-extracted numeric years vs job minimum requirement.
            </p>
          </div>

          <div style={{ padding: '1rem', borderRadius: '8px', border: '1px solid #fde68a', background: '#fffbeb' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#92400e', textTransform: 'uppercase' }}>
              Education Match
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#b45309', margin: '0.25rem 0' }}>
              10 Points
            </div>
            <code style={{ fontSize: '0.78rem', color: '#92400e', background: '#fef3c7', padding: '0.2rem 0.4rem', borderRadius: '4px', display: 'block' }}>
              10 if matched else 0
            </code>
            <p style={{ fontSize: '0.8rem', color: '#334155', marginTop: '0.5rem' }}>
              Keyword matching for B.Tech, B.E, MCA, M.Tech, etc.
            </p>
          </div>
        </div>
      </div>

      {/* 3. System Architecture Diagram */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={20} color="#2563eb" />
          End-to-End System Pipeline
        </h3>

        <div
          style={{
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '10px',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            lineHeight: '1.7',
            overflowX: 'auto',
          }}
        >
          <div>React Frontend (Vite, Axios, Router)</div>
          <div>    │</div>
          <div>    ▼ HTTP / REST APIs (Flask + Flask-CORS)</div>
          <div>┌────────────────────────────────────────────────────────┐</div>
          <div>│ Flask Backend                                          │</div>
          <div>│   ├── 1. Resume Parser (PyPDF2 + python-docx)          │</div>
          <div>│   ├── 2. Text Preprocessor (Regex + lowercasing)       │</div>
          <div>│   ├── 3. Entity & Skill Extractor (Word boundaries)    │</div>
          <div>│   ├── 4. Rule-Based Matching Engine                    │</div>
          <div>│   ├── 5. 100-Point Scoring Engine                      │</div>
          <div>│   └── 6. Candidate Ranking Engine (Python sort)        │</div>
          <div>└──────────────────────────┬─────────────────────────────┘</div>
          <div>                            │</div>
          <div>                            ▼ PyMySQL</div>
          <div>                     MySQL Database (resume_screening)</div>
        </div>
      </div>

      {/* 4. Viva / Interview Explanations */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Info size={20} color="#2563eb" />
          Project Viva & Interview Highlights
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.25rem' }}>
              Q: Why is a rule-based system advantageous over an AI/LLM model in HR screening?
            </strong>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5' }}>
              Rule-based systems provide full algorithmic transparency, regulatory auditability, 100% deterministic reproducibility, zero latency from external API calls, zero hallucination of candidate qualifications, and zero cloud API expenses.
            </p>
          </div>

          <div>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.25rem' }}>
              Q: How does the system handle single-letter and symbol languages like C++ or C#?
            </strong>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5' }}>
              The text preprocessor uses symbol protection tokens (e.g. replacing `c++` with a temporary token before removing punctuation, then restoring it). Single letters like `C` use strict context boundaries to avoid false positives with common English words.
            </p>
          </div>

          <div>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.25rem' }}>
              Q: What are the project's limitations?
            </strong>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5' }}>
              Exact keyword matching may not capture synonymous phrases unless registered in the canonical dictionary. Scanned image-only PDFs require OCR (which is intentionally not included). The system acts as a recruiter assistant and human recruiters make final hiring choices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
