import React from 'react';

export default function ScoreBadge({ score, status, showLabel = true, size = 'md' }) {
  const numScore = typeof score === 'number' ? score : parseFloat(score) || 0;

  // Determine status and color styling
  let resolvedStatus = status;
  if (!resolvedStatus) {
    if (numScore >= 80) resolvedStatus = 'Shortlisted';
    else if (numScore >= 60) resolvedStatus = 'Review';
    else resolvedStatus = 'Not Shortlisted';
  }

  let badgeClass = 'badge-red';
  if (resolvedStatus === 'Shortlisted') {
    badgeClass = 'badge-green';
  } else if (resolvedStatus === 'Review') {
    badgeClass = 'badge-amber';
  } else {
    badgeClass = 'badge-red';
  }

  const fontSize = size === 'lg' ? '0.95rem' : size === 'sm' ? '0.75rem' : '0.85rem';
  const padding = size === 'lg' ? '0.35rem 0.85rem' : size === 'sm' ? '0.15rem 0.5rem' : '0.25rem 0.65rem';

  return (
    <span
      className={`badge ${badgeClass}`}
      style={{
        fontSize,
        padding,
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
      }}
    >
      <span>{numScore.toFixed(1)} / 100</span>
      {showLabel && <span>• {resolvedStatus}</span>}
    </span>
  );
}
