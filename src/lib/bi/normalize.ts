import { RawMondayItem } from '@/lib/monday/types';
import { NormalizedDeal, NormalizedWorkOrder } from './types';

/**
 * Safely parses any value into a clean number or null without losing precision or throwing.
 * Handles strings with commas, currency symbols, and whitespace.
 */
export function parseNumber(val: unknown): number | null {
  if (val === null || val === undefined) return null;

  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : null;
  }

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;

    // Clean out commas, spaces, currency symbols (₹, $, €)
    const cleaned = trimmed.replace(/,/g, '').replace(/[₹$€\s]/g, '');
    if (!cleaned) return null;

    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  }

  return null;
}

/**
 * Safely parses string inputs and Monday JSON structures into trimmed strings or null.
 */
export function parseString(val: unknown): string | null {
  if (val === null || val === undefined) return null;

  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof val === 'object') {
    try {
      const obj = val as Record<string, unknown>;
      if (typeof obj['text'] === 'string') {
        const trimmed = obj['text'].trim();
        return trimmed.length > 0 ? trimmed : null;
      }
      if (typeof obj['label'] === 'string') {
        const trimmed = obj['label'].trim();
        return trimmed.length > 0 ? trimmed : null;
      }
    } catch {
      // Ignore
    }
  }

  return null;
}

/**
 * Safely parses ISO or date strings into standardized YYYY-MM-DD format or null.
 */
export function parseDate(val: unknown): string | null {
  if (!val) return null;

  let dateStr: string | null = null;

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;

    // Check if it's Monday stringified JSON { "date": "2025-05-15" }
    if (trimmed.startsWith('{') && trimmed.includes('"date"')) {
      try {
        const parsed = JSON.parse(trimmed) as { date?: string };
        if (parsed.date) dateStr = parsed.date;
      } catch {
        // Fallback to raw string
        dateStr = trimmed;
      }
    } else {
      dateStr = trimmed;
    }
  } else if (typeof val === 'object' && val !== null) {
    const obj = val as { date?: string; text?: string };
    if (obj.date && typeof obj.date === 'string') {
      dateStr = obj.date;
    } else if (obj.text && typeof obj.text === 'string') {
      dateStr = obj.text;
    }
  }

  if (!dateStr) return null;

  // Extract YYYY-MM-DD from string or Date parse
  const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch && isoMatch[1] && isoMatch[2] && isoMatch[3]) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);

    // Validate calendar bounds
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      return `${year}-${monthStr}-${dayStr}`;
    }
  }

  const parsedDate = new Date(dateStr);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString().split('T')[0] ?? null;
  }

  return null;
}

/**
 * Normalizes sector name without destructive merging
 */
export function normalizeSector(sector: unknown): string | null {
  const str = parseString(sector);
  if (!str) return null;

  // Preserve proper capitalization and trim
  return str.trim();
}

/**
 * Helper to retrieve column text/value from RawMondayItem by ID
 */
function getColumn(
  item: RawMondayItem,
  colId: string
): { text: string | null; value: string | null } {
  const found = item.column_values?.find((c) => c.id === colId);
  return {
    text: found?.text ?? null,
    value: found?.value ?? null,
  };
}

/**
 * Normalizes a single Deal item
 */
export function normalizeDeal(raw: RawMondayItem): NormalizedDeal {
  // Deals Board Column IDs (Board: 5031418651)
  const ownerCol = getColumn(raw, 'color_mm7bdx2e');
  const clientCol = getColumn(raw, 'dropdown_mm7b4q06');
  const statusCol = getColumn(raw, 'color_mm7bp3k2');
  const closeDateCol = getColumn(raw, 'date_mm7be867');
  const probCol = getColumn(raw, 'color_mm7b86qv');
  const dealValueCol = getColumn(raw, 'numeric_mm7b65d9');
  const tentCloseDateCol = getColumn(raw, 'date_mm7bqvbc');
  const stageCol = getColumn(raw, 'color_mm7bdmsx');
  const productCol = getColumn(raw, 'color_mm7bjgfq');
  const sectorCol = getColumn(raw, 'color_mm7bsqa2');
  const createdDateCol = getColumn(raw, 'date_mm7b4hyz');

  const dealValue = parseNumber(dealValueCol.text ?? dealValueCol.value);

  return {
    id: raw.id,
    name: parseString(raw.name) ?? `Deal #${raw.id}`,
    ownerCode: parseString(ownerCol.text),
    clientCode: parseString(clientCol.text),
    dealStatus: parseString(statusCol.text),
    dealStage: parseString(stageCol.text),
    closureProbability: parseString(probCol.text),
    dealValue,
    productDeal: parseString(productCol.text),
    sector: normalizeSector(sectorCol.text),
    closeDate: parseDate(closeDateCol.text || closeDateCol.value),
    tentativeCloseDate: parseDate(tentCloseDateCol.text || tentCloseDateCol.value),
    createdDate: parseDate(createdDateCol.text || createdDateCol.value || raw.created_at),
    raw,
  };
}

/**
 * Normalizes a list of raw Deals items
 */
export function normalizeDeals(rawItems: RawMondayItem[]): NormalizedDeal[] {
  if (!Array.isArray(rawItems)) return [];
  return rawItems.map(normalizeDeal);
}

/**
 * Normalizes a single Work Order item
 */
export function normalizeWorkOrder(raw: RawMondayItem): NormalizedWorkOrder {
  // Work Order Column IDs (Board: 5031418671)
  const companyCol = getColumn(raw, 'dropdown_mm7bj008');
  const dealCodeCol = getColumn(raw, 'dropdown_mm7bw1hf');
  const projectTypeCol = getColumn(raw, 'color_mm7bfa0f');
  const monthCol = getColumn(raw, 'color_mm7b94mp');
  const execStatusCol = getColumn(raw, 'color_mm7bbmdb');
  const orderDateCol = getColumn(raw, 'date_mm7byqf4');
  const orderDocTypeCol = getColumn(raw, 'color_mm7bd84s');
  const startDateCol = getColumn(raw, 'date_mm7b2nps');
  const endDateCol = getColumn(raw, 'date_mm7bjkd5');
  const ownerCol = getColumn(raw, 'color_mm7bh02a');
  const sectorCol = getColumn(raw, 'color_mm7be3tw');
  const serviceScopeCol = getColumn(raw, 'color_mm7bshmw');
  const productCol = getColumn(raw, 'color_mm7bhhg4');
  const invoiceDateCol = getColumn(raw, 'date_mm7b2fv2');
  const executionDateCol = getColumn(raw, 'date_mm7bygeg');
  const invoiceNumberCol = getColumn(raw, 'dropdown_mm7bjhwg');

  // Exact Source Financial Columns
  const amountExclGst = parseNumber(getColumn(raw, 'numeric_mm7bnav4').text ?? getColumn(raw, 'numeric_mm7bnav4').value);
  const amountInclGst = parseNumber(getColumn(raw, 'numeric_mm7btzx2').text ?? getColumn(raw, 'numeric_mm7btzx2').value);
  const billedValueExclGst = parseNumber(getColumn(raw, 'numeric_mm7bexxg').text ?? getColumn(raw, 'numeric_mm7bexxg').value);
  const billedValueInclGst = parseNumber(getColumn(raw, 'numeric_mm7bkxax').text ?? getColumn(raw, 'numeric_mm7bkxax').value);
  const collectedAmountInclGst = parseNumber(getColumn(raw, 'numeric_mm7b7qat').text ?? getColumn(raw, 'numeric_mm7b7qat').value);
  const amountToBeBilledExclGst = parseNumber(getColumn(raw, 'numeric_mm7b49n6').text ?? getColumn(raw, 'numeric_mm7b49n6').value);
  const amountToBeBilledInclGst = parseNumber(getColumn(raw, 'numeric_mm7bn6fr').text ?? getColumn(raw, 'numeric_mm7bn6fr').value);
  const amountReceivable = parseNumber(getColumn(raw, 'numeric_mm7b9ahr').text ?? getColumn(raw, 'numeric_mm7b9ahr').value);

  // Statuses
  const billingStatusCol = getColumn(raw, 'color_mm7bm385');
  const lifecycleStatusCol = getColumn(raw, 'color_mm7bc4kf');
  const billingProcessStatusCol = getColumn(raw, 'color_mm7b8am8');

  // Explicitly labeled DERIVED metrics (separated from source values)
  const derivedReceivableAmount =
    billedValueInclGst !== null && collectedAmountInclGst !== null
      ? Math.round((billedValueInclGst - collectedAmountInclGst) * 100) / 100
      : null;

  const derivedAmountToBeBilledExclGst =
    amountExclGst !== null && billedValueExclGst !== null
      ? Math.round((amountExclGst - billedValueExclGst) * 100) / 100
      : null;

  const derivedAmountToBeBilledInclGst =
    amountInclGst !== null && billedValueInclGst !== null
      ? Math.round((amountInclGst - billedValueInclGst) * 100) / 100
      : null;

  return {
    id: raw.id,
    name: parseString(raw.name) ?? `Work Order #${raw.id}`,
    companyCode: parseString(companyCol.text),
    dealCode: parseString(dealCodeCol.text),
    projectType: parseString(projectTypeCol.text),
    executionMonth: parseString(monthCol.text),
    executionStatus: parseString(execStatusCol.text),
    lifecycleStatus: parseString(lifecycleStatusCol.text),
    billingStatus: parseString(billingStatusCol.text),
    billingProcessStatus: parseString(billingProcessStatusCol.text),
    ownerCode: parseString(ownerCol.text),
    sector: normalizeSector(sectorCol.text),
    serviceScope: parseString(serviceScopeCol.text),
    product: parseString(productCol.text),
    orderDocType: parseString(orderDocTypeCol.text),
    invoiceNumber: parseString(invoiceNumberCol.text),

    orderDate: parseDate(orderDateCol.text || orderDateCol.value),
    startDate: parseDate(startDateCol.text || startDateCol.value),
    endDate: parseDate(endDateCol.text || endDateCol.value),
    executionDate: parseDate(executionDateCol.text || executionDateCol.value),
    invoiceDate: parseDate(invoiceDateCol.text || invoiceDateCol.value),

    // Source Financials
    amountExclGst,
    amountInclGst,
    billedValueExclGst,
    billedValueInclGst,
    collectedAmountInclGst,
    amountToBeBilledExclGst,
    amountToBeBilledInclGst,
    amountReceivable,

    // Derived Financials
    derivedReceivableAmount,
    derivedAmountToBeBilledExclGst,
    derivedAmountToBeBilledInclGst,

    raw,
  };
}

/**
 * Normalizes a list of raw Work Order items
 */
export function normalizeWorkOrders(rawItems: RawMondayItem[]): NormalizedWorkOrder[] {
  if (!Array.isArray(rawItems)) return [];
  return rawItems.map(normalizeWorkOrder);
}
