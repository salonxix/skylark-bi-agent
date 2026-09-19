import { NextResponse } from 'next/server';
import { DefaultAIProvider } from '@/lib/agent/provider';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  try {
    const provider = new DefaultAIProvider();
    const testPrompt = 'Respond with "PONG" and nothing else.';
    const responseText = await provider.generateText(testPrompt);
    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      status: 'healthy',
      latencyMs,
      timestamp: new Date().toISOString(),
      provider: 'DefaultAIProvider',
      modelResponse: responseText.trim(),
    });
  } catch (error: unknown) {
    const latencyMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'AI diagnostics ping failed';
    return NextResponse.json(
      {
        success: false,
        status: 'unhealthy',
        latencyMs,
        timestamp: new Date().toISOString(),
        error: message,
      },
      { status: 500 }
    );
  }
}
