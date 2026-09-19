import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MondayClient } from './client';
import { getMondayConfig } from './config';

describe('MondayClient Integration & Unit Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      MONDAY_API_TOKEN: 'mock_test_token_123',
      MONDAY_DEALS_BOARD_ID: '5031418651',
      MONDAY_WORK_ORDERS_BOARD_ID: '5031418671',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('Configuration', () => {
    it('throws error when MONDAY_API_TOKEN is missing', () => {
      delete process.env.MONDAY_API_TOKEN;
      expect(() => getMondayConfig()).toThrow(/Missing MONDAY_API_TOKEN/);
    });

    it('reads configuration correctly from environment variables', () => {
      const config = getMondayConfig();
      expect(config.apiToken).toBe('mock_test_token_123');
      expect(config.dealsBoardId).toBe('5031418651');
      expect(config.workOrdersBoardId).toBe('5031418671');
      expect(config.apiVersion).toBe('2026-07');
    });
  });

  describe('Board Snapshot & Query Execution', () => {
    it('successfully parses single-page board response', async () => {
      const mockBoardResponse = {
        data: {
          boards: [
            {
              id: '5031418651',
              name: 'Deals Board',
              items_page: {
                cursor: null,
                items: [
                  {
                    id: '101',
                    name: 'Project Alpha',
                    created_at: '2026-01-01T00:00:00Z',
                    updated_at: '2026-01-02T00:00:00Z',
                    column_values: [
                      { id: 'status', text: 'Won', value: '{"index":1}' },
                      { id: 'numbers', text: '50000', value: '50000' },
                    ],
                  },
                ],
              },
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBoardResponse,
      } as Response);

      const client = new MondayClient();
      const snapshot = await client.fetchBoardSnapshot('5031418651');

      expect(snapshot.boardId).toBe('5031418651');
      expect(snapshot.boardName).toBe('Deals Board');
      expect(snapshot.items).toHaveLength(1);
      expect(snapshot.items[0]?.name).toBe('Project Alpha');
      expect(snapshot.items[0]?.column_values).toHaveLength(2);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.monday.com/v2',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'mock_test_token_123',
            'API-Version': '2026-07',
          }),
        })
      );
    });

    it('correctly handles cursor-based multi-page pagination', async () => {
      const page1Response = {
        data: {
          boards: [
            {
              id: '5031418651',
              name: 'Deals Board',
              items_page: {
                cursor: 'cursor_page_2',
                items: [
                  { id: '101', name: 'Deal 1', column_values: [] },
                  { id: '102', name: 'Deal 2', column_values: [] },
                ],
              },
            },
          ],
        },
      };

      const page2Response = {
        data: {
          next_items_page: {
            cursor: null,
            items: [
              { id: '103', name: 'Deal 3', column_values: [] },
              { id: '104', name: 'Deal 4', column_values: [] },
            ],
          },
        },
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => page1Response,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => page2Response,
        } as Response);

      const client = new MondayClient();
      const snapshot = await client.fetchBoardSnapshot('5031418651');

      expect(snapshot.items).toHaveLength(4);
      expect(snapshot.items.map((i) => i.id)).toEqual(['101', '102', '103', '104']);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('handles GraphQL error responses safely', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          errors: [{ message: 'Complexity budget exhausted' }],
        }),
      } as Response);

      const client = new MondayClient();
      await expect(client.fetchBoardSnapshot('5031418651')).rejects.toThrow(
        /Monday GraphQL error: Complexity budget exhausted/
      );
    });

    it('handles top-level Monday API error objects', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          error_message: 'User is not authenticated',
          error_code: 'NOT_AUTHENTICATED',
        }),
      } as Response);

      const client = new MondayClient();
      await expect(client.fetchBoardSnapshot('5031418651')).rejects.toThrow(
        /Monday API error: User is not authenticated/
      );
    });

    it('handles HTTP error status codes', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ error_message: 'Invalid API Token' }),
      } as unknown as Response);

      const client = new MondayClient();
      await expect(client.fetchBoardSnapshot('5031418651')).rejects.toThrow(
        /Monday API HTTP request failed: HTTP 403 Forbidden: Invalid API Token/
      );
    });

    it('handles malformed API response missing data field', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      const client = new MondayClient();
      await expect(client.fetchBoardSnapshot('5031418651')).rejects.toThrow(
        /empty or malformed payload/
      );
    });

    it('handles non-existent board response', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            boards: [],
          },
        }),
      } as Response);

      const client = new MondayClient();
      await expect(client.fetchBoardSnapshot('99999999')).rejects.toThrow(
        /Board with ID "99999999" not found or inaccessible/
      );
    });
  });
});
