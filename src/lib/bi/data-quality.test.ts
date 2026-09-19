import { describe, it, expect } from 'vitest';
import { profileDealsQuality, profileWorkOrdersQuality } from './data-quality';
import { NormalizedDeal, NormalizedWorkOrder } from './types';

describe('Data Quality Profiler', () => {
  describe('profileDealsQuality', () => {
    it('accurately profiles valid deals with zero issues', () => {
      const deals: NormalizedDeal[] = [
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
          createdDate: '2025-12-01',
          raw: { id: '1', name: 'Deal 1', column_values: [] },
        },
      ];

      const report = profileDealsQuality(deals);
      expect(report.totalRecords).toBe(1);
      expect(report.validRecords).toBe(1);
      expect(report.recordsWithIssues).toBe(0);
      expect(report.exclusions).toHaveLength(0);
      expect(report.potentialDuplicates).toHaveLength(0);
      expect(report.inconsistencies).toHaveLength(0);
    });

    it('identifies missing dealValue and registers exclusions', () => {
      const deals: NormalizedDeal[] = [
        {
          id: '10',
          name: 'Missing Value Deal',
          ownerCode: 'OWNER_001',
          clientCode: 'COMPANY001',
          dealStatus: 'Open',
          dealStage: 'Lead',
          closureProbability: 'Medium',
          dealValue: null,
          productDeal: null,
          sector: 'Renewables',
          closeDate: null,
          tentativeCloseDate: '2026-04-01',
          createdDate: '2026-01-01',
          raw: { id: '10', name: 'Missing Value Deal', column_values: [] },
        },
      ];

      const report = profileDealsQuality(deals);
      expect(report.totalRecords).toBe(1);
      expect(report.missingFieldCounts['dealValue']).toBe(1);
      expect(report.exclusions).toHaveLength(1);
      expect(report.exclusions[0]?.recordId).toBe('10');
      expect(report.exclusions[0]?.reason).toContain('Missing or non-numeric dealValue');
    });

    it('flags inconsistencies like Won status without closeDate and negative deal value', () => {
      const deals: NormalizedDeal[] = [
        {
          id: '20',
          name: 'Inconsistent Deal',
          ownerCode: 'OWNER_001',
          clientCode: 'COMPANY001',
          dealStatus: 'Won',
          dealStage: 'Closed',
          closureProbability: 'High',
          dealValue: -5000,
          productDeal: null,
          sector: 'Mining',
          closeDate: null, // Won but no close date!
          tentativeCloseDate: null,
          createdDate: '2026-01-01',
          raw: { id: '20', name: 'Inconsistent Deal', column_values: [] },
        },
      ];

      const report = profileDealsQuality(deals);
      expect(report.invalidNumericCounts['dealValue']).toBe(1);
      expect(report.inconsistencies.some((i) => i.reason.includes('Negative deal value'))).toBe(true);
      expect(report.inconsistencies.some((i) => i.reason.includes('Close Date (A) is missing'))).toBe(true);
    });
  });

  describe('profileWorkOrdersQuality', () => {
    it('detects source vs derived receivable discrepancies without dropping records', () => {
      const wos: NormalizedWorkOrder[] = [
        {
          id: '200',
          name: 'WO #200',
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
          invoiceNumber: 'INV-001',
          orderDate: '2025-05-01',
          startDate: '2025-05-05',
          endDate: '2025-05-20',
          executionDate: '2025-05-20',
          invoiceDate: '2025-06-01',
          amountExclGst: 100000,
          amountInclGst: 118000,
          billedValueExclGst: 100000,
          billedValueInclGst: 118000,
          collectedAmountInclGst: 50000,
          amountToBeBilledExclGst: 0,
          amountToBeBilledInclGst: 0,
          amountReceivable: 75000, // Source says 75000, but 118000 - 50000 = 68000!
          derivedReceivableAmount: 68000,
          derivedAmountToBeBilledExclGst: 0,
          derivedAmountToBeBilledInclGst: 0,
          raw: { id: '200', name: 'WO #200', column_values: [] },
        },
      ];

      const report = profileWorkOrdersQuality(wos);
      expect(report.totalRecords).toBe(1);
      expect(report.inconsistencies.some((i) => i.reason.includes('Source Amount Receivable (75000) differs from derived receivable'))).toBe(true);
    });

    it('detects when Amount Incl GST is less than Amount Excl GST', () => {
      const wos: NormalizedWorkOrder[] = [
        {
          id: '201',
          name: 'WO #201',
          companyCode: 'WOCOMPANY_001',
          dealCode: 'DEAL-002',
          projectType: 'One time Project',
          executionMonth: 'June',
          executionStatus: 'Ongoing',
          lifecycleStatus: 'Open',
          billingStatus: 'Not billed yet',
          billingProcessStatus: 'Not Billable',
          ownerCode: 'OWNER_001',
          sector: 'Renewables',
          serviceScope: 'RGB',
          product: 'SPECTRA',
          orderDocType: 'Purchase Order',
          invoiceNumber: null,
          orderDate: '2025-05-01',
          startDate: '2025-06-01',
          endDate: '2025-06-30',
          executionDate: null,
          invoiceDate: null,
          amountExclGst: 100000,
          amountInclGst: 90000, // Invalid: Incl < Excl!
          billedValueExclGst: 0,
          billedValueInclGst: 0,
          collectedAmountInclGst: 0,
          amountToBeBilledExclGst: 100000,
          amountToBeBilledInclGst: 90000,
          amountReceivable: 0,
          derivedReceivableAmount: 0,
          derivedAmountToBeBilledExclGst: 100000,
          derivedAmountToBeBilledInclGst: 90000,
          raw: { id: '201', name: 'WO #201', column_values: [] },
        },
      ];

      const report = profileWorkOrdersQuality(wos);
      expect(report.inconsistencies.some((i) => i.reason.includes('less than Amount (Excl. of GST)'))).toBe(true);
    });

    it('detects inverted date ranges (endDate < startDate)', () => {
      const wos: NormalizedWorkOrder[] = [
        {
          id: '202',
          name: 'WO #202',
          companyCode: 'WOCOMPANY_001',
          dealCode: 'DEAL-003',
          projectType: 'One time Project',
          executionMonth: 'May',
          executionStatus: 'Ongoing',
          lifecycleStatus: 'Open',
          billingStatus: 'Not billed yet',
          billingProcessStatus: null,
          ownerCode: 'OWNER_001',
          sector: 'Renewables',
          serviceScope: 'RGB',
          product: null,
          orderDocType: null,
          invoiceNumber: null,
          orderDate: '2025-05-01',
          startDate: '2025-06-01',
          endDate: '2025-05-15', // Earlier than start date!
          executionDate: null,
          invoiceDate: null,
          amountExclGst: 50000,
          amountInclGst: 59000,
          billedValueExclGst: 0,
          billedValueInclGst: 0,
          collectedAmountInclGst: 0,
          amountToBeBilledExclGst: 50000,
          amountToBeBilledInclGst: 59000,
          amountReceivable: 0,
          derivedReceivableAmount: 0,
          derivedAmountToBeBilledExclGst: 50000,
          derivedAmountToBeBilledInclGst: 59000,
          raw: { id: '202', name: 'WO #202', column_values: [] },
        },
      ];

      const report = profileWorkOrdersQuality(wos);
      expect(report.inconsistencies.some((i) => i.reason.includes('Work End date (2025-05-15) is earlier than Start date'))).toBe(true);
    });
  });
});
