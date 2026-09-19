import React from 'react';
import { ClarificationRequest } from '@/lib/agent/types';

interface ClarificationCardProps {
  clarification: ClarificationRequest;
  onSelectOption: (query: string) => void;
  disabled?: boolean;
}

export const ClarificationCard: React.FC<ClarificationCardProps> = ({
  clarification,
  onSelectOption,
  disabled = false,
}) => {
  return (
    <div
      style={{
        backgroundColor: 'rgba(56, 189, 248, 0.05)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '12px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div
          style={{
            padding: '0.25rem 0.6rem',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            color: 'var(--brand-blue)',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Clarification Needed
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            {clarification.question}
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {clarification.reason}
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '0.75rem',
          marginTop: '0.25rem',
        }}
      >
        {clarification.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => onSelectOption(opt.queryHint || opt.label)}
            disabled={disabled}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.35rem',
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-main)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease-in-out',
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.borderColor = 'var(--brand-blue)';
                e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.backgroundColor = 'var(--bg-card)';
              }
            }}
          >
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--brand-blue)' }}>
              {opt.label}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {opt.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
