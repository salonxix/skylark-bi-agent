import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';

describe('GET /api/monday/deals', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      MONDAY_API_TOKEN: 'mock_token',
      MONDAY_DEALS_BOARD_ID: '5031418651',
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
              id: '5031418651',
              name: 'Deals Board',
              items_page: {
                cursor: null,
                items: [
                  {
                    id: '123',
                    name: 'Enterprise Contract',
                    column_values: [{ id: 'val', text: '100', value: '100' }],
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
    expect(data.board.id).toBe('5031418651');
    expect(data.board.name).toBe('Deals Board');
    expect(data.itemCount).toBe(1);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].name).toBe('Enterprise Contract');
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
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error_message: 'Service Unavailable' }),
    } as unknown as Response);

    const response = await GET();
    expect(response.status).toBe(502);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.code).toBe('MONDAY_API_ERROR');
  });
});
