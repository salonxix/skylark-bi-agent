import { describe, it, expect } from 'vitest';
import { executeQuerySpec } from './executor';
import { NormalizedDeal, NormalizedWorkOrder } from '@/lib/bi/types';

describe('BI Agent Executor', () => {
  const mockDeals: NormalizedDeal[] = [
    {
      id: '1',
      name: 'Deal 1',
      ownerCode: 'OWNER_001',
      clientCode: 'COMP_01',
      dealStatus: 'Won',
      dealStage: 'Closed Won',
      closureProbability: 'High',
      dealValue: 500000,
      productDeal: 'Service',
      sector: 'Mining',
      closeDate: '2026-01-15',
      tentativeCloseDate: null,
      createdDate: '2025-11-01',
      raw: { id: '1', name: 'Deal 1', column_values: [] },
    },
    {
      id: '2',
      name: 'Deal 2',
      ownerCode: 'OWNER_002',
      clientCode: 'COMP_02',
      dealStatus: 'Open',
      dealStage: 'Lead',
      closureProbability: 'Medium',
      dealValue: 300000,
      productDeal: 'Spectra',
      sector: 'Renewables',
      closeDate: null,
      tentativeCloseDate: '2026-03-31',
      createdDate: '2026-01-01',
      raw: { id: '2', name: 'Deal 2', column_values: [] },
    },
  ];

  const mockWorkOrders: NormalizedWorkOrder[] = [
    {
      id: 'w1',
      name: 'WO 1',
      companyCode: 'WO_01',
      dealCode: 'DEAL-01',
      projectType: 'One time Project',
      executionMonth: 'May',
      executionStatus: 'Completed',
      lifecycleStatus: 'Closed',
      billingStatus: 'Fully Billed',
      billingProcessStatus: 'BIlled',
      ownerCode: 'OWNER_001',
      sector: 'Mining',
      serviceScope: 'Survey',
      product: 'NONE',
      orderDocType: 'Purchase Order',
      invoiceNumber: 'INV-101',
      orderDate: '2025-05-10',
      startDate: '2025-05-15',
      endDate: '2025-05-25',
      executionDate: '2025-05-25',
      invoiceDate: '2025-06-01',
      amountExclGst: 400000,
      amountInclGst: 472000,
      billedValueExclGst: 400000,
      billedValueInclGst: 472000,
      collectedAmountInclGst: 472000,
      amountToBeBilledExclGst: 0,
      amountToBeBilledInclGst: 0,
      amountReceivable: 0,
      derivedReceivableAmount: 0,
      derivedAmountToBeBilledExclGst: 0,
      derivedAmountToBeBilledInclGst: 0,
      raw: { id: 'w1', name: 'WO 1', column_values: [] },
    },
  ];

  it('executes deal value calculation deterministically with preloaded data', async () => {
    const res = await executeQuerySpec(
      {
        dataset: 'deals',
        metric: 'total_deal_value',
        sector: 'Mining',
        dateRange: { period: 'all' },
      },
      {
        preloadedDeals: mockDeals,
      }
    );

    expect(res.results).toHaveLength(1);
    expect(res.results[0]?.metric).toBe('total_deal_value');
    expect(res.results[0]?.value).toBe(500000);
    expect(res.results[0]?.unit).toBe('INR');
    expect(res.dataQuality).toHaveLength(1);
  });

  it('executes work orders billed value metric', async () => {
    const res = await executeQuerySpec(
      {
        dataset: 'work_orders',
        metric: 'billed_value_excl_gst',
        dateRange: { period: 'all' },
      },
      {
        preloadedWorkOrders: mockWorkOrders,
      }
    );

    expect(res.results).toHaveLength(1);
    expect(res.results[0]?.metric).toBe('billed_value_excl_gst');
    expect(res.results[0]?.value).toBe(400000);
  });

  it('executes cross-board overview returning both pipeline and execution metrics', async () => {
    const res = await executeQuerySpec(
      {
        dataset: 'both',
        metric: 'cross_board_overview',
        dateRange: { period: 'all' },
      },
      {
        preloadedDeals: mockDeals,
        preloadedWorkOrders: mockWorkOrders,
      }
    );

    expect(res.results.length).toBeGreaterThanOrEqual(4);
    expect(res.results.some((r) => r.metric === 'total_deal_value')).toBe(true);
    expect(res.results.some((r) => r.metric === 'billed_value_excl_gst')).toBe(true);
    expect(res.dataQuality).toHaveLength(2); // Both Deals and Work Orders profiled
  });

  it('executes leadership update metric returning holistic executive metrics', async () => {
    const res = await executeQuerySpec(
      {
        dataset: 'both',
        metric: 'leadership_update',
        dateRange: { period: 'all' },
      },
      {
        preloadedDeals: mockDeals,
        preloadedWorkOrders: mockWorkOrders,
      }
    );

    expect(res.results.length).toBeGreaterThanOrEqual(6);
    expect(res.results.some((r) => r.metric === 'total_deal_value')).toBe(true);
    expect(res.results.some((r) => r.metric === 'deal_count')).toBe(true);
    expect(res.results.some((r) => r.metric === 'work_order_amount_excl_gst')).toBe(true);
    expect(res.results.some((r) => r.metric === 'billed_value_excl_gst')).toBe(true);
    expect(res.results.some((r) => r.metric === 'collected_amount_incl_gst')).toBe(true);
    expect(res.results.some((r) => r.metric === 'amount_receivable')).toBe(true);
    expect(res.results.some((r) => r.metric === 'deal_value_by_sector')).toBe(true);
    expect(res.dataQuality).toHaveLength(2);
  });
});
