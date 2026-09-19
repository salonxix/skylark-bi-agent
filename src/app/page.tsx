'use client';

import { useState } from 'react';

interface BoardDiagnostic {
  boardId: string;
  boardName: string;
  itemCount: number;
  fetchedAt: string;
  sampleItems: Array<{ id: string; name: string }>;
}

interface DiagnosticData {
  success: boolean;
  timestamp: string;
  deals?: BoardDiagnostic;
  workOrders?: BoardDiagnostic;
  error?: string;
}

export default function HomePage() {
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/monday/diagnostics');
      const json = (await res.json()) as DiagnosticData;
      if (!res.ok || !json.success) {
        setError(json.error || `Error: HTTP ${res.status}`);
      }
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch diagnostic data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '2.5rem 1rem',
      }}
    >
      <div
        style={{
          maxWidth: '850px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {/* Header */}
        <header
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              padding: '0.35rem 0.85rem',
              marginBottom: '1rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(79, 172, 254, 0.12)',
              color: 'var(--accent-blue)',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Phase 1: Monday.com Read-Only Integration
          </div>

          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              marginBottom: '0.75rem',
              background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Skylark Monday BI Agent Diagnostic Center
          </h1>

          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Live read-only sync for Monday.com Deals & Work Orders boards with cursor-based pagination.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={runDiagnostics}
              disabled={loading}
              style={{
                padding: '0.7rem 1.4rem',
                backgroundColor: loading ? '#3b82f688' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              {loading ? 'Fetching Boards...' : 'Run Live Diagnostic'}
            </button>

            <a
              href="/api/health"
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '0.7rem 1.4rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                borderRadius: '8px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Health Check API
            </a>

            <a
              href="/api/monday/deals"
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '0.7rem 1.4rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                borderRadius: '8px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Raw Deals API
            </a>

            <a
              href="/api/monday/work-orders"
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '0.7rem 1.4rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                borderRadius: '8px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Raw Work Orders API
            </a>
          </div>
        </header>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              color: '#f87171',
            }}
          >
            <strong>Diagnostic Error:</strong> {error}
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Make sure <code>MONDAY_API_TOKEN</code> is configured in <code>.env.local</code>.
            </div>
          </div>
        )}

        {/* Results */}
        {data && data.success && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {/* Deals Card */}
            {data.deals && (
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Deals Board</h2>
                  <span
                    style={{
                      backgroundColor: 'rgba(0, 242, 254, 0.15)',
                      color: 'var(--accent-cyan)',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    ID: {data.deals.boardId}
                  </span>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Items</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {data.deals.itemCount} items
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Last Fetched</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {new Date(data.deals.fetchedAt).toLocaleString()}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Sample Items (First {data.deals.sampleItems.length})
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {data.deals.sampleItems.map((item) => (
                      <li
                        key={item.id}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <span style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }}>#{item.id}</span>
                        {item.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Work Orders Card */}
            {data.workOrders && (
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Work Orders Board</h2>
                  <span
                    style={{
                      backgroundColor: 'rgba(79, 172, 254, 0.15)',
                      color: 'var(--accent-blue)',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    ID: {data.workOrders.boardId}
                  </span>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Items</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {data.workOrders.itemCount} items
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Last Fetched</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {new Date(data.workOrders.fetchedAt).toLocaleString()}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Sample Items (First {data.workOrders.sampleItems.length})
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {data.workOrders.sampleItems.map((item) => (
                      <li
                        key={item.id}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <span style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }}>#{item.id}</span>
                        {item.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
