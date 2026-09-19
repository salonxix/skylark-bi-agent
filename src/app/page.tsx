'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AgentResponse, ClarificationRequest } from '@/lib/agent/types';
import { BIResult, DataQualityReport } from '@/lib/bi/types';
import { ExecutiveAnswer } from '@/components/ExecutiveAnswer';
import { ClarificationCard } from '@/components/ClarificationCard';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text?: string;
  results?: BIResult[];
  dataQuality?: DataQualityReport[];
  clarification?: ClarificationRequest | null;
  error?: string;
  timestamp: string;
}

interface ExecutiveQueryCard {
  category: string;
  icon: string;
  question: string;
  description: string;
}

const EXECUTIVE_QUERY_CARDS: ExecutiveQueryCard[] = [
  {
    category: 'Pipeline',
    icon: '⚡',
    question: "How's our pipeline looking for the energy sector this quarter?",
    description: 'Filter open energy sector deals and total pipeline value',
  },
  {
    category: 'Sales',
    icon: '📊',
    question: 'Show me our open deal pipeline by sector.',
    description: 'Dimensional breakdown across all industry sectors',
  },
  {
    category: 'Cash & Billing',
    icon: '💰',
    question: 'How much has been billed versus collected?',
    description: 'Compare total billed value against actual collections',
  },
  {
    category: 'Operations',
    icon: '⚙️',
    question: 'Which work orders have billing or collection risk?',
    description: 'Inspect open work orders with outstanding unbilled or uncollected amounts',
  },
  {
    category: 'Leadership',
    icon: '🏛️',
    question: 'Give me a leadership update.',
    description: 'High-level synthesis of sales pipeline and operational fulfillment',
  },
];

export default function ExecutiveDashboard() {
  const [theme, setTheme] = useState<'founder' | 'operations'>('founder');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleNewChat = () => {
    setMessages([]);
    setInputQuery('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSubmit = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || loading) return;

    setInputQuery('');

    const userMessageId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = (await res.json()) as AgentResponse;

      if (!res.ok || !data.success) {
        const errorMsg = data.success === false ? data.error : `HTTP Error ${res.status}`;
        setMessages((prev) => [
          ...prev,
          {
            id: `agent-err-${Date.now()}`,
            sender: 'agent',
            error: errorMsg,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `agent-${Date.now()}`,
            sender: 'agent',
            text: data.answer,
            results: data.results,
            dataQuality: data.dataQuality,
            clarification: data.clarification,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error communicating with agent';
      setMessages((prev) => [
        ...prev,
        {
          id: `agent-err-${Date.now()}`,
          sender: 'agent',
          error: msg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(inputQuery);
    }
  };

  return (
    <div
      data-theme={theme}
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-main)',
        overflow: 'hidden',
      }}
    >
      {/* Left Sidebar (ChatGPT-Style) */}
      <aside
        style={{
          width: sidebarOpen ? '260px' : '0px',
          minWidth: sidebarOpen ? '260px' : '0px',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.85rem' }}>
          {/* Top Brand & New Chat Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.25rem 0.25rem 0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#060911',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  boxShadow: '0 0 10px var(--accent-glow)',
                }}
              >
                S
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                Skylark BI
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '4px',
              }}
            >
              ✕
            </button>
          </div>

          <button
            onClick={handleNewChat}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.65rem 0.85rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            <span style={{ fontSize: '1rem', color: 'var(--accent-light)' }}>＋</span>
            <span>New Inquiry</span>
          </button>

          {/* Preset Prompts Section */}
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span
              style={{
                fontSize: '0.675rem',
                fontWeight: 700,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '0.25rem 0.5rem',
              }}
            >
              Suggested Topics
            </span>
            {EXECUTIVE_QUERY_CARDS.map((card, idx) => (
              <button
                key={idx}
                onClick={() => handleSubmit(card.question)}
                disabled={loading}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.5rem 0.65rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.775rem',
                  fontWeight: 500,
                  textAlign: 'left',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 150ms ease',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span>{card.icon}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {card.category}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Footer (Live Board Status & Health) */}
        <div
          style={{
            padding: '0.85rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
              <span className="live-dot" />
              <strong style={{ color: 'var(--text-secondary)' }}>Monday.com Live Sync</strong>
            </div>
            <div>Deals #5031418651</div>
            <div>Work Orders #5031418671</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.35rem' }}>
            <span style={{ fontSize: '0.675rem', color: 'var(--text-dim)' }}>
              {lastRefreshed ? `Synced ${lastRefreshed}` : 'Syncing...'}
            </span>
            <a
              href="/api/health"
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '0.675rem',
                color: 'var(--text-muted)',
                textDecoration: 'underline',
              }}
            >
              API Health
            </a>
          </div>
        </div>
      </aside>

      {/* Main Chat Interface */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          backgroundColor: 'var(--bg-chat)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Header Navigation */}
        <header
          style={{
            height: '56px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            padding: '0 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 30,
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  color: 'var(--text-muted)',
                  padding: '0.35rem 0.55rem',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                ☰
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Skylark BI Agent
              </h1>
              <div className="live-indicator" title="Connected to live Monday.com GraphQL API v2 (2026-07)">
                <div className="live-dot" />
                <span>Monday Live Sync</span>
              </div>
            </div>
          </div>

          {/* Theme switcher */}
          <div className="mode-switch-container" role="radiogroup" aria-label="Theme Mode Selection">
            <button
              type="button"
              role="radio"
              aria-checked={theme === 'founder'}
              className={`mode-switch-btn ${theme === 'founder' ? 'active' : ''}`}
              onClick={() => setTheme('founder')}
            >
              <span>⚡</span> FOUNDER
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={theme === 'operations'}
              className={`mode-switch-btn ${theme === 'operations' ? 'active' : ''}`}
              onClick={() => setTheme('operations')}
            >
              <span>⚙️</span> OPERATIONS
            </button>
          </div>
        </header>

        {/* Scrollable Conversation / Main Chat Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem 1rem 8rem',
          }}
        >
          <div
            style={{
              maxWidth: '860px',
              width: '100%',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.75rem',
            }}
          >
            {/* Empty / Welcome State (ChatGPT Hero Style) */}
            {messages.length === 0 && (
              <div
                className="animate-card-fade"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  paddingTop: '2.5rem',
                  gap: '1.75rem',
                }}
              >
                {/* Glowing Center Emblem */}
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#060911',
                    fontWeight: 900,
                    fontSize: '1.75rem',
                    boxShadow: '0 0 24px var(--accent-glow)',
                  }}
                >
                  S
                </div>

                <div>
                  <h2
                    style={{
                      fontSize: '1.75rem',
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      letterSpacing: '-0.02em',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Ask the business anything.
                  </h2>
                  <p
                    style={{
                      fontSize: '0.9rem',
                      color: 'var(--text-muted)',
                      maxWidth: '520px',
                      lineHeight: 1.5,
                    }}
                  >
                    Deterministic business intelligence querying live Monday.com operational work orders and sales deals.
                  </p>
                </div>

                {/* 2x2 Starter Prompt Cards Grid (ChatGPT Style) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '0.85rem',
                    width: '100%',
                    marginTop: '0.5rem',
                  }}
                >
                  {EXECUTIVE_QUERY_CARDS.map((card, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSubmit(card.question)}
                      disabled={loading}
                      style={{
                        padding: '1rem 1.15rem',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                        textAlign: 'left',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.currentTarget.style.borderColor = 'var(--accent-primary)';
                          e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.currentTarget.style.borderColor = 'var(--border-subtle)';
                          e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ fontSize: '0.95rem' }}>{card.icon}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {card.category}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.35 }}>
                        {card.question}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation Stream */}
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* User Message Row */}
                {msg.sender === 'user' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div
                      className="animate-card-fade"
                      style={{
                        maxWidth: '85%',
                        backgroundColor: 'var(--bg-user-msg)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '16px 16px 4px 16px',
                        padding: '0.85rem 1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.3rem',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' }}>
                          Executive Query
                        </span>
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-main)', lineHeight: 1.45 }}>
                        {msg.text}
                      </div>
                      <div style={{ fontSize: '0.675rem', color: 'var(--text-dim)', textAlign: 'right' }}>
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                )}

                {/* Agent Response Row */}
                {msg.sender === 'agent' && (
                  <div style={{ display: 'flex', gap: '0.85rem', width: '100%' }}>
                    {/* Avatar */}
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#060911',
                        fontWeight: 900,
                        fontSize: '0.9rem',
                        flexShrink: 0,
                        marginTop: '0.2rem',
                      }}
                    >
                      S
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {/* Error Case */}
                      {msg.error && (
                        <div
                          className="animate-card-fade"
                          style={{
                            padding: '1rem',
                            backgroundColor: 'rgba(244, 63, 94, 0.08)',
                            border: '1px solid rgba(244, 63, 94, 0.3)',
                            borderRadius: '10px',
                            color: 'var(--status-rose)',
                            fontSize: '0.85rem',
                          }}
                        >
                          <strong>Executive System Notice:</strong> {msg.error}
                        </div>
                      )}

                      {/* Clarification Case */}
                      {msg.clarification && (
                        <ClarificationCard
                          clarification={msg.clarification}
                          onSelectOption={(opt) => handleSubmit(opt)}
                          disabled={loading}
                        />
                      )}

                      {/* Standard Executive Answer */}
                      {!msg.error && !msg.clarification && (
                        <ExecutiveAnswer
                          answer={msg.text || ''}
                          results={msg.results}
                          dataQuality={msg.dataQuality}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading Scanner Indicator (ChatGPT Style) */}
            {loading && (
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'var(--accent-badge-bg)',
                    border: '1px solid var(--accent-badge-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-light)',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                  }}
                >
                  S
                </div>
                <div
                  className="theme-surface animate-card-fade"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.75rem 1.15rem',
                    borderRadius: '10px',
                  }}
                >
                  <div className="live-dot" />
                  <span style={{ fontSize: '0.825rem', color: 'var(--accent-light)', fontWeight: 600 }}>
                    Scanning live Monday.com boards and computing deterministic BI metrics...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Floating ChatGPT-Style Input Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, var(--bg-chat) 75%, transparent 100%)',
            padding: '1.25rem 1rem 0.85rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 35,
          }}
        >
          <div
            style={{
              maxWidth: '860px',
              width: '100%',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-medium)',
              borderRadius: '16px',
              padding: '0.45rem 0.65rem 0.45rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
              transition: 'border-color 200ms ease, box-shadow 200ms ease',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about pipeline, revenue, billing, collections, work orders, sectors..."
              disabled={loading}
              aria-label="Ask about pipeline, revenue, billing, collections, work orders, sectors"
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
            <button
              onClick={() => handleSubmit(inputQuery)}
              disabled={loading || !inputQuery.trim()}
              aria-label="Ask Agent"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: loading || !inputQuery.trim() ? 'var(--bg-surface)' : 'var(--accent-btn-bg)',
                color: loading || !inputQuery.trim() ? 'var(--text-dim)' : '#060911',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading || !inputQuery.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 200ms ease',
                fontWeight: 800,
                fontSize: '1rem',
                boxShadow: loading || !inputQuery.trim() ? 'none' : '0 2px 10px var(--accent-glow)',
              }}
            >
              ↑
            </button>
          </div>

          <div
            style={{
              fontSize: '0.675rem',
              color: 'var(--text-dim)',
              marginTop: '0.5rem',
              textAlign: 'center',
            }}
          >
            Skylark BI Agent performs verified deterministic calculations directly on Monday.com Live Boards #5031418651 & #5031418671.
          </div>
        </div>
      </div>
    </div>
  );
}
