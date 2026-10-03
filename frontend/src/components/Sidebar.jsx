import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  UploadCloud,
  Award,
  Users,
  Settings,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/jobs', label: 'Jobs', icon: Briefcase },
  { path: '/upload', label: 'Upload Resumes', icon: UploadCloud },
  { path: '/screening', label: 'Screening Results', icon: Award },
  { path: '/candidates', label: 'Candidates', icon: Users },
  { path: '/settings', label: 'Settings & Rules', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div
        style={{
          padding: '1.5rem',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
          }}
        >
          <Cpu size={22} />
        </div>
        <div>
          <div
            style={{
              fontSize: '1.05rem',
              fontWeight: '700',
              letterSpacing: '-0.02em',
              color: '#f8fafc',
            }}
          >
            Resume Screening
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Rule-Based Screening System
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: '1.25rem 0.75rem', flex: 1 }}>
        <div
          style={{
            fontSize: '0.7rem',
            fontWeight: '600',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '0 0.75rem 0.6rem 0.75rem',
          }}
        >
          Recruiter Menu
        </div>

        <ul style={{ listStyle: 'none' }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path} style={{ marginBottom: '0.35rem' }}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.7rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? '600' : '500',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    backgroundColor: isActive ? '#1e293b' : 'transparent',
                    borderLeft: isActive
                      ? '3px solid #3b82f6'
                      : '3px solid transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  })}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Deterministic Rule Engine Specifications Card */}
      <div
        style={{
          padding: '1rem',
          margin: '1rem',
          background: '#1e293b',
          borderRadius: '10px',
          border: '1px solid #334155',
          fontSize: '0.75rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#60a5fa',
            fontWeight: '600',
            marginBottom: '0.5rem',
          }}
        >
          <ShieldCheck size={14} />
          <span>Rule-Based Engine</span>
        </div>
        <div style={{ color: '#cbd5e1', lineHeight: '1.5' }}>
          <div>• 100% Deterministic (No AI/ML)</div>
          <div>• Required Skills: 60 pts</div>
          <div>• Preferred Skills: 15 pts</div>
          <div>• Experience: 15 pts | Edu: 10 pts</div>
        </div>
      </div>
    </aside>
  );
}
