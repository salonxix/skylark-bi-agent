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
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        overflow: 'hidden',
        marginTop: '0.75rem',
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.6rem 0.85rem',
          backgroundColor: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          fontSize: '0.8125rem',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🛡️ Data Quality & Assumptions</span>
          {totalIssues > 0 && (
            <span
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--accent-amber)',
                padding: '0.1rem 0.4rem',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 600,
              }}
            >
              {totalIssues} {totalIssues === 1 ? 'note' : 'notes'}
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          {isOpen ? '▲ Hide Details' : '▼ View Details'}
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            padding: '0.85rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
          }}
        >
          {/* Caveats */}
          {caveats.length > 0 && (
            <div>
              <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                Query Caveats:
              </strong>
              <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {caveats.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Board Quality Summaries */}
          {reports && reports.length > 0 && (
            <div>
              <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                Board Record Diagnostics:
              </strong>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', margin: '0.4rem 0' }}>
                {reports.map((r) => (
                  <div
                    key={r.boardId}
                    style={{
                      padding: '0.4rem 0.6rem',
                      backgroundColor: 'var(--bg-card)',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div><strong>{r.boardName}</strong></div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Total: {r.totalRecords} | Clean: {r.validRecords} | Flagged: {r.recordsWithIssues}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exclusions */}
          {allExclusions.length > 0 && (
            <div>
              <strong style={{ color: 'var(--accent-amber)', display: 'block', marginBottom: '0.25rem' }}>
                Metric Exclusions ({allExclusions.length}):
              </strong>
              <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {allExclusions.slice(0, 5).map((ex, idx) => (
                  <li key={idx}>
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
              <strong style={{ color: 'var(--accent-rose)', display: 'block', marginBottom: '0.25rem' }}>
                Detected Data Inconsistencies ({allInconsistencies.length}):
              </strong>
              <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {allInconsistencies.slice(0, 5).map((inc, idx) => (
                  <li key={idx}>
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
