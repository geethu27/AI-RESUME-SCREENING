import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Award,
  Filter,
  ArrowUpDown,
  Search,
  Eye,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  FileText,
  User,
  Briefcase,
  Layers,
  Download
} from 'lucide-react';
import {
  getJobs,
  runScreening,
  getScreeningResults,
  getCandidateScreeningDetail
} from '../services/api';
import ScoreBadge from '../components/ScoreBadge';
import Modal from '../components/Modal';

export default function Screening() {
  const location = useLocation();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [screeningActive, setScreeningActive] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Configurable thresholds (Section 5 Page 6 requirement)
  const [shortlistThreshold, setShortlistThreshold] = useState(80);
  const [reviewThreshold, setReviewThreshold] = useState(60);
  const [showConfig, setShowConfig] = useState(false);

  // Filtering & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('score'); // 'score' | 'name' | 'experience'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  // Candidate Details Modal state (Page 7 Candidate Details)
  const [candidateModalData, setCandidateModalData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // 1. Load all jobs
  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await getJobs();
        if (res.success && res.data.length > 0) {
          setJobs(res.data);
          const initialJobId = location.state?.selectedJobId || res.data[0].id;
          setSelectedJobId(String(initialJobId));
        }
      } catch (err) {
        setError(err.message || 'Failed to load jobs list');
      }
    };
    loadJobs();
  }, [location.state]);

  // 2. Fetch screening results when job selection changes
  useEffect(() => {
    if (selectedJobId) {
      const current = jobs.find((j) => String(j.id) === String(selectedJobId));
      setSelectedJob(current || null);
      fetchResults(selectedJobId);
    }
  }, [selectedJobId, jobs]);

  const fetchResults = async (jobId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getScreeningResults(jobId, {
        sort_by: sortBy,
        order: sortOrder,
        status: statusFilter,
      });
      if (res.success) {
        setResults(res.data.results || []);
        if (res.data.job) setSelectedJob(res.data.job);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve screening results');
    } finally {
      setLoading(false);
    }
  };

  // 3. Trigger Screening Execution
  const handleRunScreening = async () => {
    if (!selectedJobId) return;
    setScreeningActive(true);
    setError(null);
    try {
      const res = await runScreening(selectedJobId, {
        shortlist_threshold: Number(shortlistThreshold),
        review_threshold: Number(reviewThreshold),
      });
      if (res.success) {
        setResults(res.data.results || []);
        setSuccessMsg(`Screened ${res.data.results?.length || 0} candidate(s) successfully!`);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      setError(err.message || 'Screening failed. Please make sure resumes have been uploaded.');
    } finally {
      setScreeningActive(false);
    }
  };

  // 4. View Candidate Details (Page 7)
  const handleViewCandidate = async (candidateId) => {
    setLoadingDetail(true);
    try {
      const res = await getCandidateScreeningDetail(selectedJobId, candidateId);
      if (res.success) {
        setCandidateModalData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load candidate details');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Dynamic status evaluation based on current thresholds
  const getEvaluatedStatus = (score) => {
    const s = Number(score) || 0;
    if (s >= shortlistThreshold) return 'Shortlisted';
    if (s >= reviewThreshold) return 'Review';
    return 'Not Shortlisted';
  };

  // Local filtering & sorting
  const processedResults = results
    .filter((cand) => {
      const evalStatus = getEvaluatedStatus(cand.total_score);
      if (statusFilter !== 'all' && evalStatus.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = (cand.candidate_name || '').toLowerCase().includes(query);
        const emailMatch = (cand.email || '').toLowerCase().includes(query);
        const skillsMatch = (cand.matched_skills || []).some((s) => s.toLowerCase().includes(query));
        return nameMatch || emailMatch || skillsMatch;
      }
      return true;
    })
    .sort((a, b) => {
      let comp = 0;
      if (sortBy === 'score') comp = Number(a.total_score) - Number(b.total_score);
      else if (sortBy === 'name') comp = (a.candidate_name || '').localeCompare(b.candidate_name || '');
      else if (sortBy === 'experience') comp = Number(a.experience || 0) - Number(b.experience || 0);
      return sortOrder === 'desc' ? -comp : comp;
    });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)' }}>
            Screening & Ranking Results
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Deterministic rule-based matching: Required Skills (60 pts) • Preferred (15 pts) • Experience (15 pts) • Education (10 pts).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Sliders size={16} />
            <span>Config Thresholds</span>
          </button>

          <button
            onClick={handleRunScreening}
            disabled={screeningActive || !selectedJobId}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Award size={18} />
            <span>{screeningActive ? 'Running Screening...' : 'Screen Candidates'}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Threshold Config Panel (Section 5 Page 6 requirement) */}
      {showConfig && (
        <div
          className="card"
          style={{
            padding: '1.25rem',
            marginBottom: '1.5rem',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sliders size={16} /> Configurable Scoring Thresholds
            </h4>
            <span style={{ fontSize: '0.8rem', color: '#3b82f6' }}>
              Dynamic Cutoff Rules
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                <strong style={{ color: '#166534' }}>Shortlisted Cutoff:</strong>
                <span style={{ fontWeight: '700' }}>≥ {shortlistThreshold} points</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="1"
                value={shortlistThreshold}
                onChange={(e) => setShortlistThreshold(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                <strong style={{ color: '#b45309' }}>Review Cutoff:</strong>
                <span style={{ fontWeight: '700' }}>≥ {reviewThreshold} points</span>
              </div>
              <input
                type="range"
                min="30"
                max="75"
                step="1"
                value={reviewThreshold}
                onChange={(e) => setReviewThreshold(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Job Selection & Filter Bar */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Job selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '300px' }}>
          <Briefcase size={18} color="#2563eb" />
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Selected Job Position
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="form-input"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.9rem', fontWeight: '600' }}
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} (Exp: {j.minimum_experience}y)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search candidate or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem', paddingBlock: '0.45rem', fontSize: '0.85rem' }}
          />
        </div>

        {/* Sort & Order Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="form-input"
            style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
          >
            <option value="score">Score</option>
            <option value="name">Candidate Name</option>
            <option value="experience">Experience</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="btn btn-secondary btn-sm"
            title="Toggle sort direction"
            style={{ padding: '0.4rem 0.6rem' }}
          >
            <ArrowUpDown size={14} />
            <span>{sortOrder.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {[
          { key: 'all', label: `All (${results.length})` },
          { key: 'shortlisted', label: `Shortlisted (≥ ${shortlistThreshold} pts)` },
          { key: 'review', label: `Review (≥ ${reviewThreshold} pts)` },
          { key: 'not shortlisted', label: 'Not Shortlisted' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className="btn btn-sm"
            style={{
              backgroundColor: statusFilter === tab.key ? '#2563eb' : '#ffffff',
              color: statusFilter === tab.key ? '#ffffff' : '#64748b',
              border: '1px solid',
              borderColor: statusFilter === tab.key ? '#2563eb' : 'var(--border)',
              fontWeight: statusFilter === tab.key ? '600' : '500',
              padding: '0.35rem 0.85rem',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Screening Table (Section 5 Page 6 requirement) */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Retrieving screening results...
          </div>
        ) : processedResults.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
            <Award size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              No Candidates Evaluated for this Job
            </h3>
            <p style={{ maxWidth: '420px', margin: '0 auto 1.5rem', fontSize: '0.85rem' }}>
              Ensure you have uploaded resumes in the Upload page, then click "Screen Candidates" above to calculate rule-based scores.
            </p>
            <button onClick={handleRunScreening} className="btn btn-primary btn-sm">
              Run Rule-Based Screening
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Rank</th>
                <th>Candidate</th>
                <th>Match Score</th>
                <th>Skills Matched</th>
                <th>Skills Missing</th>
                <th>Experience</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {processedResults.map((item, idx) => {
                const evalStatus = getEvaluatedStatus(item.total_score);
                return (
                  <tr key={item.id || idx}>
                    <td style={{ fontWeight: '700', color: '#64748b' }}>
                      #{item.rank || idx + 1}
                    </td>

                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                        {item.candidate_name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {item.email}
                      </div>
                    </td>

                    <td>
                      <ScoreBadge score={item.total_score} status={evalStatus} />
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', maxWidth: '240px' }}>
                        {item.matched_skills?.slice(0, 4).map((s, sIdx) => (
                          <span key={sIdx} className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                            {s} ✓
                          </span>
                        ))}
                        {(item.matched_skills?.length || 0) > 4 && (
                          <span style={{ fontSize: '0.7rem', color: '#16a34a' }}>
                            +{item.matched_skills.length - 4}
                          </span>
                        )}
                        {(!item.matched_skills || item.matched_skills.length === 0) && (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>None</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', maxWidth: '220px' }}>
                        {item.missing_skills?.slice(0, 3).map((s, sIdx) => (
                          <span key={sIdx} className="badge badge-red" style={{ fontSize: '0.7rem' }}>
                            {s} ✗
                          </span>
                        ))}
                        {(item.missing_skills?.length || 0) > 3 && (
                          <span style={{ fontSize: '0.7rem', color: '#dc2626' }}>
                            +{item.missing_skills.length - 3}
                          </span>
                        )}
                        {(!item.missing_skills || item.missing_skills.length === 0) && (
                          <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>No gaps</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                        {item.experience} yr(s)
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {item.education}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          evalStatus === 'Shortlisted'
                            ? 'badge-green'
                            : evalStatus === 'Review'
                            ? 'badge-amber'
                            : 'badge-red'
                        }`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {evalStatus}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleViewCandidate(item.candidate_id)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Eye size={14} />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Page 7 Modal: Candidate Evaluation Details */}
      {candidateModalData && (
        <Modal
          isOpen={!!candidateModalData}
          onClose={() => setCandidateModalData(null)}
          title={`Candidate Evaluation: ${candidateModalData.candidate?.name}`}
          size="lg"
        >
          <div>
            {/* Candidate Summary Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                backgroundColor: '#f8fafc',
                padding: '1.25rem',
                borderRadius: '10px',
                marginBottom: '1.5rem',
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Candidate Email</span>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{candidateModalData.candidate?.email}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Phone Number</span>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{candidateModalData.candidate?.phone}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Detected Experience</span>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{candidateModalData.candidate?.experience} year(s)</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Detected Education</span>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{candidateModalData.candidate?.education}</div>
              </div>
            </div>

            {/* Score Breakdown Cards (Transparent Rule-Based Breakdown) */}
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.75rem', color: '#1e293b' }}>
              Rule-Based Scoring Breakdown (Max 100 Points)
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.85rem', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#166534', display: 'block' }}>Required Skills (60)</span>
                <strong style={{ fontSize: '1.25rem', color: '#15803d' }}>
                  {candidateModalData.scoring?.required_score}
                </strong>
              </div>

              <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '0.85rem', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#6d28d9', display: 'block' }}>Preferred Skills (15)</span>
                <strong style={{ fontSize: '1.25rem', color: '#7c3aed' }}>
                  {candidateModalData.scoring?.preferred_score}
                </strong>
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.85rem', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#1e40af', display: 'block' }}>Experience (15)</span>
                <strong style={{ fontSize: '1.25rem', color: '#2563eb' }}>
                  {candidateModalData.scoring?.experience_score}
                </strong>
              </div>

              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '0.85rem', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#92400e', display: 'block' }}>Education (10)</span>
                <strong style={{ fontSize: '1.25rem', color: '#b45309' }}>
                  {candidateModalData.scoring?.education_score}
                </strong>
              </div>

              <div style={{ background: '#0f172a', border: '1px solid #334155', padding: '0.85rem', borderRadius: '8px', textAlign: 'center', color: '#ffffff' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Total Match Score</span>
                <strong style={{ fontSize: '1.35rem', color: '#38bdf8' }}>
                  {candidateModalData.scoring?.total_score}
                </strong>
              </div>
            </div>

            {/* Matched vs Missing Skills */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem', background: '#f0fdf4' }}>
                <h5 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#166534', marginBottom: '0.5rem' }}>
                  Matched Skills ({candidateModalData.matching?.all_matched_skills?.length || 0})
                </h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {candidateModalData.matching?.all_matched_skills?.map((s, idx) => (
                    <span key={idx} className="badge badge-green" style={{ fontSize: '0.75rem' }}>
                      {s} ✓
                    </span>
                  ))}
                  {(!candidateModalData.matching?.all_matched_skills || candidateModalData.matching?.all_matched_skills?.length === 0) && (
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>None</span>
                  )}
                </div>
              </div>

              <div style={{ border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', background: '#fef2f2' }}>
                <h5 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#b91c1c', marginBottom: '0.5rem' }}>
                  Missing Skills ({candidateModalData.matching?.all_missing_skills?.length || 0})
                </h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {candidateModalData.matching?.all_missing_skills?.map((s, idx) => (
                    <span key={idx} className="badge badge-red" style={{ fontSize: '0.75rem' }}>
                      {s} ✗
                    </span>
                  ))}
                  {(!candidateModalData.matching?.all_missing_skills || candidateModalData.matching?.all_missing_skills?.length === 0) && (
                    <span style={{ fontSize: '0.8rem', color: '#16a34a' }}>All skills fulfilled!</span>
                  )}
                </div>
              </div>
            </div>

            {/* Resume Text Viewer */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <h5 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>
                  Extracted Resume Text
                </h5>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  File: {candidateModalData.candidate?.resume_filename || 'Uploaded Resume'}
                </span>
              </div>
              <div
                style={{
                  maxHeight: '220px',
                  overflowY: 'auto',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border)',
                  padding: '1rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  color: '#334155',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.5',
                  fontFamily: 'monospace',
                }}
              >
                {candidateModalData.candidate?.resume_text || 'No text content available.'}
              </div>
            </div>

            {/* Recruiter Decision footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Decision Recommendation: </span>
                <span className={`badge ${candidateModalData.status === 'Shortlisted' ? 'badge-green' : candidateModalData.status === 'Review' ? 'badge-amber' : 'badge-red'}`}>
                  {candidateModalData.status}
                </span>
              </div>

              <button onClick={() => setCandidateModalData(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
