import React from 'react';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '3rem 1.5rem',
      background: '#ffffff',
      borderRadius: 'var(--radius-lg)',
      border: '1px dashed var(--border)',
    }}>
      {Icon && (
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          backgroundColor: '#eff6ff',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem auto',
        }}>
          <Icon size={26} />
        </div>
      )}
      <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
