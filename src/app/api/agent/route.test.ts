import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';

describe('POST /api/agent - Full Architectural Pipeline Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      MONDAY_API_TOKEN: 'mock_token',
      AI_API_KEY: 'mock_ai_key',
      MONDAY_DEALS_BOARD_ID: '5031418651',
      MONDAY_WORK_ORDERS_BOARD_ID: '5031418671',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('1. Successfully executes full flow: planner -> executor -> narrator', async () => {
    // 1. Mock AI Planner fetch
    const mockPlannerResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  type: 'query',
                  querySpec: {
                    dataset: 'deals',
                    metric: 'total_deal_value',
                    sector: 'Mining',
                    dateRange: { period: 'all' },
                  },
                }),
              },
            ],
          },
        },
      ],
    };

    // 2. Mock Monday Deals Board fetch
    const mockMondayResponse = {
      data: {
        boards: [
          {
            id: '5031418651',
            name: 'Deals Board',
            items_page: {
              cursor: null,
              items: [
                {
                  id: '1',
                  name: 'Mining Project X',
                  column_values: [
                    { id: 'color_mm7bsqa2', text: 'Mining', value: null },
                    { id: 'numeric_mm7b65d9', text: '750000', value: '750000' },
                  ],
                },
              ],
            },
          },
        ],
      },
    };

    // 3. Mock AI Narrator fetch
    const mockNarratorResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: 'The total pipeline value for Mining is ₹7,50,000 across 1 deal.',
              },
            ],
          },
        },
      ],
    };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPlannerResponse,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockMondayResponse,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockNarratorResponse,
      } as Response);

    const req = new Request('http://localhost:3000/api/agent', {
      method: 'POST',
      body: JSON.stringify({ message: 'What is our pipeline in mining?' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.querySpec.metric).toBe('total_deal_value');
    expect(json.results[0].value).toBe(750000);
    expect(json.results[0].unit).toBe('INR');
    expect(json.answer).toContain('7,50,000');
    expect(json.clarification).toBeNull();
  });

  it('2. Ambiguous query triggers structured clarification without executing Monday or Narrator', async () => {
    const req = new Request('http://localhost:3000/api/agent', {
      method: 'POST',
      body: JSON.stringify({ message: 'What was our total revenue this quarter?' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.clarification).toBeDefined();
    expect(json.clarification.question).toContain('Which financial metric');
    expect(json.clarification.options.length).toBeGreaterThanOrEqual(3);
    expect(json.results).toEqual([]);
  });

  it('3. Planner failure on unrecognized prompt returns safe error', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'AI Internal Error',
      json: async () => ({}),
    } as unknown as Response);

    const req = new Request('http://localhost:3000/api/agent', {
      method: 'POST',
      body: JSON.stringify({ message: 'Unparseable gibberish query xyz999' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.code).toBe('AGENT_ERROR');
  });

  it('4. Narrator failure triggers deterministic fallback explanation grounded in BIResult', async () => {
    // 1. Mock Planner
    const mockPlannerResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  type: 'query',
                  querySpec: {
                    dataset: 'work_orders',
                    metric: 'billed_value_excl_gst',
                    sector: 'Renewables',
                  },
                }),
              },
            ],
          },
        },
      ],
    };

    // 2. Mock Monday Work Orders
    const mockMondayResponse = {
      data: {
        boards: [
          {
            id: '5031418671',
            name: 'Work Orders Board',
            items_page: {
              cursor: null,
              items: [
                {
                  id: '10',
                  name: 'Solar Plant Survey',
                  column_values: [
                    { id: 'color_mm7be3tw', text: 'Renewables', value: null },
                    { id: 'numeric_mm7bexxg', text: '350000', value: '350000' },
                  ],
                },
              ],
            },
          },
        ],
      },
    };

    // 3. Mock Narrator failure (e.g. rate limited or connection failure)
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPlannerResponse,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockMondayResponse,
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({}),
      } as unknown as Response);

    const req = new Request('http://localhost:3000/api/agent', {
      method: 'POST',
      body: JSON.stringify({ message: 'What is our billed value in renewables?' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.results[0].value).toBe(350000);
    // Fallback explanation must still accurately report the deterministic calculation
    expect(json.answer).toContain('3,50,000');
  });

  it('5. Monday API failure returns 502 Bad Gateway', async () => {
    // 1. Mock Planner
    const mockPlannerResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  type: 'query',
                  querySpec: {
                    dataset: 'deals',
                    metric: 'total_deal_value',
                  },
                }),
              },
            ],
          },
        },
      ],
    };

    // 2. Mock Monday failure
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPlannerResponse,
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({ error_message: 'Monday GraphQL rate limit exceeded' }),
      } as unknown as Response);

    const req = new Request('http://localhost:3000/api/agent', {
      method: 'POST',
      body: JSON.stringify({ message: 'What is our total deals pipeline?' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(502);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.code).toBe('MONDAY_API_ERROR');
  });

  it('6. Missing AI configuration returns 503 Config Error on unhandled queries', async () => {
    delete process.env.AI_API_KEY;

    const req = new Request('http://localhost:3000/api/agent', {
      method: 'POST',
      body: JSON.stringify({ message: 'Completely unhandled freeform prompt' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(503);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.code).toBe('CONFIG_ERROR');
  });

  it('7. Confirms deterministic BIResult strictly grounds the output', async () => {
    // Mock Monday response with multiple values
    const mockMondayResponse = {
      data: {
        boards: [
          {
            id: '5031418671',
            name: 'Work Orders Board',
            items_page: {
              cursor: null,
              items: [
                {
                  id: '1',
                  name: 'Survey 1',
                  column_values: [
                    { id: 'numeric_mm7b7qat', text: '120000', value: '120000' },
                  ],
                },
                {
                  id: '2',
                  name: 'Survey 2',
                  column_values: [
                    { id: 'numeric_mm7b7qat', text: '80000', value: '80000' },
                  ],
                },
              ],
            },
          },
        ],
      },
    };

    // Planner returns collected_amount_incl_gst
    const mockPlannerResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  type: 'query',
                  querySpec: {
                    dataset: 'work_orders',
                    metric: 'collected_amount_incl_gst',
                  },
                }),
              },
            ],
          },
        },
      ],
    };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPlannerResponse,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockMondayResponse,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: { parts: [{ text: 'Total collected amount is ₹2,00,000 across 2 work orders.' }] },
            },
          ],
        }),
      } as Response);

    const req = new Request('http://localhost:3000/api/agent', {
      method: 'POST',
      body: JSON.stringify({ message: 'What is our total collected cash?' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    // Verify arithmetic was computed deterministically by our engine (120000 + 80000 = 200000)
    expect(json.results[0].value).toBe(200000);
    expect(json.results[0].recordsConsidered).toBe(2);
    expect(json.results[0].metric).toBe('collected_amount_incl_gst');
  });
});
