export interface RawMondayColumnValue {
  id: string;
  text: string | null;
  value: string | null;
}

export interface RawMondayItem {
  id: string;
  name: string;
  created_at?: string | null;
  updated_at?: string | null;
  column_values: RawMondayColumnValue[];
}

export interface BoardSnapshot {
  boardId: string;
  boardName: string;
  fetchedAt: string;
  items: RawMondayItem[];
}

export interface MondayGraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: string[];
  extensions?: Record<string, unknown>;
}

export interface MondayGraphQLResponse<T> {
  data?: T;
  errors?: MondayGraphQLError[];
  error_code?: string;
  error_message?: string;
  error_data?: Record<string, unknown>;
  account_id?: number;
}

export interface InitialBoardPageData {
  boards: Array<{
    id: string;
    name: string;
    items_page: {
      cursor: string | null;
      items: RawMondayItem[];
    };
  }>;
}

export interface NextItemsPageData {
  next_items_page: {
    cursor: string | null;
    items: RawMondayItem[];
  };
}

export interface MondayRouteSuccessResponse {
  success: true;
  board: {
    id: string;
    name: string;
  };
  fetchedAt: string;
  itemCount: number;
  items: RawMondayItem[];
}

export interface MondayRouteErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export interface DiagnosticBoardSummary {
  boardId: string;
  boardName: string;
  itemCount: number;
  fetchedAt: string;
  sampleItems: Array<{ id: string; name: string }>;
}

export interface DiagnosticResponse {
  success: boolean;
  timestamp: string;
  deals?: DiagnosticBoardSummary;
  workOrders?: DiagnosticBoardSummary;
  error?: string;
}
