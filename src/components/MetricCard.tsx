import React from 'react';
import { BIResult } from '@/lib/bi/types';

interface MetricCardProps {
  result: BIResult<number>;
}

export function formatMetricValue(value: number, unit: string): string {
  if (unit === 'INR') {
    if (Math.abs(value) >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(value) >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  }
  if (unit === 'count') {
    return value.toLocaleString('en-IN');
  }
  if (unit === 'percentage') {
    return `${value.toFixed(1)}%`;
  }
  return `${value.toLocaleString('en-IN')} ${unit}`;
}

export const MetricCard: React.FC<MetricCardProps> = ({ result }) => {
  const formattedTitle = result.metric
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const formattedValue = formatMetricValue(result.value, result.unit);
  const exactFullValue = result.unit === 'INR' && Math.abs(result.value) >= 100000 ? `₹${result.value.toLocaleString('en-IN')}` : null;

  const boardLabel = result.sourceBoard === 'deals'
    ? 'Deals Board'
    : result.sourceBoard === 'work_orders'
    ? 'Work Orders'
    : 'Cross-Board';

  const recordContext = result.recordsConsidered !== undefined
    ? `${result.recordsConsidered} records considered`
    : 'Live dataset';

  return (
    <div
      className="theme-surface animate-card-fade"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
        minHeight: '140px',
      }}
    >
      {/* Top subtle accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
          opacity: 0.85,
        }}
      />

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {formattedTitle}
          </span>
          {result.period && (
            <span
              style={{
                fontSize: '0.7rem',
                padding: '0.2rem 0.5rem',
                backgroundColor: 'var(--accent-badge-bg)',
                color: 'var(--accent-light)',
                border: '1px solid var(--accent-badge-border)',
                borderRadius: '4px',
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
            >
              {result.period}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <span
            style={{
              fontSize: '1.9rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {formattedValue}
          </span>
          {exactFullValue && (
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-dim)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              }}
            >
              ({exactFullValue})
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.725rem',
          color: 'var(--text-dim)',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '0.65rem',
          marginTop: '0.5rem',
        }}
      >
        <span style={{ color: 'var(--text-secondary)' }}>
          Source: <strong style={{ color: 'var(--text-main)' }}>{boardLabel}</strong>
        </span>
        <span>{recordContext}</span>
      </div>
    </div>
  );
};
