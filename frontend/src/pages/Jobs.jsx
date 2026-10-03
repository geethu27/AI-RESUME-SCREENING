import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  PlusCircle,
  Eye,
  Trash2,
  Edit2,
  UploadCloud,
  Award,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { getJobs, createJob, updateJob, deleteJob } from '../services/api';
import Modal from '../components/Modal';

export default function Jobs() {
  const location = useLocation();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Job Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    required_skills: '',
    preferred_skills: '',
    minimum_experience: 1,
    education: 'B.Tech / B.E / MCA',
  });

  const fetchJobsList = async () => {
    setLoading(true);
    try {
      const res = await getJobs();
      if (res.success) {
        setJobs(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobsList();
    if (location.state?.openCreateModal) {
      setIsCreateOpen(true);
    }
  }, [location.state]);

  const handleFillSample = () => {
    setFormData({
      title: 'Python Full Stack Developer',
      description: 'We are seeking a talented Python Full Stack Developer to build robust, deterministic web applications. The role involves designing modular backend APIs with Flask and modern responsive frontends with React.',
      required_skills: 'Python, Flask, React, MySQL, HTML, CSS, JavaScript',
      preferred_skills: 'Git, REST API, Docker',
      minimum_experience: 1,
      education: 'B.Tech / B.E / MCA',
    });
  };

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setFormData({
      title: '',
      description: '',
      required_skills: '',
      preferred_skills: '',
      minimum_experience: 1,
      education: 'B.Tech / B.E / MCA',
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (job) => {
    setIsEditMode(true);
    setFormData({
      id: job.id,
      title: job.title,
      description: job.description,
      required_skills: (job.required_skills || []).join(', '),
      preferred_skills: (job.preferred_skills || []).join(', '),
      minimum_experience: job.minimum_experience,
      education: job.education,
    });
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isEditMode && formData.id) {
        const res = await updateJob(formData.id, formData);
        if (res.success) {
          setSuccessMsg('Job updated successfully');
          setIsCreateOpen(false);
          fetchJobsList();
        }
      } else {
        const res = await createJob(formData);
        if (res.success) {
          setSuccessMsg('Job created successfully in MySQL database');
          setIsCreateOpen(false);
          fetchJobsList();
        }
      }
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete the job position "${title}"?`)) {
      try {
        await deleteJob(id);
        setSuccessMsg(`Job "${title}" deleted.`);
        fetchJobsList();
        if (selectedJob?.id === id) setSelectedJob(null);
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err) {
        setError(err.message || 'Delete failed');
      }
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)' }}>
            Job Positions
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Define job roles, required & preferred skills, minimum experience, and education criteria.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <PlusCircle size={18} />
          <span>Create New Job</span>
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Jobs Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading jobs...
        </div>
      ) : jobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Briefcase size={48} style={{ margin: '0 auto 1rem', color: '#94a3b8' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            No Job Positions Yet
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
            Create your first job with title, required skills, and experience criteria to start screening resumes.
          </p>
          <button onClick={handleOpenCreate} className="btn btn-primary">
            Create Job Position
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {jobs.map((job) => (
            <div
              key={job.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.5rem',
                borderTop: '4px solid #2563eb',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    {job.title}
                  </h3>
                  <span className="badge badge-blue" style={{ fontSize: '0.75rem' }}>
                    {job.screened_count} screened
                  </span>
                </div>

                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    marginBottom: '1rem',
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {job.description}
                </p>

                <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.75rem', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                  <div><strong>Min Experience:</strong> {job.minimum_experience} year(s)</div>
                  <div><strong>Education:</strong> {job.education}</div>
                </div>

                {/* Required Skills Badges */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.35rem' }}>
                    Required Skills ({job.required_skills?.length || 0})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {job.required_skills?.slice(0, 5).map((s, idx) => (
                      <span key={idx} className="badge badge-green" style={{ fontSize: '0.72rem' }}>
                        {s}
                      </span>
                    ))}
                    {(job.required_skills?.length || 0) > 5 && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                        +{job.required_skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Preferred Skills */}
                {job.preferred_skills && job.preferred_skills.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.35rem' }}>
                      Preferred Skills ({job.preferred_skills.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {job.preferred_skills.slice(0, 4).map((s, idx) => (
                        <span key={idx} className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="btn btn-secondary btn-sm"
                    title="View Job Details"
                    style={{ padding: '0.4rem 0.6rem' }}
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(job)}
                    className="btn btn-secondary btn-sm"
                    title="Edit Job"
                    style={{ padding: '0.4rem 0.6rem' }}
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(job.id, job.title)}
                    className="btn btn-danger btn-sm"
                    title="Delete Job"
                    style={{ padding: '0.4rem 0.6rem' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => navigate('/screening', { state: { selectedJobId: job.id } })}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Award size={15} />
                    <span>Screen</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Page 3 Modal: Create / Edit Job */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={isEditMode ? 'Edit Job Position' : 'Create Job Position'}
        size="lg"
      >
        <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eff6ff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: '0.85rem', color: '#1e40af' }}>
            Need a test template? Prefill with full-stack requirements from specification:
          </div>
          <button
            type="button"
            onClick={handleFillSample}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            Load Sample Job
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Job Title *</label>
            <input
              type="text"
              required
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Python Full Stack Developer"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Job Description *</label>
            <textarea
              required
              className="form-textarea"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter full job duties, responsibilities, and qualifications..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Required Skills * (Weight: 60 points)</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.required_skills}
                onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
                placeholder="e.g. Python, Flask, React, MySQL, HTML, CSS"
              />
              <span className="form-help">Comma-separated list of mandatory skills.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Skills (Weight: 15 points)</label>
              <input
                type="text"
                className="form-input"
                value={formData.preferred_skills}
                onChange={(e) => setFormData({ ...formData, preferred_skills: e.target.value })}
                placeholder="e.g. Git, REST API, Docker"
              />
              <span className="form-help">Comma-separated list of bonus skills.</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Minimum Experience (Years) * (Weight: 15 points)</label>
              <input
                type="number"
                min="0"
                max="30"
                step="0.5"
                required
                className="form-input"
                value={formData.minimum_experience}
                onChange={(e) => setFormData({ ...formData, minimum_experience: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Required Education * (Weight: 10 points)</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                placeholder="e.g. B.Tech / B.E / MCA"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditMode ? 'Update Job Position' : 'Save Job Position in MySQL'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Page 4 Modal: Job Details View */}
      {selectedJob && (
        <Modal
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          title={selectedJob.title}
          size="lg"
        >
          <div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Minimum Experience</span>
                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{selectedJob.minimum_experience} Year(s)</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Education</span>
                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{selectedJob.education}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Screened Candidates</span>
                <strong style={{ fontSize: '1rem', color: '#2563eb' }}>{selectedJob.screened_count} Candidates</strong>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
                Description
              </h4>
              <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-wrap', background: '#fff', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '8px' }}>
                {selectedJob.description}
              </p>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                Required Skills (60 Points)
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {selectedJob.required_skills?.map((s, idx) => (
                  <span key={idx} className="badge badge-green" style={{ fontSize: '0.85rem', padding: '0.3rem 0.75rem' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                Preferred Skills (15 Points)
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {selectedJob.preferred_skills?.map((s, idx) => (
                  <span key={idx} className="badge badge-purple" style={{ fontSize: '0.85rem', padding: '0.3rem 0.75rem' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons as required by Section 5 Page 4 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              <button
                onClick={() => {
                  setSelectedJob(null);
                  navigate('/upload');
                }}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <UploadCloud size={16} />
                <span>Upload Resumes</span>
              </button>
              <button
                onClick={() => {
                  const jid = selectedJob.id;
                  setSelectedJob(null);
                  navigate('/screening', { state: { selectedJobId: jid } });
                }}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Award size={16} />
                <span>Screen Candidates</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
