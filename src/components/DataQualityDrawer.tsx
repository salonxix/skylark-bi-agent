import React, { useState } from 'react';
import { DataQualityReport } from '@/lib/bi/types';

interface DataQualityDrawerProps {
  reports?: DataQualityReport[];
  caveats?: string[];
}

export const DataQualityDrawer: React.FC<DataQualityDrawerProps> = ({ reports, caveats = [] }) => {
  const [isOpen, setIsOpen] = useState(false);

  if ((!reports || reports.length === 0) && caveats.length === 0) {
    return null;
  }

  const allExclusions = reports?.flatMap((r) => r.exclusions) || [];
  const allInconsistencies = reports?.flatMap((r) => r.inconsistencies) || [];
  const totalIssues = (reports?.reduce((sum, r) => sum + r.recordsWithIssues, 0) || 0) + caveats.length;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card-subtle)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '10px',
        overflow: 'hidden',
        marginTop: '0.5rem',
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          backgroundColor: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background-color 150ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem' }}>🛡️</span>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Data Quality & Source Transparency</span>
          {totalIssues > 0 && (
            <span
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--status-amber)',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                fontSize: '0.675rem',
                fontWeight: 700,
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              {totalIssues} {totalIssues === 1 ? 'note' : 'notes'}
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
          {isOpen ? '▲ Hide Details' : '▼ View Details'}
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            padding: '1rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-input)',
          }}
        >
          {/* Query Caveats */}
          {caveats.length > 0 && (
            <div>
              <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Query Caveats & Scope:
              </strong>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {caveats.map((c, idx) => (
                  <li key={idx} style={{ color: 'var(--text-secondary)' }}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Board Diagnostics */}
          {reports && reports.length > 0 && (
            <div>
              <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Live Board Diagnostics:
              </strong>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
                {reports.map((r) => (
                  <div
                    key={r.boardId}
                    style={{
                      padding: '0.6rem 0.8rem',
                      backgroundColor: 'var(--bg-card)',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                      {r.boardName} <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>#{r.boardId}</span>
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      Total: <span style={{ color: 'var(--text-secondary)' }}>{r.totalRecords}</span> | Valid: <span style={{ color: 'var(--status-emerald)' }}>{r.validRecords}</span> | Flagged: <span style={{ color: r.recordsWithIssues > 0 ? 'var(--status-amber)' : 'var(--text-dim)' }}>{r.recordsWithIssues}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exclusions */}
          {allExclusions.length > 0 && (
            <div>
              <strong style={{ color: 'var(--status-amber)', display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Metric Exclusions ({allExclusions.length}):
              </strong>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {allExclusions.slice(0, 5).map((ex, idx) => (
                  <li key={idx} style={{ color: 'var(--text-secondary)' }}>
                    Record #{ex.recordId}: {ex.reason} ({ex.metricImpact})
                  </li>
                ))}
                {allExclusions.length > 5 && (
                  <li style={{ color: 'var(--text-dim)' }}>...and {allExclusions.length - 5} more records</li>
                )}
              </ul>
            </div>
          )}

          {/* Inconsistencies */}
          {allInconsistencies.length > 0 && (
            <div>
              <strong style={{ color: 'var(--status-rose)', display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Detected Inconsistencies ({allInconsistencies.length}):
              </strong>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {allInconsistencies.slice(0, 5).map((inc, idx) => (
                  <li key={idx} style={{ color: 'var(--text-secondary)' }}>
                    [{inc.recordName} #{inc.recordId}]: {inc.reason}
                  </li>
                ))}
                {allInconsistencies.length > 5 && (
                  <li style={{ color: 'var(--text-dim)' }}>...and {allInconsistencies.length - 5} more records</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
