import { getMondayConfig, MondayConfig } from './config';
import {
  BoardSnapshot,
  InitialBoardPageData,
  MondayGraphQLResponse,
  NextItemsPageData,
  RawMondayItem,
} from './types';

const INITIAL_BOARD_ITEMS_QUERY = `
  query GetBoardItems($boardId: [ID!], $limit: Int!) {
    boards(ids: $boardId) {
      id
      name
      items_page(limit: $limit) {
        cursor
        items {
          id
          name
          created_at
          updated_at
          column_values {
            id
            text
            value
          }
        }
      }
    }
  }
`;

const NEXT_ITEMS_PAGE_QUERY = `
  query GetNextItemsPage($cursor: String!, $limit: Int!) {
    next_items_page(cursor: $cursor, limit: $limit) {
      cursor
      items {
        id
        name
        created_at
        updated_at
        column_values {
          id
          text
          value
        }
      }
    }
  }
`;

const PAGE_SIZE_LIMIT = 100;
const MAX_PAGINATION_DEPTH = 500;

export class MondayClient {
  private config: MondayConfig;

  constructor(config?: MondayConfig) {
    this.config = config ?? getMondayConfig();
  }

  /**
   * Executes a read-only GraphQL query against Monday.com API v2
   */
  async executeQuery<T>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.config.requestTimeoutMs);

    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.config.apiToken,
          'API-Version': this.config.apiVersion,
        },
        body: JSON.stringify({
          query,
          variables,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorDetails = `HTTP ${response.status} ${response.statusText}`;
        try {
          const errorBody = (await response.json()) as MondayGraphQLResponse<unknown>;
          if (errorBody.error_message) {
            errorDetails += `: ${errorBody.error_message}`;
          } else if (errorBody.errors && errorBody.errors.length > 0) {
            errorDetails += `: ${errorBody.errors.map((e) => e.message).join(', ')}`;
          }
        } catch {
          // Ignore non-JSON body parse failure
        }
        throw new Error(`Monday API HTTP request failed: ${errorDetails}`);
      }

      const json = (await response.json()) as MondayGraphQLResponse<T>;

      if (json.errors && json.errors.length > 0) {
        const errorMsgs = json.errors.map((e) => e.message).join('; ');
        throw new Error(`Monday GraphQL error: ${errorMsgs}`);
      }

      if (json.error_message) {
        throw new Error(`Monday API error: ${json.error_message}`);
      }

      if (!json.data) {
        throw new Error('Monday API returned an empty or malformed payload (missing data field).');
      }

      return json.data;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Monday API request timed out after ${this.config.requestTimeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Retrieves all items from a Monday board using cursor-based pagination
   */
  async fetchBoardSnapshot(boardId: string): Promise<BoardSnapshot> {
    if (!boardId || typeof boardId !== 'string' || boardId.trim() === '') {
      throw new Error('A valid boardId is required to fetch board snapshot');
    }

    const fetchedAt = new Date().toISOString();

    const initialData = await this.executeQuery<InitialBoardPageData>(
      INITIAL_BOARD_ITEMS_QUERY,
      {
        boardId: [boardId.trim()],
        limit: PAGE_SIZE_LIMIT,
      }
    );

    const board = initialData.boards?.[0];
    if (!board) {
      throw new Error(`Board with ID "${boardId}" not found or inaccessible.`);
    }

    const allItems: RawMondayItem[] = [...(board.items_page?.items || [])];
    let cursor: string | null = board.items_page?.cursor || null;
    let pageCount = 1;

    while (cursor && pageCount < MAX_PAGINATION_DEPTH) {
      const nextData: NextItemsPageData = await this.executeQuery<NextItemsPageData>(
        NEXT_ITEMS_PAGE_QUERY,
        {
          cursor,
          limit: PAGE_SIZE_LIMIT,
        }
      );

      const pageItems = nextData.next_items_page?.items || [];
      allItems.push(...pageItems);
      cursor = nextData.next_items_page?.cursor || null;
      pageCount++;
    }

    return {
      boardId: board.id,
      boardName: board.name,
      fetchedAt,
      items: allItems,
    };
  }
}
