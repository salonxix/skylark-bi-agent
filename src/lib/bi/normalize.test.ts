import { describe, it, expect } from 'vitest';
import {
  parseNumber,
  parseDate,
  parseString,
  normalizeSector,
  normalizeDeal,
  normalizeWorkOrder,
  normalizeDeals,
  normalizeWorkOrders,
} from './normalize';
import { RawMondayItem } from '@/lib/monday/types';

describe('BI Normalization Engine', () => {
  describe('parseNumber', () => {
    it('handles null, undefined, and empty string safely', () => {
      expect(parseNumber(null)).toBeNull();
      expect(parseNumber(undefined)).toBeNull();
      expect(parseNumber('')).toBeNull();
      expect(parseNumber('   ')).toBeNull();
    });

    it('parses valid numbers and numeric strings', () => {
      expect(parseNumber(42)).toBe(42);
      expect(parseNumber(0)).toBe(0);
      expect(parseNumber(-15.5)).toBe(-15.5);
      expect(parseNumber('12345.67')).toBe(12345.67);
      expect(parseNumber('0')).toBe(0);
    });

    it('handles formatted numbers with commas, currency symbols, and spaces', () => {
      expect(parseNumber('₹ 1,50,000')).toBe(150000);
      expect(parseNumber('$ 1,234.56')).toBe(1234.56);
      expect(parseNumber('€ 999')).toBe(999);
      expect(parseNumber('  10,000.50  ')).toBe(10000.5);
    });

    it('returns null for non-numeric or masked strings', () => {
      expect(parseNumber('N/A')).toBeNull();
      expect(parseNumber('---')).toBeNull();
      expect(parseNumber('NaN')).toBeNull();
      expect(parseNumber('masked_value_xxx')).toBeNull();
    });
  });

  describe('parseDate', () => {
    it('handles null, undefined, and empty string', () => {
      expect(parseDate(null)).toBeNull();
      expect(parseDate(undefined)).toBeNull();
      expect(parseDate('')).toBeNull();
      expect(parseDate('   ')).toBeNull();
    });

    it('parses ISO date strings into YYYY-MM-DD', () => {
      expect(parseDate('2025-05-15')).toBe('2025-05-15');
      expect(parseDate('2026-11-01T14:30:00.000Z')).toBe('2026-11-01');
    });

    it('parses Monday JSON date structures', () => {
      expect(parseDate('{"date":"2025-09-06","icon":""}')).toBe('2025-09-06');
      expect(parseDate({ date: '2025-09-06' })).toBe('2025-09-06');
    });

    it('returns null for invalid dates', () => {
      expect(parseDate('invalid-date-string')).toBeNull();
      expect(parseDate('2025-99-99')).toBeNull();
    });
  });

  describe('parseString & normalizeSector', () => {
    it('trims strings and converts empty values to null', () => {
      expect(parseString('  Mining  ')).toBe('Mining');
      expect(parseString('')).toBeNull();
      expect(parseString('   ')).toBeNull();
      expect(parseString(null)).toBeNull();
    });

    it('preserves sector name casing without destructive merging', () => {
      expect(normalizeSector('Renewables')).toBe('Renewables');
      expect(normalizeSector('  Mining ')).toBe('Mining');
      expect(normalizeSector('Urban / Smart Cities')).toBe('Urban / Smart Cities');
      expect(normalizeSector('')).toBeNull();
    });
  });

  describe('normalizeDeal', () => {
    it('correctly maps raw Monday Deal items into NormalizedDeal', () => {
      const rawDeal: RawMondayItem = {
        id: '2862960014',
        name: 'Naruto',
        created_at: '2025-12-26T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        column_values: [
          { id: 'color_mm7bdx2e', text: 'OWNER_001', value: null },
          { id: 'dropdown_mm7b4q06', text: 'COMPANY089', value: null },
          { id: 'color_mm7bp3k2', text: 'Won', value: null },
          { id: 'date_mm7be867', text: '2026-02-15', value: null },
          { id: 'color_mm7b86qv', text: 'High', value: null },
          { id: 'numeric_mm7b65d9', text: '489360', value: '489360' },
          { id: 'date_mm7bqvbc', text: '2026-02-26', value: null },
          { id: 'color_mm7bdmsx', text: 'B. Sales Qualified Leads', value: null },
          { id: 'color_mm7bjgfq', text: 'Service + Spectra', value: null },
          { id: 'color_mm7bsqa2', text: 'Mining', value: null },
          { id: 'date_mm7b4hyz', text: '2025-12-26', value: null },
        ],
      };

      const normalized = normalizeDeal(rawDeal);

      expect(normalized.id).toBe('2862960014');
      expect(normalized.name).toBe('Naruto');
      expect(normalized.ownerCode).toBe('OWNER_001');
      expect(normalized.clientCode).toBe('COMPANY089');
      expect(normalized.dealStatus).toBe('Won');
      expect(normalized.dealStage).toBe('B. Sales Qualified Leads');
      expect(normalized.closureProbability).toBe('High');
      expect(normalized.dealValue).toBe(489360);
      expect(normalized.sector).toBe('Mining');
      expect(normalized.closeDate).toBe('2026-02-15');
      expect(normalized.tentativeCloseDate).toBe('2026-02-26');
      expect(normalized.createdDate).toBe('2025-12-26');
      expect(normalized.raw).toEqual(rawDeal);
    });
  });

  describe('normalizeWorkOrder', () => {
    it('correctly maps raw Work Order item preserving source fields and calculating derived fields', () => {
      const rawWO: RawMondayItem = {
        id: '2862957456',
        name: 'Pumbaa',
        created_at: '2025-05-15T00:00:00Z',
        updated_at: '2025-06-01T00:00:00Z',
        column_values: [
          { id: 'dropdown_mm7bj008', text: 'WOCOMPANY_047', value: null },
          { id: 'dropdown_mm7bw1hf', text: 'SDPLDEAL-001', value: null },
          { id: 'color_mm7bfa0f', text: 'Annual Rate Contract', value: null },
          { id: 'color_mm7b94mp', text: 'June', value: null },
          { id: 'color_mm7bbmdb', text: 'Ongoing', value: null },
          { id: 'date_mm7byqf4', text: '2025-05-15', value: null },
          { id: 'color_mm7bd84s', text: 'Purchase Order', value: null },
          { id: 'date_mm7b2nps', text: '2025-05-19', value: null },
          { id: 'date_mm7bjkd5', text: '2025-11-19', value: null },
          { id: 'color_mm7bh02a', text: 'OWNER_005', value: null },
          { id: 'color_mm7be3tw', text: 'Renewables', value: null },
          { id: 'color_mm7bshmw', text: 'Topography Survey: RGB', value: null },
          { id: 'color_mm7bhhg4', text: 'SPECTRA', value: null },
          { id: 'date_mm7b2fv2', text: '2025-09-06', value: null },
          { id: 'date_mm7bygeg', text: '2025-08-01', value: null },
          { id: 'dropdown_mm7bjhwg', text: 'SDPL/FY25-26/431', value: null },
          { id: 'numeric_mm7bnav4', text: '3995568', value: '3995568' },
          { id: 'numeric_mm7btzx2', text: '4714770.24', value: '4714770.24' },
          { id: 'numeric_mm7bexxg', text: '3662604', value: '3662604' },
          { id: 'numeric_mm7bkxax', text: '4321872.72', value: '4321872.72' },
          { id: 'numeric_mm7b7qat', text: '1405108.08', value: '1405108.08' },
          { id: 'numeric_mm7b49n6', text: '332964', value: '332964' },
          { id: 'numeric_mm7bn6fr', text: '392897.52', value: '392897.52' },
          { id: 'numeric_mm7b9ahr', text: '2916764.64', value: '2916764.64' },
          { id: 'color_mm7bm385', text: 'Partially Billed', value: null },
          { id: 'color_mm7bc4kf', text: 'Open', value: null },
        ],
      };

      const normalized = normalizeWorkOrder(rawWO);

      expect(normalized.id).toBe('2862957456');
      expect(normalized.name).toBe('Pumbaa');
      expect(normalized.companyCode).toBe('WOCOMPANY_047');
      expect(normalized.dealCode).toBe('SDPLDEAL-001');
      expect(normalized.projectType).toBe('Annual Rate Contract');
      expect(normalized.executionMonth).toBe('June');
      expect(normalized.executionStatus).toBe('Ongoing');
      expect(normalized.lifecycleStatus).toBe('Open');
      expect(normalized.billingStatus).toBe('Partially Billed');
      expect(normalized.ownerCode).toBe('OWNER_005');
      expect(normalized.sector).toBe('Renewables');
      expect(normalized.orderDate).toBe('2025-05-15');
      expect(normalized.startDate).toBe('2025-05-19');
      expect(normalized.endDate).toBe('2025-11-19');
      expect(normalized.executionDate).toBe('2025-08-01');
      expect(normalized.invoiceDate).toBe('2025-09-06');
      expect(normalized.invoiceNumber).toBe('SDPL/FY25-26/431');

      // Source Financials
      expect(normalized.amountExclGst).toBe(3995568);
      expect(normalized.amountInclGst).toBe(4714770.24);
      expect(normalized.billedValueExclGst).toBe(3662604);
      expect(normalized.billedValueInclGst).toBe(4321872.72);
      expect(normalized.collectedAmountInclGst).toBe(1405108.08);
      expect(normalized.amountToBeBilledExclGst).toBe(332964);
      expect(normalized.amountToBeBilledInclGst).toBe(392897.52);
      expect(normalized.amountReceivable).toBe(2916764.64);

      // Derived Financials
      expect(normalized.derivedReceivableAmount).toBe(2916764.64); // 4321872.72 - 1405108.08
      expect(normalized.derivedAmountToBeBilledExclGst).toBe(332964); // 3995568 - 3662604
      expect(normalized.derivedAmountToBeBilledInclGst).toBe(392897.52); // 4714770.24 - 4321872.72
    });

    it('batch normalizes lists cleanly', () => {
      expect(normalizeDeals([])).toEqual([]);
      expect(normalizeWorkOrders([])).toEqual([]);
    });
  });
});
