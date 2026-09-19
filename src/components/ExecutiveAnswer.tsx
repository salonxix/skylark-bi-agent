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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Metric KPI Cards (if any numeric totals) */}
      {numericResults.length > 0 && (
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
      )}

      {/* Dimensional Breakdown Tables (if any record distributions) */}
      {recordResults.length > 0 && (
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
      )}

      {/* Executive Explanation Narrative */}
      {answer && (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '1.25rem',
            lineHeight: 1.65,
            fontSize: '0.9375rem',
            color: 'var(--text-main)',
            whiteSpace: 'pre-line',
          }}
        >
          {answer}
        </div>
      )}

      {/* Data Quality & Assumptions Transparency Disclosure */}
      <DataQualityDrawer reports={dataQuality} caveats={allCaveats} />
    </div>
  );
};
