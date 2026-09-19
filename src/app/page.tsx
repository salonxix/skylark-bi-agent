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

const STARTER_QUESTIONS = [
  "How's our pipeline looking for the energy sector this quarter?",
  'Show me our open deal pipeline by sector.',
  'How much has been billed versus collected?',
  'Which work orders have billing or collection risk?',
  'Give me a leadership update.',
];

export default function ExecutiveDashboard() {
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLastRefreshed(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
        setLastRefreshed(new Date().toLocaleTimeString());
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
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-secondary)',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                letterSpacing: '-0.01em',
              }}
            >
              Skylark BI Agent
            </h1>
            <div className="live-indicator" title="Connected to live Monday.com GraphQL API v2 (2026-07)">
              <div className="live-dot" />
              <span>Monday Live Sync</span>
            </div>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Live business intelligence from Monday.com
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {lastRefreshed && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              Updated: {lastRefreshed}
            </span>
          )}
          <a
            href="/api/health"
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
            }}
          >
            API Health
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          maxWidth: '1000px',
          width: '100%',
          margin: '0 auto',
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {/* Suggested Starter Questions */}
        {messages.length === 0 && (
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Executive Intelligence Hub
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Query live pipeline deals, operational work orders, billing, collections, and sector distributions.
                Arithmetic is computed deterministically by verified rules.
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Suggested Inquiries:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {STARTER_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSubmit(q)}
                    disabled={loading}
                    style={{
                      padding: '0.5rem 0.85rem',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-muted)',
                      fontSize: '0.8125rem',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.borderColor = 'var(--brand-blue)';
                        e.currentTarget.style.color = 'var(--brand-blue)';
                        e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                      }
                    }}
                  >
                    💬 {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Conversation Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* User Bubble */}
              {msg.sender === 'user' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div
                    style={{
                      maxWidth: '80%',
                      backgroundColor: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '12px 12px 2px 12px',
                      padding: '0.85rem 1.25rem',
                      color: 'var(--text-main)',
                      fontSize: '0.9375rem',
                      fontWeight: 500,
                    }}
                  >
                    {msg.text}
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textAlign: 'right', marginTop: '0.35rem' }}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              )}

              {/* Agent Bubble */}
              {msg.sender === 'agent' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '100%' }}>
                  {/* Error Case */}
                  {msg.error && (
                    <div
                      style={{
                        padding: '1rem',
                        backgroundColor: 'rgba(244, 63, 94, 0.08)',
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                        borderRadius: '10px',
                        color: 'var(--accent-rose)',
                        fontSize: '0.875rem',
                      }}
                    >
                      <strong>Query Notice:</strong> {msg.error}
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

                  {/* Standard Answer Case */}
                  {!msg.error && !msg.clarification && (
                    <ExecutiveAnswer
                      answer={msg.text || ''}
                      results={msg.results}
                      dataQuality={msg.dataQuality}
                    />
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                color: 'var(--brand-blue)',
                fontSize: '0.875rem',
              }}
            >
              <div className="live-dot" style={{ width: '10px', height: '10px' }} />
              <span>Querying Monday.com live boards and executing deterministic BI calculations...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Persistent Query Input Footer */}
      <footer
        style={{
          position: 'sticky',
          bottom: 0,
          backgroundColor: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-subtle)',
          padding: '1rem 1.5rem',
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            display: 'flex',
            gap: '0.75rem',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything (e.g. 'Show open pipeline by sector' or 'How much has been billed vs collected?')..."
            disabled={loading}
            aria-label="Ask a business intelligence question"
            style={{
              flex: 1,
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-strong)',
              borderRadius: '8px',
              padding: '0.85rem 1.15rem',
              color: 'var(--text-main)',
              fontSize: '0.9375rem',
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
          />
          <button
            onClick={() => handleSubmit(inputQuery)}
            disabled={loading || !inputQuery.trim()}
            style={{
              padding: '0.85rem 1.5rem',
              backgroundColor: loading || !inputQuery.trim() ? '#1e293b' : '#0284c7',
              color: loading || !inputQuery.trim() ? '#64748b' : '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9375rem',
              cursor: loading || !inputQuery.trim() ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {loading ? 'Analyzing...' : 'Ask Agent'}
          </button>
        </div>
      </footer>
    </div>
  );
}
