export interface MondayConfig {
  apiToken: string;
  apiUrl: string;
  apiVersion: string;
  dealsBoardId: string;
  workOrdersBoardId: string;
  requestTimeoutMs: number;
}

const DEFAULT_DEALS_BOARD_ID = '5031418651';
const DEFAULT_WORK_ORDERS_BOARD_ID = '5031418671';
const DEFAULT_MONDAY_API_URL = 'https://api.monday.com/v2';
const DEFAULT_API_VERSION = '2026-07';
const DEFAULT_TIMEOUT_MS = 15000;

export function getMondayConfig(): MondayConfig {
  const apiToken = process.env.MONDAY_API_TOKEN?.trim();

  if (!apiToken) {
    throw new Error('Missing MONDAY_API_TOKEN environment variable. Please configure it in .env.local');
  }

  const dealsBoardId = process.env.MONDAY_DEALS_BOARD_ID?.trim() || DEFAULT_DEALS_BOARD_ID;
  const workOrdersBoardId = process.env.MONDAY_WORK_ORDERS_BOARD_ID?.trim() || DEFAULT_WORK_ORDERS_BOARD_ID;

  return {
    apiToken,
    apiUrl: process.env.MONDAY_API_URL?.trim() || DEFAULT_MONDAY_API_URL,
    apiVersion: process.env.MONDAY_API_VERSION?.trim() || DEFAULT_API_VERSION,
    dealsBoardId,
    workOrdersBoardId,
    requestTimeoutMs: DEFAULT_TIMEOUT_MS,
  };
}
