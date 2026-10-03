import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  Award,
  ArrowRight,
  Shield,
  Trash2
} from 'lucide-react';
import { uploadResumes } from '../services/api';

export default function ResumeUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    setError(null);
    const files = Array.from(e.target.files || []);
    addFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setError(null);
    const files = Array.from(e.dataTransfer.files || []);
    addFiles(files);
  };

  const addFiles = (files) => {
    const validExtensions = ['pdf', 'docx'];
    const maxSizeBytes = 16 * 1024 * 1024; // 16 MB

    const validFiles = [];
    const rejected = [];

    for (const f of files) {
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (!validExtensions.includes(ext)) {
        rejected.push(`${f.name} (invalid extension .${ext})`);
        continue;
      }
      if (f.size === 0) {
        rejected.push(`${f.name} (empty 0-byte file)`);
        continue;
      }
      if (f.size > maxSizeBytes) {
        rejected.push(`${f.name} (exceeds 16 MB limit)`);
        continue;
      }
      validFiles.push(f);
    }

    if (rejected.length > 0) {
      setError(`Some files were rejected: ${rejected.join(', ')}`);
    }

    // Deduplicate by filename
    setSelectedFiles((prev) => {
      const existingNames = new Set(prev.map((file) => file.name));
      const combined = [...prev];
      for (const f of validFiles) {
        if (!existingNames.has(f.name)) {
          combined.push(f);
          existingNames.add(f.name);
        }
      }
      return combined;
    });
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one resume to upload.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setUploadResults(null);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('resumes', file);
    });

    try {
      const res = await uploadResumes(formData, (progress) => {
        setUploadProgress(progress);
      });

      if (res.success) {
        setUploadResults(res.data);
        setSelectedFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setError(res.message || 'Upload failed');
      }
    } catch (err) {
      setError(err.message || 'Upload failed. Check backend connection.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)' }}>
          Upload Candidate Resumes
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Upload single or multiple resumes in PDF or Word (.docx) format. Rule-based parsing extracts candidate details and skills deterministically.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: '2px dashed #93c5fd',
          borderRadius: '16px',
          padding: '3.5rem 2rem',
          textAlign: 'center',
          backgroundColor: '#f8fafc',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          marginBottom: '1.5rem',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: '#eff6ff',
            color: '#2563eb',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}
        >
          <UploadCloud size={32} />
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
          Choose resumes or drag & drop files here
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Supported formats: <strong>PDF (.pdf)</strong>, <strong>Word (.docx)</strong> • Max file size: 16 MB each
        </p>
        <span className="btn btn-secondary btn-sm" style={{ pointerEvents: 'none' }}>
          Browse Local Files
        </span>
      </div>

      {/* Selected Files Queue */}
      {selectedFiles.length > 0 && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)' }}>
              Selected Files Ready for Upload ({selectedFiles.length})
            </h3>
            <button
              onClick={() => setSelectedFiles([])}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem' }}
            >
              Clear All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', maxHeight: '250px', overflowY: 'auto' }}>
            {selectedFiles.map((f, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.65rem 1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileText size={18} color="#2563eb" />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '500', color: 'var(--text-main)' }}>
                      {f.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {(f.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          {uploading && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                <span>Uploading & Parsing...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: '#2563eb', transition: 'width 0.2s' }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              onClick={handleUploadSubmit}
              disabled={uploading}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <FileCheck size={18} />
              <span>{uploading ? 'Processing Resumes...' : `Upload & Extract (${selectedFiles.length})`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Upload Results & Extraction Summary */}
      {uploadResults && (
        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={22} color="#16a34a" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)' }}>
                Processed {uploadResults.processed?.length || 0} Resume(s) Successfully
              </h3>
            </div>

            <button
              onClick={() => navigate('/screening')}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>Go to Screening</span>
              <ArrowRight size={15} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {uploadResults.processed?.map((p, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  backgroundColor: '#f0fdf4',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <strong style={{ fontSize: '0.98rem', color: '#166534' }}>{p.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#15803d', marginTop: '0.2rem' }}>
                      {p.email || 'No email detected'} • {p.phone || 'No phone detected'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#15803d', marginTop: '0.2rem' }}>
                      <strong>Experience:</strong> {p.experience} yr(s) • <strong>Education:</strong> {p.education}
                    </div>
                  </div>

                  <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
                    {p.filename}
                  </span>
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase', color: '#166534', marginBottom: '0.35rem' }}>
                    Extracted Skills ({p.skills?.length || 0})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {p.skills?.map((s, sIdx) => (
                      <span key={sIdx} className="badge badge-blue" style={{ fontSize: '0.72rem' }}>
                        {s}
                      </span>
                    ))}
                    {(!p.skills || p.skills.length === 0) && (
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>No catalog skills detected</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {uploadResults.errors && uploadResults.errors.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#b91c1c', marginBottom: '0.35rem' }}>
                  Files with extraction errors:
                </h4>
                {uploadResults.errors.map((e, idx) => (
                  <div key={idx} style={{ fontSize: '0.8rem', color: '#dc2626', background: '#fef2f2', padding: '0.4rem 0.6rem', borderRadius: '4px', marginBottom: '0.25rem' }}>
                    <strong>{e.filename}:</strong> {e.error}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
