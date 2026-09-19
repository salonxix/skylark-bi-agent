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
      className="theme-surface animate-card-fade"
      style={{
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        border: '1px solid var(--border-medium)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Accent Line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
        <div
          style={{
            padding: '0.3rem 0.65rem',
            backgroundColor: 'var(--accent-badge-bg)',
            color: 'var(--accent-light)',
            border: '1px solid var(--accent-badge-border)',
            borderRadius: '6px',
            fontSize: '0.725rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            whiteSpace: 'nowrap',
          }}
        >
          Clarification Needed
        </div>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem', lineHeight: 1.3 }}>
            {clarification.question}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {clarification.reason}
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '0.85rem',
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
              gap: '0.4rem',
              padding: '1rem',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-medium)',
              borderRadius: '8px',
              color: 'var(--text-main)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              transition: 'all 200ms ease-in-out',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px var(--accent-glow-subtle)';
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.currentTarget.style.borderColor = 'var(--border-medium)';
                e.currentTarget.style.backgroundColor = 'var(--bg-input)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-badge-bg)',
                  color: 'var(--accent-light)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                }}
              >
                {idx + 1}
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent-light)' }}>
                {opt.label}
              </span>
            </div>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.45, paddingLeft: '1.65rem' }}>
              {opt.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
