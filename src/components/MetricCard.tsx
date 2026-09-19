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
  const exactFullValue = result.unit === 'INR' ? `₹${result.value.toLocaleString('en-IN')}` : null;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {formattedTitle}
        </span>
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

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
        <span
          style={{
            fontSize: '1.875rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {formattedValue}
        </span>
        {exactFullValue && exactFullValue !== formattedValue && (
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            ({exactFullValue})
          </span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-dim)',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '0.5rem',
          marginTop: '0.25rem',
        }}
      >
        <span>Source: <strong>{result.sourceBoard === 'deals' ? 'Deals Board' : result.sourceBoard === 'work_orders' ? 'Work Orders' : 'Cross-Board'}</strong></span>
        <span>{result.recordsConsidered} records considered</span>
      </div>
    </div>
  );
};
