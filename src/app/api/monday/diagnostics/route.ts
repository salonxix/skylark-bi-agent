import { NextResponse } from 'next/server';
import { getMondayConfig } from '@/lib/monday/config';
import { MondayClient } from '@/lib/monday/client';
import { DiagnosticResponse } from '@/lib/monday/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = getMondayConfig();
    const client = new MondayClient(config);

    const [dealsSnapshot, workOrdersSnapshot] = await Promise.all([
      client.fetchBoardSnapshot(config.dealsBoardId),
      client.fetchBoardSnapshot(config.workOrdersBoardId),
    ]);

    const response: DiagnosticResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      deals: {
        boardId: dealsSnapshot.boardId,
        boardName: dealsSnapshot.boardName,
        itemCount: dealsSnapshot.items.length,
        fetchedAt: dealsSnapshot.fetchedAt,
        sampleItems: dealsSnapshot.items.slice(0, 3).map((item) => ({
          id: item.id,
          name: item.name,
        })),
      },
      workOrders: {
        boardId: workOrdersSnapshot.boardId,
        boardName: workOrdersSnapshot.boardName,
        itemCount: workOrdersSnapshot.items.length,
        fetchedAt: workOrdersSnapshot.fetchedAt,
        sampleItems: workOrdersSnapshot.items.slice(0, 3).map((item) => ({
          id: item.id,
          name: item.name,
        })),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Diagnostic fetch failed';
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: message,
      },
      { status: 500 }
    );
  }
}
