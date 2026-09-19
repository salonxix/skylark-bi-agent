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
 * Checks if a user prompt is asking for a leadership/executive briefing or update
 */
export function isLeadershipUpdateQuery(message: string): boolean {
  const normalized = message.toLowerCase().trim();
  return /\b(leadership update|leadership briefing|executive update|executive summary|ceo update|management update|management summary|business overview)\b/i.test(normalized);
}

/**
 * Checks if a user prompt is a greeting or general conversational help query
 */
export function isGreetingOrHelp(message: string): boolean {
  const normalized = message.toLowerCase().trim().replace(/[^\w\s]/g, '');
  return /^(hey|hi|hello|help|howdy|greetings|good morning|good evening|whats up|wassup|sup|yo|gm)\b/i.test(normalized);
}

/**
 * Builds standard greeting response with suggested query paths
 */
export function buildGreetingResponse(): PlannerResult {
  return {
    type: 'clarification',
    clarification: {
      question: 'Welcome to Skylark BI Agent! What business metrics would you like to explore?',
      reason: 'I can analyze live Monday.com Deals (Sales Pipeline) and Work Orders (Fulfillment, Billing & Collections).',
      options: [
        {
          label: 'Open Pipeline by Sector',
          description: 'View total deal pipeline value broken down by industry sector.',
          queryHint: 'Show me our open deal pipeline by sector',
        },
        {
          label: 'Energy Sector Pipeline',
          description: 'Analyze open deals in the Energy sector.',
          queryHint: "How's our pipeline looking for the energy sector this quarter?",
        },
        {
          label: 'Billed vs Collected Cash',
          description: 'Compare total billed invoices against cash received.',
          queryHint: 'How much has been billed versus collected?',
        },
        {
          label: 'Work Order Fulfillment Risks',
          description: 'Inspect work orders with unbilled amounts or collection risk.',
          queryHint: 'Which work orders have billing or collection risk?',
        },
      ],
    },
  };
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

  // 1. Deterministic guard for greetings / help short-circuits to greeting card
  if (isGreetingOrHelp(trimmed)) {
    return buildGreetingResponse();
  }

  // 2. Deterministic guard for leadership updates
  if (isLeadershipUpdateQuery(trimmed)) {
    return {
      type: 'query',
      querySpec: {
        dataset: 'both',
        metric: 'leadership_update',
        dateRange: { period: 'all' },
      },
    };
  }

  // 3. Deterministic guard for ambiguous revenue query
  if (isAmbiguousRevenueQuery(trimmed)) {
    return buildRevenueClarification();
  }

  // 3. Call AI Planner to extract structured intent or natural conversational response
  const prompt = `Convert the following user question into a strict JSON QuerySpec or Clarification or Conversational response:\n\n"${trimmed}"`;

  try {
    const rawOutput = await aiProvider.generateJson<unknown>(prompt, PLANNER_SYSTEM_PROMPT);

    // 4. Strict schema validation via Zod
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

  // Fallback for greetings/help if AI is offline
  if (isGreetingOrHelp(message)) {
    return buildGreetingResponse();
  }

  return null;
}
