import { PlannerOutputSchema } from './query-spec';
import { PlannerResult, AIProvider } from './types';
import { PLANNER_SYSTEM_PROMPT } from './prompts';

/**
 * Checks if a user prompt is asking for generic "revenue" or "income" without milestone specification
 */
export function isAmbiguousRevenueQuery(message: string): boolean {
  const normalized = message.toLowerCase().trim();
  const hasRevenueWord = /\b(revenue|turnover|income|total earnings|total money made)\b/i.test(normalized);
  const hasSpecificMilestone = /\b(billed|invoiced|collected|received|contract|deal value|pipeline|receivable)\b/i.test(normalized);

  return hasRevenueWord && !hasSpecificMilestone;
}

/**
 * Builds standard clarification response for ambiguous revenue questions
 */
export function buildRevenueClarification(): PlannerResult {
  return {
    type: 'clarification',
    clarification: {
      question: 'Which financial metric would you like to measure for revenue?',
      reason: 'Work Orders data contains multiple financial stages that can represent revenue depending on your accounting milestone.',
      options: [
        {
          label: 'Billed Value (Invoiced, Excl. GST)',
          description: 'Total value of invoices raised to clients excluding GST.',
          queryHint: 'Show billed value excluding GST',
        },
        {
          label: 'Collected Amount (Cash in Bank, Incl. GST)',
          description: 'Actual customer payments collected in bank.',
          queryHint: 'Show collected amount',
        },
        {
          label: 'Work Order Contract Value (Excl. GST)',
          description: 'Total purchase order value of contracted projects.',
          queryHint: 'Show total work order contract amount',
        },
        {
          label: 'Outstanding Receivable Amount',
          description: 'Total billed amount pending collection from customers.',
          queryHint: 'Show amount receivable',
        },
      ],
    },
  };
}

/**
 * Plans a natural language question into a validated QuerySpec or Clarification
 */
export async function planQuery(
  message: string,
  aiProvider: AIProvider
): Promise<PlannerResult> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error('Message cannot be empty.');
  }

  // 1. Deterministic guard for ambiguous revenue query
  if (isAmbiguousRevenueQuery(trimmed)) {
    return buildRevenueClarification();
  }

  // 2. Call AI Planner to extract structured intent
  const prompt = `Convert the following user question into a strict JSON QuerySpec or Clarification:\n\n"${trimmed}"`;

  try {
    const rawOutput = await aiProvider.generateJson<unknown>(prompt, PLANNER_SYSTEM_PROMPT);

    // 3. Strict schema validation via Zod
    const validated = PlannerOutputSchema.safeParse(rawOutput);

    if (!validated.success) {
      throw new Error(
        `AI generated an invalid query plan: ${validated.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }

    return validated.data;
  } catch (err) {
    // If AI fails or JSON is malformed, provide deterministic keyword fallback for common queries
    const fallback = planDeterministicFallback(trimmed);
    if (fallback) return fallback;

    throw err;
  }
}

/**
 * Deterministic fallback parser for common high-confidence patterns
 */
export function planDeterministicFallback(message: string): PlannerResult | null {
  const text = message.toLowerCase();

  // Sector detection
  let sector: string | undefined;
  if (text.includes('mining')) sector = 'Mining';
  else if (text.includes('renewables') || text.includes('renewable')) sector = 'Renewables';
  else if (text.includes('powerline') || text.includes('power')) sector = 'Powerline';
  else if (text.includes('infrastructure') || text.includes('infra')) sector = 'Infrastructure';

  // Period detection
  let period: 'all' | 'current_quarter' | 'previous_quarter' | 'current_month' | 'current_year' = 'all';
  if (text.includes('this quarter') || text.includes('current quarter')) period = 'current_quarter';
  else if (text.includes('last quarter') || text.includes('previous quarter')) period = 'previous_quarter';
  else if (text.includes('this month') || text.includes('current month')) period = 'current_month';
  else if (text.includes('this year') || text.includes('current year')) period = 'current_year';

  // Deals pipeline queries
  if (text.includes('pipeline') || text.includes('deal') || text.includes('deals')) {
    if (text.includes('by sector') || text.includes('sector breakdown')) {
      return {
        type: 'query',
        querySpec: {
          dataset: 'deals',
          metric: 'deal_value_by_sector',
          dateRange: { period },
          sector,
        },
      };
    }

    return {
      type: 'query',
      querySpec: {
        dataset: 'deals',
        metric: 'total_deal_value',
        dateRange: { period },
        sector,
      },
    };
  }

  // Work Orders billed value queries
  if (text.includes('billed') || text.includes('invoice') || text.includes('invoices')) {
    return {
      type: 'query',
      querySpec: {
        dataset: 'work_orders',
        metric: 'billed_value_excl_gst',
        dateRange: { period },
        sector,
      },
    };
  }

  // Collected queries
  if (text.includes('collected') || text.includes('collection') || text.includes('cash received')) {
    return {
      type: 'query',
      querySpec: {
        dataset: 'work_orders',
        metric: 'collected_amount_incl_gst',
        dateRange: { period },
        sector,
      },
    };
  }

  // Receivable queries
  if (text.includes('receivable') || text.includes('outstanding') || text.includes('pending payment')) {
    return {
      type: 'query',
      querySpec: {
        dataset: 'work_orders',
        metric: 'amount_receivable',
        dateRange: { period },
        sector,
      },
    };
  }

  // Work order count queries
  if (text.includes('work order') || text.includes('work orders') || text.includes('wo count')) {
    return {
      type: 'query',
      querySpec: {
        dataset: 'work_orders',
        metric: 'work_order_count',
        dateRange: { period },
        sector,
      },
    };
  }

  return null;
}
