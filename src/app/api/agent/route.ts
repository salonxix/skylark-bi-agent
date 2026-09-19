import { NextResponse } from 'next/server';
import { planQuery } from '@/lib/agent/planner';
import { executeQuerySpec } from '@/lib/agent/executor';
import { DefaultAIProvider } from '@/lib/agent/provider';
import { NARRATOR_SYSTEM_PROMPT } from '@/lib/agent/prompts';
import { AgentRequestPayload, AgentResponse } from '@/lib/agent/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    let body: AgentRequestPayload;
    try {
      body = (await req.json()) as AgentRequestPayload;
    } catch {
      return NextResponse.json<AgentResponse>(
        { success: false, error: 'Invalid JSON body. Expected { message: string }', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const message = body.message?.trim();
    if (!message) {
      return NextResponse.json<AgentResponse>(
        { success: false, error: 'Message cannot be empty', code: 'EMPTY_MESSAGE' },
        { status: 400 }
      );
    }

    const aiProvider = new DefaultAIProvider();

    // Step 1: Interpret user intent via Planner
    const planResult = await planQuery(message, aiProvider);

    // If clarification is required, return immediately
    if (planResult.type === 'clarification') {
      return NextResponse.json<AgentResponse>(
        {
          success: true,
          clarification: planResult.clarification,
          results: [],
          dataQuality: [],
        },
        { status: 200 }
      );
    }

    // Step 2: Deterministic execution of QuerySpec against Monday live data
    const execution = await executeQuerySpec(planResult.querySpec);

    // Step 3: Generate executive explanation of the verified BI results
    const narratorPrompt = `
User Question: "${message}"

QuerySpec Executed:
${JSON.stringify(planResult.querySpec, null, 2)}

Verified Deterministic Results:
${JSON.stringify(execution.results, null, 2)}

Data Quality Caveats / Reports:
${JSON.stringify(
  execution.dataQuality.map((dq) => ({
    board: dq.boardName,
    totalRecords: dq.totalRecords,
    issues: dq.recordsWithIssues,
    exclusions: dq.exclusions,
    inconsistencies: dq.inconsistencies,
  })),
  null,
  2
)}

Explain these results directly and concisely for the user.
`;

    let answer: string;
    try {
      answer = await aiProvider.generateText(narratorPrompt, NARRATOR_SYSTEM_PROMPT);
    } catch {
      // Fallback deterministic explanation if AI narrator is unavailable
      const res = execution.results[0];
      if (res) {
        if (typeof res.value === 'number') {
          const formattedVal =
            res.unit === 'INR'
              ? `₹${res.value.toLocaleString('en-IN')}`
              : `${res.value} ${res.unit}`;
          answer = `The calculated **${res.metric.replace(/_/g, ' ')}** is **${formattedVal}** for **${res.period}** (${res.recordsConsidered} records considered).`;
        } else {
          answer = `Here is the breakdown for **${res.metric.replace(/_/g, ' ')}** in **${res.period}**:\n` +
            Object.entries(res.value)
              .map(([k, v]) => `- **${k}**: ${res.unit === 'INR' ? `₹${v.toLocaleString('en-IN')}` : v}`)
              .join('\n');
        }
      } else {
        answer = 'No matching records found for the requested criteria.';
      }
    }

    return NextResponse.json<AgentResponse>(
      {
        success: true,
        answer,
        querySpec: planResult.querySpec,
        results: execution.results,
        dataQuality: execution.dataQuality,
        clarification: null,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const rawMessage = error instanceof Error ? error.message : 'An unexpected error occurred in BI Agent';

    let statusCode = 500;
    let errorCode = 'AGENT_ERROR';

    if (rawMessage.includes('Missing MONDAY_API_TOKEN') || rawMessage.includes('Missing AI_API_KEY')) {
      statusCode = 503;
      errorCode = 'CONFIG_ERROR';
    } else if (rawMessage.includes('Monday API') || rawMessage.includes('GraphQL')) {
      statusCode = 502;
      errorCode = 'MONDAY_API_ERROR';
    }

    return NextResponse.json<AgentResponse>(
      {
        success: false,
        error: rawMessage,
        code: errorCode,
      },
      { status: statusCode }
    );
  }
}
