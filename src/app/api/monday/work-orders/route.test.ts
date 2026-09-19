import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';

describe('GET /api/monday/work-orders', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      MONDAY_API_TOKEN: 'mock_token',
      MONDAY_WORK_ORDERS_BOARD_ID: '5031418671',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('returns structured JSON with 200 OK on successful fetch', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          boards: [
            {
              id: '5031418671',
              name: 'Work Orders Board',
              items_page: {
                cursor: null,
                items: [
                  {
                    id: '456',
                    name: 'Survey Site Beta',
                    column_values: [{ id: 'drone_model', text: 'Skylark V2', value: 'Skylark V2' }],
                  },
                ],
              },
            },
          ],
        },
      }),
    } as Response);

    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.board.id).toBe('5031418671');
    expect(data.board.name).toBe('Work Orders Board');
    expect(data.itemCount).toBe(1);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].name).toBe('Survey Site Beta');
  });

  it('returns 503 error when MONDAY_API_TOKEN is missing', async () => {
    delete process.env.MONDAY_API_TOKEN;

    const response = await GET();
    expect(response.status).toBe(503);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.code).toBe('CONFIG_ERROR');
  });

  it('returns 502 error on Monday API failures', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error_message: 'Invalid API Key' }),
    } as unknown as Response);

    const response = await GET();
    expect(response.status).toBe(502);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.code).toBe('MONDAY_API_ERROR');
  });
});
