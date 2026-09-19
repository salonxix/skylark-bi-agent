import { describe, it, expect, vi } from 'vitest';
import { planQuery, isAmbiguousRevenueQuery, planDeterministicFallback } from './planner';
import { AIProvider } from './types';

describe('BI Agent Planner', () => {
  const createMockAIProvider = (responseJson: unknown): AIProvider => ({
    generateJson: vi.fn().mockResolvedValue(responseJson),
    generateText: vi.fn().mockResolvedValue('text response'),
  });

  describe('Ambiguity & Clarification Detection', () => {
    it('detects ambiguous revenue queries deterministically without calling AI', async () => {
      expect(isAmbiguousRevenueQuery('What is our revenue this quarter?')).toBe(true);
      expect(isAmbiguousRevenueQuery('Show me our total revenue')).toBe(true);
      expect(isAmbiguousRevenueQuery('What was our turnover last month?')).toBe(true);

      // Specific queries should not trigger revenue clarification
      expect(isAmbiguousRevenueQuery('What is our billed value this quarter?')).toBe(false);
      expect(isAmbiguousRevenueQuery('What is our collected cash this month?')).toBe(false);
      expect(isAmbiguousRevenueQuery('What is our pipeline deal value in Mining?')).toBe(false);
    });

    it('returns structured clarification options for ambiguous revenue', async () => {
      const mockProvider = createMockAIProvider({});
      const result = await planQuery('What is our revenue this quarter?', mockProvider);

      expect(result.type).toBe('clarification');
      if (result.type === 'clarification') {
        expect(result.clarification.question).toContain('Which financial metric');
        expect(result.clarification.options.length).toBeGreaterThanOrEqual(3);
        expect(result.clarification.options.some((o) => o.label.includes('Billed Value'))).toBe(true);
        expect(result.clarification.options.some((o) => o.label.includes('Collected Amount'))).toBe(true);
      }
      expect(mockProvider.generateJson).not.toHaveBeenCalled();
    });

    it('returns structured greeting card for greetings deterministically without calling AI', async () => {
      const mockProvider = createMockAIProvider({});
      const result = await planQuery('hi', mockProvider);

      expect(result.type).toBe('clarification');
      if (result.type === 'clarification') {
        expect(result.clarification.question).toContain('Welcome to Skylark BI Agent');
        expect(result.clarification.options.length).toBeGreaterThanOrEqual(4);
      }
      expect(mockProvider.generateJson).not.toHaveBeenCalled();
    });
  });

  describe('AI Planning & Zod Validation', () => {
    it('successfully validates valid structured QuerySpec from AI', async () => {
      const mockAiOutput = {
        type: 'query',
        querySpec: {
          dataset: 'deals',
          metric: 'deal_value_by_sector',
          sector: 'Mining',
          dateRange: {
            period: 'current_quarter',
          },
          dateField: 'closeDate',
        },
      };

      const mockProvider = createMockAIProvider(mockAiOutput);
      const result = await planQuery('Show pipeline in Mining for this quarter', mockProvider);

      expect(result.type).toBe('query');
      if (result.type === 'query') {
        expect(result.querySpec.dataset).toBe('deals');
        expect(result.querySpec.metric).toBe('deal_value_by_sector');
        expect(result.querySpec.sector).toBe('Mining');
        expect(result.querySpec.dateRange?.period).toBe('current_quarter');
      }
    });

    it('successfully validates conversational responses from AI', async () => {
      const mockAiOutput = {
        type: 'conversational',
        response: 'Hello! I can help you analyze live Monday.com deals and work orders data.',
      };

      const mockProvider = createMockAIProvider(mockAiOutput);
      const result = await planQuery('Who are you and what can you do?', mockProvider);

      expect(result.type).toBe('conversational');
      if (result.type === 'conversational') {
        expect(result.response).toContain('Monday.com');
      }
    });

    it('falls back deterministically or throws on invalid schema', async () => {
      const mockAiOutput = {
        type: 'query',
        querySpec: {
          dataset: 'invalid_dataset_name', // Invalid!
          metric: 'unknown_metric',
        },
      };

      const mockProvider = createMockAIProvider(mockAiOutput);
      // "Mining pipeline" will trigger deterministic fallback
      const result = await planQuery('Show mining pipeline', mockProvider);

      expect(result.type).toBe('query');
      if (result.type === 'query') {
        expect(result.querySpec.dataset).toBe('deals');
        expect(result.querySpec.sector).toBe('Mining');
      }
    });
  });

  describe('Deterministic Fallback', () => {
    it('parses common sector and pipeline queries without AI', () => {
      const plan = planDeterministicFallback('What is our deals pipeline in renewables this quarter?');
      expect(plan).not.toBeNull();
      expect(plan?.type).toBe('query');
      if (plan?.type === 'query') {
        expect(plan.querySpec.dataset).toBe('deals');
        expect(plan.querySpec.sector).toBe('Renewables');
        expect(plan.querySpec.dateRange?.period).toBe('current_quarter');
      }
    });

    it('parses billed value queries', () => {
      const plan = planDeterministicFallback('Show billed invoices in mining');
      expect(plan).not.toBeNull();
      if (plan?.type === 'query') {
        expect(plan.querySpec.dataset).toBe('work_orders');
        expect(plan.querySpec.metric).toBe('billed_value_excl_gst');
        expect(plan.querySpec.sector).toBe('Mining');
      }
    });

    it('parses leadership update queries into leadership_update metric', async () => {
      const mockProvider = createMockAIProvider({});
      const result = await planQuery('Give me a leadership update', mockProvider);
      expect(result.type).toBe('query');
      if (result.type === 'query') {
        expect(result.querySpec.dataset).toBe('both');
        expect(result.querySpec.metric).toBe('leadership_update');
      }
    });
  });
});
