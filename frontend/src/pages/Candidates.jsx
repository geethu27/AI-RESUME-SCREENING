import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Eye,
  FileText,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Calendar,
  AlertCircle,
  Award
} from 'lucide-react';
import { getCandidates, getCandidate } from '../services/api';
import Modal from '../components/Modal';
import ScoreBadge from '../components/ScoreBadge';

export default function Candidates() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected candidate profile modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchCandidatesList = async () => {
    setLoading(true);
    try {
      const res = await getCandidates();
      if (res.success) {
        setCandidates(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch candidate list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidatesList();
  }, []);

  const handleOpenDetail = async (id) => {
    setLoadingDetail(true);
    try {
      const res = await getCandidate(id);
      if (res.success) {
        setSelectedCandidate(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve candidate profile');
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = (c.name || '').toLowerCase().includes(q);
    const emailMatch = (c.email || '').toLowerCase().includes(q);
    const skillsMatch = (c.skills || []).some((s) => s.toLowerCase().includes(q));
    const eduMatch = (c.education || '').toLowerCase().includes(q);
    return nameMatch || emailMatch || skillsMatch || eduMatch;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)' }}>
            Candidate Profiles
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Browse parsed candidates, extracted skills, contact information, and screening history.
          </p>
        </div>

        <button
          onClick={() => navigate('/upload')}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FileText size={18} />
          <span>Upload More Resumes</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Search size={18} color="#94a3b8" />
        <input
          type="text"
          placeholder="Search by candidate name, email, education, or skill (e.g. Python, React)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input"
          style={{ border: 'none', padding: '0.5rem', fontSize: '0.95rem' }}
        />
      </div>

      {/* Candidates List / Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading candidate records...
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
            <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              No Candidates Found
            </h3>
            <p style={{ maxWidth: '420px', margin: '0 auto 1.5rem', fontSize: '0.85rem' }}>
              Upload resumes in PDF or Word (.docx) format to extract candidate profiles.
            </p>
            <button onClick={() => navigate('/upload')} className="btn btn-primary btn-sm">
              Upload Resumes
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>Contact Info</th>
                <th>Experience</th>
                <th>Education</th>
                <th>Extracted Skills</th>
                <th>Screening Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ID: #{c.id}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                      {c.email}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {c.phone}
                    </div>
                  </td>

                  <td>
                    <span style={{ fontWeight: '600', color: '#0f172a' }}>
                      {c.experience} yr(s)
                    </span>
                  </td>

                  <td>
                    <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                      {c.education}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', maxWidth: '240px' }}>
                      {c.skills?.slice(0, 4).map((s, idx) => (
                        <span key={idx} className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                          {s}
                        </span>
                      ))}
                      {(c.skills?.length || 0) > 4 && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          +{c.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    {c.latest_score !== null && c.latest_score !== undefined ? (
                      <ScoreBadge score={c.latest_score} status={c.latest_status} size="sm" />
                    ) : (
                      <span className="badge badge-gray" style={{ fontSize: '0.75rem' }}>
                        Not Screened
                      </span>
                    )}
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenDetail(c.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Eye size={14} />
                      <span>View Profile</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Candidate Profile Details Modal */}
      {selectedCandidate && (
        <Modal
          isOpen={!!selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          title={`Candidate Profile: ${selectedCandidate.name}`}
          size="lg"
        >
          <div>
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
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Email Address</span>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{selectedCandidate.email}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Phone Number</span>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{selectedCandidate.phone}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Work Experience</span>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{selectedCandidate.experience} Year(s)</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Education Degree</span>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{selectedCandidate.education}</div>
              </div>
            </div>

            {/* Extracted Skills Catalog */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>
                Extracted Technical Skills ({selectedCandidate.skills?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {selectedCandidate.skills?.map((s, idx) => (
                  <span key={idx} className="badge badge-blue" style={{ fontSize: '0.8rem', padding: '0.25rem 0.65rem' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Screening History */}
            {selectedCandidate.screenings && selectedCandidate.screenings.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>
                  Screening History
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedCandidate.screenings.map((sc) => (
                    <div
                      key={sc.id}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <strong>{sc.job_title}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Screened on {sc.screened_at}
                        </div>
                      </div>
                      <ScoreBadge score={sc.total_score} status={sc.status} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resume Text */}
            {selectedCandidate.resumes && selectedCandidate.resumes.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.4rem' }}>
                  Extracted Resume Text ({selectedCandidate.resumes[0].filename})
                </h4>
                <div
                  style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border)',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    color: '#334155',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                  }}
                >
                  {selectedCandidate.resumes[0].extracted_text}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button onClick={() => setSelectedCandidate(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
