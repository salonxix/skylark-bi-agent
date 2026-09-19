import { z } from 'zod';

export const DatasetSchema = z.enum(['deals', 'work_orders', 'both']);

export const DatePeriodSchema = z.enum([
  'all',
  'current_quarter',
  'previous_quarter',
  'current_month',
  'current_year',
  'custom_range',
]);

export const SupportedMetricSchema = z.enum([
  // Deals metrics
  'deal_count',
  'total_deal_value',
  'deal_value_by_sector',
  'deal_count_by_sector',
  'deal_value_by_status',
  'deal_value_by_stage',
  'deal_value_by_owner',

  // Work Orders metrics (exact source and derived)
  'work_order_count',
  'work_order_amount_excl_gst',
  'work_order_amount_incl_gst',
  'billed_value_excl_gst',
  'billed_value_incl_gst',
  'collected_amount_incl_gst',
  'amount_to_be_billed_excl_gst',
  'amount_to_be_billed_incl_gst',
  'amount_receivable',
  'derived_receivable_amount',
  'derived_amount_to_be_billed_excl_gst',
  'work_orders_by_sector',
  'work_orders_by_execution_status',
  'work_orders_by_billing_status',

  // Cross board overview & leadership metrics
  'cross_board_overview',
  'cross_board_sector_summary',
  'leadership_update',
]);

export const DateRangeSchema = z.object({
  period: DatePeriodSchema.default('all'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
});

export const QuerySpecSchema = z.object({
  dataset: DatasetSchema,
  metric: SupportedMetricSchema,
  dimensions: z.array(z.enum(['sector', 'owner', 'status', 'stage', 'month'])).optional(),
  sector: z.string().optional(),
  status: z.string().optional(),
  stage: z.string().optional(),
  owner: z.string().optional(),
  dateRange: DateRangeSchema.optional(),
  dateField: z.enum([
    'closeDate',
    'tentativeCloseDate',
    'createdDate',
    'orderDate',
    'startDate',
    'endDate',
    'executionDate',
    'invoiceDate',
  ]).optional(),
  limit: z.number().int().positive().optional(),
  sort: z.enum(['asc', 'desc']).optional(),
  requestedComparison: z.string().optional(),
  notes: z.string().optional(),
});

export const ClarificationOptionSchema = z.object({
  label: stringOrEmpty(z.string()),
  description: z.string(),
  queryHint: z.string().optional(),
});

function stringOrEmpty(schema: z.ZodString) {
  return schema;
}

export const ClarificationRequestSchema = z.object({
  question: z.string(),
  reason: z.string(),
  options: z.array(ClarificationOptionSchema).min(2),
});

export const PlannerOutputSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('query'),
    querySpec: QuerySpecSchema,
  }),
  z.object({
    type: z.literal('clarification'),
    clarification: ClarificationRequestSchema,
  }),
  z.object({
    type: z.literal('conversational'),
    response: z.string(),
  }),
]);
