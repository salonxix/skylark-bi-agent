import { NextResponse } from 'next/server';
import { getMondayConfig } from '@/lib/monday/config';
import { MondayClient } from '@/lib/monday/client';
import { MondayRouteErrorResponse, MondayRouteSuccessResponse } from '@/lib/monday/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = getMondayConfig();
    const client = new MondayClient(config);
    const snapshot = await client.fetchBoardSnapshot(config.workOrdersBoardId);

    const response: MondayRouteSuccessResponse = {
      success: true,
      board: {
        id: snapshot.boardId,
        name: snapshot.boardName,
      },
      fetchedAt: snapshot.fetchedAt,
      itemCount: snapshot.items.length,
      items: snapshot.items,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred while fetching Work Orders board';
    
    const isConfigError = message.includes('Missing MONDAY_API_TOKEN');
    const statusCode = isConfigError ? 503 : 502;

    const errorResponse: MondayRouteErrorResponse = {
      success: false,
      error: message,
      code: isConfigError ? 'CONFIG_ERROR' : 'MONDAY_API_ERROR',
    };

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
