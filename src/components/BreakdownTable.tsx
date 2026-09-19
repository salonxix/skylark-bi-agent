import React from 'react';
import { BIResult } from '@/lib/bi/types';
import { formatMetricValue } from './MetricCard';

interface BreakdownTableProps {
  result: BIResult<Record<string, number>>;
}

export const BreakdownTable: React.FC<BreakdownTableProps> = ({ result }) => {
  const entries = Object.entries(result.value).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, val]) => sum + val, 0);

  const formattedTitle = result.metric
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '1.25rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)' }}>
          {formattedTitle}
        </h4>
        <span
          style={{
            fontSize: '0.75rem',
            padding: '0.2rem 0.5rem',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            color: 'var(--brand-blue)',
            borderRadius: '4px',
            fontWeight: 500,
          }}
        >
          {result.period}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {entries.map(([category, val]) => {
          const share = total > 0 ? (val / total) * 100 : 0;
          return (
            <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8125rem',
                }}
              >
                <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{category}</span>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--brand-cyan)' }}>
                    {formatMetricValue(val, result.unit)}
                  </span>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', minWidth: '40px', textAlign: 'right' }}>
                    {share.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Share bar */}
              <div
                style={{
                  height: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.max(share, 2)}%`,
                    backgroundColor: 'var(--brand-blue)',
                    borderRadius: '2px',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-dim)',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '0.75rem',
          marginTop: '1rem',
        }}
      >
        <span>Total: <strong>{formatMetricValue(total, result.unit)}</strong></span>
        <span>{result.recordsConsidered} records</span>
      </div>
    </div>
  );
};
