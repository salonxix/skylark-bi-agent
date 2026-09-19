import { describe, it, expect } from 'vitest';
import {
  calculateDealCount,
  calculateTotalDealValue,
  calculateDealValueBySector,
  calculateDealCountBySector,
  calculateDealValueByStatus,
  calculateDealValueByStage,
  calculateDealValueByOwner,
  calculateWorkOrderCount,
  calculateTotalWorkOrderAmountExclGst,
  calculateTotalWorkOrderAmountInclGst,
  calculateTotalBilledValueExclGst,
  calculateTotalBilledValueInclGst,
  calculateTotalCollectedAmountInclGst,
  calculateTotalAmountToBeBilledExclGst,
  calculateTotalAmountToBeBilledInclGst,
  calculateTotalAmountReceivable,
  calculateTotalDerivedReceivableAmount,
  calculateTotalDerivedAmountToBeBilledExclGst,
  calculateWorkOrdersBySector,
  calculateWorkOrdersByExecutionStatus,
  calculateWorkOrdersByBillingStatus,
  getDateRangeBounds,
} from './metrics';
import { NormalizedDeal, NormalizedWorkOrder } from './types';

describe('Deterministic BI Metrics Engine', () => {
  const mockDeals: NormalizedDeal[] = [
    {
      id: '1',
      name: 'Deal 1',
      ownerCode: 'OWNER_001',
      clientCode: 'COMPANY001',
      dealStatus: 'Won',
      dealStage: 'Closed Won',
      closureProbability: 'High',
      dealValue: 100000,
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
      clientCode: 'COMPANY002',
      dealStatus: 'Open',
      dealStage: 'Qualified',
      closureProbability: 'Medium',
      dealValue: 250000,
      productDeal: 'Spectra',
      sector: 'Renewables',
      closeDate: null,
      tentativeCloseDate: '2026-03-30',
      createdDate: '2026-01-10',
      raw: { id: '2', name: 'Deal 2', column_values: [] },
    },
    {
      id: '3',
      name: 'Deal 3',
      ownerCode: 'OWNER_001',
      clientCode: 'COMPANY003',
      dealStatus: 'Won',
      dealStage: 'Closed Won',
      closureProbability: 'High',
      dealValue: 150000,
      productDeal: 'Service + Spectra',
      sector: 'Mining',
      closeDate: '2026-02-20',
      tentativeCloseDate: null,
      createdDate: '2025-12-15',
      raw: { id: '3', name: 'Deal 3', column_values: [] },
    },
    {
      id: '4',
      name: 'Deal 4 (No Value)',
      ownerCode: 'OWNER_003',
      clientCode: 'COMPANY004',
      dealStatus: 'Lost',
      dealStage: 'Lost Lead',
      closureProbability: 'Low',
      dealValue: null,
      productDeal: null,
      sector: 'Infrastructure',
      closeDate: '2026-01-05',
      tentativeCloseDate: null,
      createdDate: '2025-10-01',
      raw: { id: '4', name: 'Deal 4', column_values: [] },
    },
  ];

  const mockWorkOrders: NormalizedWorkOrder[] = [
    {
      id: 'w1',
      name: 'WO 1',
      companyCode: 'WOCOMPANY_001',
      dealCode: 'DEAL-001',
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
      invoiceNumber: 'INV-1',
      orderDate: '2025-05-10',
      startDate: '2025-05-15',
      endDate: '2025-05-25',
      executionDate: '2025-05-25',
      invoiceDate: '2025-06-01',
      amountExclGst: 100000,
      amountInclGst: 118000,
      billedValueExclGst: 100000,
      billedValueInclGst: 118000,
      collectedAmountInclGst: 118000,
      amountToBeBilledExclGst: 0,
      amountToBeBilledInclGst: 0,
      amountReceivable: 0,
      derivedReceivableAmount: 0,
      derivedAmountToBeBilledExclGst: 0,
      derivedAmountToBeBilledInclGst: 0,
      raw: { id: 'w1', name: 'WO 1', column_values: [] },
    },
    {
      id: 'w2',
      name: 'WO 2',
      companyCode: 'WOCOMPANY_002',
      dealCode: 'DEAL-002',
      projectType: 'Monthly Contract',
      executionMonth: 'June',
      executionStatus: 'Ongoing',
      lifecycleStatus: 'Open',
      billingStatus: 'Partially Billed',
      billingProcessStatus: 'Partially Billed',
      ownerCode: 'OWNER_002',
      sector: 'Renewables',
      serviceScope: 'RGB',
      product: 'SPECTRA',
      orderDocType: 'Purchase Order',
      invoiceNumber: 'INV-2',
      orderDate: '2025-06-01',
      startDate: '2025-06-05',
      endDate: '2025-12-31',
      executionDate: null,
      invoiceDate: '2025-07-01',
      amountExclGst: 200000,
      amountInclGst: 236000,
      billedValueExclGst: 50000,
      billedValueInclGst: 59000,
      collectedAmountInclGst: 30000,
      amountToBeBilledExclGst: 150000,
      amountToBeBilledInclGst: 177000,
      amountReceivable: 29000,
      derivedReceivableAmount: 29000,
      derivedAmountToBeBilledExclGst: 150000,
      derivedAmountToBeBilledInclGst: 177000,
      raw: { id: 'w2', name: 'WO 2', column_values: [] },
    },
  ];

  describe('Date Bounds Calculations', () => {
    const fixedDate = new Date(2026, 1, 15); // Feb 15, 2026 (Q1)

    it('calculates current quarter bounds deterministically', () => {
      const bounds = getDateRangeBounds({ period: 'current_quarter', referenceDate: fixedDate });
      expect(bounds.start).toBe('2026-01-01');
      expect(bounds.end).toBe('2026-03-31');
      expect(bounds.periodLabel).toBe('Q1 2026');
    });

    it('calculates previous quarter bounds deterministically', () => {
      const bounds = getDateRangeBounds({ period: 'previous_quarter', referenceDate: fixedDate });
      expect(bounds.start).toBe('2025-10-01');
      expect(bounds.end).toBe('2025-12-31');
      expect(bounds.periodLabel).toBe('Q4 2025');
    });

    it('calculates month bounds', () => {
      const bounds = getDateRangeBounds({ period: 'current_month', referenceDate: fixedDate });
      expect(bounds.start).toBe('2026-02-01');
      expect(bounds.end).toBe('2026-02-28');
    });

    it('calculates year bounds', () => {
      const bounds = getDateRangeBounds({ period: 'current_year', referenceDate: fixedDate });
      expect(bounds.start).toBe('2026-01-01');
      expect(bounds.end).toBe('2026-12-31');
    });
  });

  describe('Deals Metrics', () => {
    it('calculates total deal count', () => {
      const result = calculateDealCount(mockDeals);
      expect(result.value).toBe(4);
      expect(result.unit).toBe('count');
      expect(result.sourceBoard).toBe('deals');
      expect(result.recordsConsidered).toBe(4);
    });

    it('calculates total deal value with missing value exclusion caveats', () => {
      const result = calculateTotalDealValue(mockDeals);
      expect(result.value).toBe(500000); // 100k + 250k + 150k
      expect(result.unit).toBe('INR');
      expect(result.recordsConsidered).toBe(3);
      expect(result.recordsExcluded).toBe(1);
      expect(result.caveats.some((c) => c.includes('excluded from sum'))).toBe(true);
    });

    it('calculates deal value by sector', () => {
      const result = calculateDealValueBySector(mockDeals);
      expect(result.value).toEqual({
        Mining: 250000,
        Renewables: 250000,
      });
      expect(result.unit).toBe('INR');
    });

    it('calculates deal count by sector', () => {
      const result = calculateDealCountBySector(mockDeals);
      expect(result.value).toEqual({
        Mining: 2,
        Renewables: 1,
        Infrastructure: 1,
      });
    });

    it('calculates deal value by status', () => {
      const result = calculateDealValueByStatus(mockDeals);
      expect(result.value).toEqual({
        Won: 250000,
        Open: 250000,
      });
    });

    it('calculates deal value by stage', () => {
      const result = calculateDealValueByStage(mockDeals);
      expect(result.value).toEqual({
        'Closed Won': 250000,
        Qualified: 250000,
      });
    });

    it('calculates deal value by owner', () => {
      const result = calculateDealValueByOwner(mockDeals);
      expect(result.value).toEqual({
        OWNER_001: 250000,
        OWNER_002: 250000,
      });
    });

    it('filters deals by sector and date range', () => {
      const result = calculateTotalDealValue(mockDeals, {
        sector: 'Mining',
        dateField: 'closeDate',
        startDate: '2026-02-01',
        endDate: '2026-02-28',
        period: 'custom_range',
      });

      expect(result.value).toBe(150000); // Only Deal 3 matches
      expect(result.recordsConsidered).toBe(1);
    });

    it('handles zero-record input gracefully', () => {
      const result = calculateTotalDealValue([]);
      expect(result.value).toBe(0);
      expect(result.recordsConsidered).toBe(0);
      expect(result.recordsExcluded).toBe(0);
    });
  });

  describe('Work Orders Financial Metrics (Exact Source & Derived)', () => {
    it('calculates total work order count', () => {
      const result = calculateWorkOrderCount(mockWorkOrders);
      expect(result.value).toBe(2);
      expect(result.unit).toBe('count');
      expect(result.sourceBoard).toBe('work_orders');
    });

    it('calculates exact source financial fields without hardcoded tax rates', () => {
      const amountExclGst = calculateTotalWorkOrderAmountExclGst(mockWorkOrders);
      const amountInclGst = calculateTotalWorkOrderAmountInclGst(mockWorkOrders);
      const billedExcl = calculateTotalBilledValueExclGst(mockWorkOrders);
      const billedIncl = calculateTotalBilledValueInclGst(mockWorkOrders);
      const collected = calculateTotalCollectedAmountInclGst(mockWorkOrders);
      const toBillExcl = calculateTotalAmountToBeBilledExclGst(mockWorkOrders);
      const toBillIncl = calculateTotalAmountToBeBilledInclGst(mockWorkOrders);
      const receivable = calculateTotalAmountReceivable(mockWorkOrders);

      expect(amountExclGst.value).toBe(300000); // 100k + 200k
      expect(amountInclGst.value).toBe(354000); // 118k + 236k
      expect(billedExcl.value).toBe(150000); // 100k + 50k
      expect(billedIncl.value).toBe(177000); // 118k + 59k
      expect(collected.value).toBe(148000); // 118k + 30k
      expect(toBillExcl.value).toBe(150000); // 0 + 150k
      expect(toBillIncl.value).toBe(177000); // 0 + 177k
      expect(receivable.value).toBe(29000); // 0 + 29k
    });

    it('calculates explicitly labeled derived financial metrics', () => {
      const derivedRec = calculateTotalDerivedReceivableAmount(mockWorkOrders);
      const derivedToBill = calculateTotalDerivedAmountToBeBilledExclGst(mockWorkOrders);

      expect(derivedRec.value).toBe(29000);
      expect(derivedRec.metric).toBe('derived_receivable_amount');
      expect(derivedToBill.value).toBe(150000);
      expect(derivedToBill.metric).toBe('derived_amount_to_be_billed_excl_gst');
    });

    it('calculates work orders breakdown by sector', () => {
      const result = calculateWorkOrdersBySector(mockWorkOrders, 'amountExclGst');
      expect(result.value).toEqual({
        Mining: 100000,
        Renewables: 200000,
      });
    });

    it('calculates work orders breakdown by execution status and billing status', () => {
      const execResult = calculateWorkOrdersByExecutionStatus(mockWorkOrders);
      expect(execResult.value).toEqual({
        Completed: 1,
        Ongoing: 1,
      });

      const billResult = calculateWorkOrdersByBillingStatus(mockWorkOrders);
      expect(billResult.value).toEqual({
        'Fully Billed': 1,
        'Partially Billed': 1,
      });
    });
  });
});
