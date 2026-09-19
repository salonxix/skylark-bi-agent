import React from 'react';
import { BIResult, DataQualityReport } from '@/lib/bi/types';
import { MetricCard } from './MetricCard';
import { BreakdownTable } from './BreakdownTable';
import { DataQualityDrawer } from './DataQualityDrawer';

interface ExecutiveAnswerProps {
  answer: string;
  results?: BIResult[];
  dataQuality?: DataQualityReport[];
}

export const ExecutiveAnswer: React.FC<ExecutiveAnswerProps> = ({
  answer,
  results = [],
  dataQuality = [],
}) => {
  const numericResults = results.filter((r): r is BIResult<number> => typeof r.value === 'number');
  const recordResults = results.filter((r): r is BIResult<Record<string, number>> => typeof r.value === 'object' && r.value !== null);

  const allCaveats = results.flatMap((r) => r.caveats || []);

  return (
    <div
      className="theme-surface animate-card-fade"
      style={{
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--border-medium)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
      }}
    >
      {/* Top Accent Gradient Header Line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
        }}
      />

      {/* Briefing Header Tag */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              padding: '0.2rem 0.55rem',
              backgroundColor: 'var(--accent-badge-bg)',
              color: 'var(--accent-light)',
              border: '1px solid var(--accent-badge-border)',
              borderRadius: '4px',
              fontSize: '0.675rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Executive Intelligence Briefing
          </div>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
          Grounded on Live Monday Schema
        </span>
      </div>

      {/* 1. EXECUTIVE SUMMARY (AI Narrative) */}
      {answer && (
        <div>
          <div
            style={{
              fontSize: '0.725rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.5rem',
            }}
          >
            Executive Summary
          </div>
          <div
            style={{
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '1.15rem 1.35rem',
              lineHeight: 1.65,
              fontSize: '0.9375rem',
              color: 'var(--text-main)',
              whiteSpace: 'pre-line',
            }}
          >
            {answer}
          </div>
        </div>
      )}

      {/* 2. KEY SIGNALS (KPI Cards) */}
      {numericResults.length > 0 && (
        <div>
          <div
            style={{
              fontSize: '0.725rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.65rem',
            }}
          >
            Key Signals & Metrics
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
            {numericResults.map((result, idx) => (
              <MetricCard key={idx} result={result} />
            ))}
          </div>
        </div>
      )}

      {/* 3. BREAKDOWN (Dimensional Distributions) */}
      {recordResults.length > 0 && (
        <div>
          <div
            style={{
              fontSize: '0.725rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.65rem',
            }}
          >
            Dimensional Breakdown
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1rem',
            }}
          >
            {recordResults.map((result, idx) => (
              <BreakdownTable key={idx} result={result} />
            ))}
          </div>
        </div>
      )}

      {/* 4. DATA QUALITY & SOURCE TRANSPARENCY */}
      <DataQualityDrawer reports={dataQuality} caveats={allCaveats} />
    </div>
  );
};
