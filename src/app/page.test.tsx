import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ExecutiveDashboard from './page';

describe('ExecutiveDashboard Frontend Component', () => {
  beforeEach(() => {
    // Mock scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders header, live sync indicator, theme mode switches, and executive query cards', () => {
    render(<ExecutiveDashboard />);

    expect(screen.getByText('Skylark BI Agent')).toBeInTheDocument();
    expect(screen.getByText('Monday Live Sync')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /FOUNDER/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /OPERATIONS/i })).toBeInTheDocument();
    expect(screen.getByText('Ask the business anything.')).toBeInTheDocument();
    expect(screen.getByText(/How's our pipeline looking for the energy sector this quarter\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Show me our open deal pipeline by sector/i)).toBeInTheDocument();
    expect(screen.getByText(/How much has been billed versus collected\?/i)).toBeInTheDocument();
  });

  it('toggles theme between Founder and Operations modes', () => {
    render(<ExecutiveDashboard />);

    const founderBtn = screen.getByRole('radio', { name: /FOUNDER/i });
    const opsBtn = screen.getByRole('radio', { name: /OPERATIONS/i });

    expect(founderBtn).toHaveAttribute('aria-checked', 'true');
    expect(opsBtn).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(opsBtn);

    expect(founderBtn).toHaveAttribute('aria-checked', 'false');
    expect(opsBtn).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement.getAttribute('data-theme')).toBe('operations');

    fireEvent.click(founderBtn);
    expect(founderBtn).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement.getAttribute('data-theme')).toBe('founder');
  });

  it('submits a suggested question and renders the executive briefing with Key Signals and KPI cards', async () => {
    const mockApiResponse = {
      success: true,
      answer: 'Total pipeline in Mining is ₹7,50,000 across 1 deal.',
      querySpec: {
        dataset: 'deals',
        metric: 'total_deal_value',
      },
      results: [
        {
          metric: 'total_deal_value',
          value: 750000,
          unit: 'INR',
          sourceBoard: 'deals',
          period: 'All Time',
          recordsConsidered: 1,
          recordsExcluded: 0,
          caveats: [],
        },
      ],
      dataQuality: [
        {
          boardId: '5031418651',
          boardName: 'Deals Board',
          totalRecords: 1,
          validRecords: 1,
          recordsWithIssues: 0,
          exclusions: [],
          inconsistencies: [],
        },
      ],
      clarification: null,
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    } as Response);

    render(<ExecutiveDashboard />);

    const suggestBtn = screen.getByText(/Show me our open deal pipeline by sector/i);
    fireEvent.click(suggestBtn);

    // Verify user query block appears
    expect(screen.getByText('Show me our open deal pipeline by sector.')).toBeInTheDocument();
    expect(screen.getByText('Executive Query')).toBeInTheDocument();

    // Verify answer appears
    await waitFor(() => {
      expect(screen.getByText('Executive Intelligence Briefing')).toBeInTheDocument();
      expect(screen.getByText(/Total pipeline in Mining is ₹7,50,000 across 1 deal/i)).toBeInTheDocument();
      expect(screen.getByText('₹7.50 L')).toBeInTheDocument();
      expect(screen.getByText(/1 records considered/i)).toBeInTheDocument();
    });
  });

  it('renders clarification prompts and continues conversation on option click', async () => {
    const mockClarificationResponse = {
      success: true,
      clarification: {
        question: 'Which financial metric would you like to measure for revenue?',
        reason: 'Work Orders data contains multiple financial stages.',
        options: [
          {
            label: 'Billed Value (Invoiced, Excl. GST)',
            description: 'Total value of invoices raised to clients excluding GST.',
            queryHint: 'Show billed value excluding GST',
          },
          {
            label: 'Collected Amount (Cash in Bank, Incl. GST)',
            description: 'Actual customer payments collected in bank.',
            queryHint: 'Show collected amount',
          },
        ],
      },
    };

    const mockFollowUpResponse = {
      success: true,
      answer: 'Total billed value is ₹3,66,260.',
      results: [
        {
          metric: 'billed_value_excl_gst',
          value: 366260,
          unit: 'INR',
          sourceBoard: 'work_orders',
          period: 'All Time',
          recordsConsidered: 1,
          recordsExcluded: 0,
        },
      ],
      clarification: null,
    };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockClarificationResponse,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockFollowUpResponse,
      } as Response);

    render(<ExecutiveDashboard />);

    const input = screen.getByPlaceholderText(/Ask about pipeline, revenue/i);
    const submitBtn = screen.getByRole('button', { name: /Ask Agent/i });

    fireEvent.change(input, { target: { value: 'What is our revenue?' } });
    fireEvent.click(submitBtn);

    // Verify clarification question appears
    await waitFor(() => {
      expect(screen.getByText('Which financial metric would you like to measure for revenue?')).toBeInTheDocument();
      expect(screen.getByText('Billed Value (Invoiced, Excl. GST)')).toBeInTheDocument();
    });

    // Click clarification option
    const optionBtn = screen.getByText('Billed Value (Invoiced, Excl. GST)');
    fireEvent.click(optionBtn);

    // Verify follow-up answer appears
    await waitFor(() => {
      expect(screen.getByText('Total billed value is ₹3,66,260.')).toBeInTheDocument();
    });
  });

  it('renders safe error messages when the API returns an error', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({
        success: false,
        error: 'Monday API service temporarily unavailable',
        code: 'MONDAY_API_ERROR',
      }),
    } as Response);

    render(<ExecutiveDashboard />);

    const input = screen.getByPlaceholderText(/Ask about pipeline, revenue/i);
    const submitBtn = screen.getByRole('button', { name: /Ask Agent/i });

    fireEvent.change(input, { target: { value: 'Show pipeline' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Monday API service temporarily unavailable/i)).toBeInTheDocument();
    });
  });

  it('renders collapsible data quality and exclusion notes', async () => {
    const mockResponseWithCaveats = {
      success: true,
      answer: 'Pipeline value is ₹5,00,000.',
      results: [
        {
          metric: 'total_deal_value',
          value: 500000,
          unit: 'INR',
          sourceBoard: 'deals',
          period: 'All Time',
          recordsConsidered: 1,
          recordsExcluded: 1,
          caveats: ['1 deal had missing dealValue and was excluded'],
        },
      ],
      dataQuality: [
        {
          boardId: '5031418651',
          boardName: 'Deals Board',
          totalRecords: 2,
          validRecords: 1,
          recordsWithIssues: 1,
          exclusions: [
            {
              recordId: '99',
              reason: 'Missing dealValue',
              metricImpact: 'Excluded from total deal value aggregations',
            },
          ],
          inconsistencies: [],
        },
      ],
      clarification: null,
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponseWithCaveats,
    } as Response);

    render(<ExecutiveDashboard />);

    const input = screen.getByPlaceholderText(/Ask about pipeline, revenue/i);
    const submitBtn = screen.getByRole('button', { name: /Ask Agent/i });

    fireEvent.change(input, { target: { value: 'Show pipeline' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Data Quality & Source Transparency/i)).toBeInTheDocument();
    });

    // Click disclosure button to expand
    const disclosureBtn = screen.getByText(/▼ View Details/i);
    fireEvent.click(disclosureBtn);

    expect(screen.getByText(/1 deal had missing dealValue and was excluded/i)).toBeInTheDocument();
    expect(screen.getByText(/Record #99: Missing dealValue/i)).toBeInTheDocument();
  });
});
