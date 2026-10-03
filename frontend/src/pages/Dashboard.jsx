import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  FileText,
  Users,
  Award,
  CheckCircle2,
  PlusCircle,
  UploadCloud,
  ChevronRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { getDashboardStats, getJobs, getCandidates } from '../services/api';
import ScoreBadge from '../components/ScoreBadge';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_jobs: 0,
    total_resumes: 0,
    total_candidates: 0,
    screened_candidates: 0,
    shortlisted_candidates: 0,
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentCandidates, setRecentCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, jobsRes, candRes] = await Promise.all([
        getDashboardStats(),
        getJobs(),
        getCandidates(),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (jobsRes.success) setRecentJobs(jobsRes.data.slice(0, 4));
      if (candRes.success) setRecentCandidates(candRes.data.slice(0, 5));
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '16px',
          padding: '2rem 2.5rem',
          color: '#ffffff',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          border: '1px solid #334155',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59, 130, 246, 0.2)', padding: '0.3rem 0.8rem', borderRadius: '20px', color: '#93c5fd', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.75rem' }}>
            <Cpu size={14} /> Rule-Based & Deterministic Engine
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            Recruiter Screening Dashboard
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '600px' }}>
            Screen resumes against job descriptions using deterministic keywords, regular expressions, and a 100-point rule-based scoring system.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/jobs', { state: { openCreateModal: true } })}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}
          >
            <PlusCircle size={18} />
            <span>Create Job</span>
          </button>
          <button
            onClick={() => navigate('/upload')}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', backgroundColor: '#334155', color: '#ffffff', border: 'none' }}
          >
            <UploadCloud size={18} />
            <span>Upload Resumes</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button onClick={fetchDashboardData} className="btn btn-secondary btn-sm">Retry</button>
        </div>
      )}

      {/* Metrics Cards Grid (Section 5 Page 2 Requirements) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {/* Card 1: Total Jobs */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Total Jobs</span>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: '#eff6ff', color: '#2563eb' }}>
              <Briefcase size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            {loading ? '...' : stats.total_jobs}
          </div>
          <Link to="/jobs" style={{ fontSize: '0.8rem', color: '#2563eb', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            View Jobs <ChevronRight size={14} />
          </Link>
        </div>

        {/* Card 2: Total Resumes */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Total Resumes</span>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: '#f5f3ff', color: '#7c3aed' }}>
              <FileText size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            {loading ? '...' : stats.total_resumes}
          </div>
          <Link to="/upload" style={{ fontSize: '0.8rem', color: '#7c3aed', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            Upload Resumes <ChevronRight size={14} />
          </Link>
        </div>

        {/* Card 3: Total Candidates */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #06b6d4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Total Candidates</span>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: '#ecfeff', color: '#0891b2' }}>
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            {loading ? '...' : stats.total_candidates}
          </div>
          <Link to="/candidates" style={{ fontSize: '0.8rem', color: '#0891b2', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            View Candidates <ChevronRight size={14} />
          </Link>
        </div>

        {/* Card 4: Screened Candidates */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Screened</span>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: '#fffbeb', color: '#d97706' }}>
              <Award size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            {loading ? '...' : stats.screened_candidates}
          </div>
          <Link to="/screening" style={{ fontSize: '0.8rem', color: '#d97706', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            View Results <ChevronRight size={14} />
          </Link>
        </div>

        {/* Card 5: Shortlisted Candidates */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Shortlisted</span>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: '#f0fdf4', color: '#16a34a' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            {loading ? '...' : stats.shortlisted_candidates}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: '600' }}>
            Score ≥ 80 pts
          </span>
        </div>
      </div>

      {/* Two Column Layout: Recent Jobs & Recent Screened Candidates */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Jobs */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)' }}>Active Job Positions</h2>
            <Link to="/jobs" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
              All Jobs
            </Link>
          </div>

          {recentJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <Briefcase size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <p>No job positions created yet.</p>
              <button
                onClick={() => navigate('/jobs', { state: { openCreateModal: true } })}
                className="btn btn-primary btn-sm"
                style={{ marginTop: '0.75rem' }}
              >
                Create First Job
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentJobs.map((j) => (
                <div
                  key={j.id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#fafafa',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.92rem' }}>
                      {j.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Exp: {j.minimum_experience} yr(s) • Edu: {j.education}
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                      {j.required_skills?.slice(0, 3).map((s, idx) => (
                        <span key={idx} className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                          {s}
                        </span>
                      ))}
                      {j.required_skills?.length > 3 && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          +{j.required_skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/screening', { state: { selectedJobId: j.id } })}
                    className="btn btn-primary btn-sm"
                    style={{ flexShrink: 0, padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                  >
                    Screen
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Candidates */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)' }}>Candidate Pool</h2>
            <Link to="/candidates" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
              All Candidates
            </Link>
          </div>

          {recentCandidates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <Users size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <p>No candidate resumes uploaded yet.</p>
              <button
                onClick={() => navigate('/upload')}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '0.75rem' }}
              >
                Upload Resumes
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentCandidates.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#fafafa',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.92rem' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {c.email} • {c.experience} yr(s) exp
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                      {c.skills?.length || 0} skills detected
                    </div>
                  </div>

                  <div>
                    {c.latest_score !== null && c.latest_score !== undefined ? (
                      <ScoreBadge score={c.latest_score} status={c.latest_status} size="sm" />
                    ) : (
                      <span className="badge badge-gray" style={{ fontSize: '0.75rem' }}>
                        Not Screened
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
