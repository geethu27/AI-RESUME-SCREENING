import React from 'react';
import { Cpu, Database, RefreshCw, LogOut, User } from 'lucide-react';

export default function Navbar({ healthData, loadingHealth, onRefreshHealth, user, onLogout }) {
  const isServerUp = healthData?.server === 'online' || healthData?.server === 'running';
  const isDbConnected = healthData?.database === 'connected';
  const dbType = healthData?.database_type?.toUpperCase() || 'MYSQL';

  return (
    <header
      style={{
        background: '#ffffff',
        borderBottom: '1px solid var(--border)',
        padding: '0.875rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left side info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Workspace:</span>
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: '600',
              color: 'var(--text-main)',
              background: '#f1f5f9',
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
            }}
          >
            Talent Acquisition & Screening
          </span>
        </div>
      </div>

      {/* Right side system status pills & User info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* API Server status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: '500',
            background: isServerUp ? 'var(--success-bg)' : 'var(--danger-bg)',
            color: isServerUp ? 'var(--success-text)' : 'var(--danger-text)',
            border: `1px solid ${isServerUp ? 'var(--success-border)' : 'var(--danger-border)'}`,
          }}
        >
          <Cpu size={14} />
          <span>API: {isServerUp ? 'Online' : 'Offline'}</span>
        </div>

        {/* Database status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: '500',
            background: isDbConnected ? 'var(--success-bg)' : 'var(--warning-bg)',
            color: isDbConnected ? 'var(--success-text)' : 'var(--warning-text)',
            border: `1px solid ${isDbConnected ? 'var(--success-border)' : 'var(--warning-border)'}`,
          }}
        >
          <Database size={14} />
          <span>{dbType}: {isDbConnected ? 'Connected' : 'Disconnected'}</span>
        </div>

        {/* Refresh Health Button */}
        <button
          onClick={onRefreshHealth}
          disabled={loadingHealth}
          className="btn btn-secondary btn-sm"
          title="Refresh Backend & Database Health"
          style={{ padding: '0.35rem 0.65rem' }}
        >
          <RefreshCw size={14} className={loadingHealth ? 'spin' : ''} />
        </button>

        {/* Recruiter User & Logout */}
        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              paddingLeft: '0.75rem',
              borderLeft: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#334155',
              }}
            >
              <User size={15} color="#2563eb" />
              <span>{user.name || user.email}</span>
            </div>

            <button
              onClick={onLogout}
              className="btn btn-secondary btn-sm"
              title="Logout"
              style={{ padding: '0.3rem 0.5rem', color: '#dc2626', borderColor: '#fca5a5' }}
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
