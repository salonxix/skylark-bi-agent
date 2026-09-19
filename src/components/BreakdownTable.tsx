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
      className="theme-surface animate-card-fade"
      style={{
        padding: '1.25rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top accent bar */}
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <h4
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {formattedTitle}
          </h4>
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
              }}
            >
              {result.period}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {entries.map(([category, val]) => {
            const share = total > 0 ? (val / total) * 100 : 0;
            return (
              <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8125rem',
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{category}</span>
                  <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                    <span
                      style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        fontWeight: 700,
                        color: 'var(--accent-light)',
                        fontSize: '0.85rem',
                      }}
                    >
                      {formatMetricValue(val, result.unit)}
                    </span>
                    <span
                      style={{
                        color: 'var(--text-dim)',
                        fontSize: '0.725rem',
                        minWidth: '42px',
                        textAlign: 'right',
                        fontWeight: 500,
                      }}
                    >
                      {share.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Progress track */}
                <div
                  style={{
                    height: '5px',
                    backgroundColor: 'var(--bg-input)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.max(share, 1.5)}%`,
                      background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                      borderRadius: '3px',
                      transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
              </div>
            );
          })}
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
          paddingTop: '0.75rem',
          marginTop: '1.25rem',
        }}
      >
        <span>
          Total Distribution:{' '}
          <strong style={{ color: 'var(--text-main)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
            {formatMetricValue(total, result.unit)}
          </strong>
        </span>
        <span>{result.recordsConsidered} records</span>
      </div>
    </div>
  );
};
