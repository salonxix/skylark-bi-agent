import {
  BIResult,
  DateFilterOptions,
  MetricFilterOptions,
  NormalizedDeal,
  NormalizedWorkOrder,
} from './types';

/**
 * Calculates date range bounds deterministically based on period type and reference date
 */
export function getDateRangeBounds(options: DateFilterOptions): {
  start: string | null;
  end: string | null;
  periodLabel: string;
} {
  const ref = options.referenceDate ?? new Date();
  const period = options.period ?? 'all';

  if (period === 'all') {
    return { start: null, end: null, periodLabel: 'All Time' };
  }

  if (period === 'custom_range') {
    const start = options.startDate ?? null;
    const end = options.endDate ?? null;
    return {
      start,
      end,
      periodLabel: start && end ? `${start} to ${end}` : start ? `From ${start}` : end ? `Until ${end}` : 'Custom Range',
    };
  }

  const year = ref.getFullYear();
  const month = ref.getMonth(); // 0-indexed (0 = Jan)

  if (period === 'current_year') {
    return {
      start: `${year}-01-01`,
      end: `${year}-12-31`,
      periodLabel: `Year ${year}`,
    };
  }

  if (period === 'current_month') {
    const mStr = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    return {
      start: `${year}-${mStr}-01`,
      end: `${year}-${mStr}-${lastDay}`,
      periodLabel: `Month ${year}-${mStr}`,
    };
  }

  if (period === 'current_quarter') {
    const q = Math.floor(month / 3) + 1;
    const startMonth = (q - 1) * 3 + 1;
    const endMonth = q * 3;
    const sStr = startMonth < 10 ? `0${startMonth}` : `${startMonth}`;
    const eStr = endMonth < 10 ? `0${endMonth}` : `${endMonth}`;
    const lastDay = new Date(year, endMonth, 0).getDate();
    return {
      start: `${year}-${sStr}-01`,
      end: `${year}-${eStr}-${lastDay}`,
      periodLabel: `Q${q} ${year}`,
    };
  }

  if (period === 'previous_quarter') {
    let q = Math.floor(month / 3);
    let qYear = year;
    if (q === 0) {
      q = 4;
      qYear = year - 1;
    }
    const startMonth = (q - 1) * 3 + 1;
    const endMonth = q * 3;
    const sStr = startMonth < 10 ? `0${startMonth}` : `${startMonth}`;
    const eStr = endMonth < 10 ? `0${endMonth}` : `${endMonth}`;
    const lastDay = new Date(qYear, endMonth, 0).getDate();
    return {
      start: `${qYear}-${sStr}-01`,
      end: `${qYear}-${eStr}-${lastDay}`,
      periodLabel: `Q${q} ${qYear}`,
    };
  }

  return { start: null, end: null, periodLabel: 'All Time' };
}

/**
 * Filters Deals deterministically by options
 */
export function filterDeals(
  deals: NormalizedDeal[],
  filters: MetricFilterOptions = {}
): {
  filtered: NormalizedDeal[];
  excludedCount: number;
  periodLabel: string;
  caveats: string[];
} {
  const { start, end, periodLabel } = getDateRangeBounds(filters);
  const dateField = (filters.dateField ?? 'closeDate') as keyof Pick<
    NormalizedDeal,
    'closeDate' | 'tentativeCloseDate' | 'createdDate'
  >;

  const caveats: string[] = [];
  if (filters.period && filters.period !== 'all') {
    caveats.push(`Filtered by ${dateField} within ${periodLabel}`);
  }

  let excludedCount = 0;
  const filtered = deals.filter((deal) => {
    if (filters.sector && deal.sector?.toLowerCase() !== filters.sector.toLowerCase()) {
      return false;
    }
    if (filters.dealStatus && deal.dealStatus?.toLowerCase() !== filters.dealStatus.toLowerCase()) {
      return false;
    }
    if (filters.dealStage && deal.dealStage?.toLowerCase() !== filters.dealStage.toLowerCase()) {
      return false;
    }
    if (filters.ownerCode && deal.ownerCode?.toLowerCase() !== filters.ownerCode.toLowerCase()) {
      return false;
    }

    if (start || end) {
      const recordDate = deal[dateField];
      if (!recordDate) {
        excludedCount++;
        return false;
      }
      if (start && recordDate < start) return false;
      if (end && recordDate > end) return false;
    }

    return true;
  });

  return { filtered, excludedCount, periodLabel, caveats };
}

/**
 * Filters Work Orders deterministically by options
 */
export function filterWorkOrders(
  wos: NormalizedWorkOrder[],
  filters: MetricFilterOptions = {}
): {
  filtered: NormalizedWorkOrder[];
  excludedCount: number;
  periodLabel: string;
  caveats: string[];
} {
  const { start, end, periodLabel } = getDateRangeBounds(filters);
  const dateField = (filters.dateField ?? 'orderDate') as keyof Pick<
    NormalizedWorkOrder,
    'orderDate' | 'startDate' | 'endDate' | 'executionDate' | 'invoiceDate'
  >;

  const caveats: string[] = [];
  if (filters.period && filters.period !== 'all') {
    caveats.push(`Filtered by ${dateField} within ${periodLabel}`);
  }

  let excludedCount = 0;
  const filtered = wos.filter((wo) => {
    if (filters.sector && wo.sector?.toLowerCase() !== filters.sector.toLowerCase()) {
      return false;
    }
    if (filters.executionStatus && wo.executionStatus?.toLowerCase() !== filters.executionStatus.toLowerCase()) {
      return false;
    }
    if (filters.billingStatus && wo.billingStatus?.toLowerCase() !== filters.billingStatus.toLowerCase()) {
      return false;
    }
    if (filters.lifecycleStatus && wo.lifecycleStatus?.toLowerCase() !== filters.lifecycleStatus.toLowerCase()) {
      return false;
    }
    if (filters.ownerCode && wo.ownerCode?.toLowerCase() !== filters.ownerCode.toLowerCase()) {
      return false;
    }

    if (start || end) {
      const recordDate = wo[dateField];
      if (!recordDate) {
        excludedCount++;
        return false;
      }
      if (start && recordDate < start) return false;
      if (end && recordDate > end) return false;
    }

    return true;
  });

  return { filtered, excludedCount, periodLabel, caveats };
}

// ==========================================
// DEALS DETERMINISTIC METRICS
// ==========================================

export function calculateDealCount(
  deals: NormalizedDeal[],
  filters: MetricFilterOptions = {}
): BIResult<number> {
  const { filtered, excludedCount, periodLabel, caveats } = filterDeals(deals, filters);
  return {
    metric: 'deal_count',
    value: filtered.length,
    unit: 'count',
    sourceBoard: 'deals',
    period: periodLabel,
    filters,
    recordsConsidered: filtered.length,
    recordsExcluded: excludedCount,
    caveats,
  };
}

export function calculateTotalDealValue(
  deals: NormalizedDeal[],
  filters: MetricFilterOptions = {}
): BIResult<number> {
  const { filtered, excludedCount, periodLabel, caveats } = filterDeals(deals, filters);

  let nullValueCount = 0;
  const total = filtered.reduce((sum, deal) => {
    if (deal.dealValue === null) {
      nullValueCount++;
      return sum;
    }
    return sum + deal.dealValue;
  }, 0);

  if (nullValueCount > 0) {
    caveats.push(`${nullValueCount} deals had missing/non-numeric dealValue and were excluded from sum`);
  }

  return {
    metric: 'total_deal_value',
    value: Math.round(total * 100) / 100,
    unit: 'INR',
    sourceBoard: 'deals',
    period: periodLabel,
    filters,
    recordsConsidered: filtered.length - nullValueCount,
    recordsExcluded: excludedCount + nullValueCount,
    caveats,
  };
}

export function calculateDealValueBySector(
  deals: NormalizedDeal[],
  filters: MetricFilterOptions = {}
): BIResult<Record<string, number>> {
  const { filtered, excludedCount, periodLabel, caveats } = filterDeals(deals, filters);

  const breakdown: Record<string, number> = {};
  let nullSectorCount = 0;

  for (const deal of filtered) {
    if (deal.dealValue === null) continue;
    const sector = deal.sector || 'Unassigned';
    if (!deal.sector) nullSectorCount++;
    breakdown[sector] = (breakdown[sector] ?? 0) + deal.dealValue;
  }

  for (const k in breakdown) {
    breakdown[k] = Math.round((breakdown[k] ?? 0) * 100) / 100;
  }

  if (nullSectorCount > 0) {
    caveats.push(`${nullSectorCount} records had no sector and were categorized under 'Unassigned'`);
  }

  return {
    metric: 'deal_value_by_sector',
    value: breakdown,
    unit: 'INR',
    sourceBoard: 'deals',
    period: periodLabel,
    filters,
    recordsConsidered: filtered.length,
    recordsExcluded: excludedCount,
    caveats,
  };
}

export function calculateDealCountBySector(
  deals: NormalizedDeal[],
  filters: MetricFilterOptions = {}
): BIResult<Record<string, number>> {
  const { filtered, excludedCount, periodLabel, caveats } = filterDeals(deals, filters);

  const breakdown: Record<string, number> = {};
  for (const deal of filtered) {
    const sector = deal.sector || 'Unassigned';
    breakdown[sector] = (breakdown[sector] ?? 0) + 1;
  }

  return {
    metric: 'deal_count_by_sector',
    value: breakdown,
    unit: 'count',
    sourceBoard: 'deals',
    period: periodLabel,
    filters,
    recordsConsidered: filtered.length,
    recordsExcluded: excludedCount,
    caveats,
  };
}

export function calculateDealValueByStatus(
  deals: NormalizedDeal[],
  filters: MetricFilterOptions = {}
): BIResult<Record<string, number>> {
  const { filtered, excludedCount, periodLabel, caveats } = filterDeals(deals, filters);

  const breakdown: Record<string, number> = {};
  for (const deal of filtered) {
    if (deal.dealValue === null) continue;
    const status = deal.dealStatus || 'Unassigned';
    breakdown[status] = (breakdown[status] ?? 0) + deal.dealValue;
  }

  for (const k in breakdown) {
    breakdown[k] = Math.round((breakdown[k] ?? 0) * 100) / 100;
  }

  return {
    metric: 'deal_value_by_status',
    value: breakdown,
    unit: 'INR',
    sourceBoard: 'deals',
    period: periodLabel,
    filters,
    recordsConsidered: filtered.length,
    recordsExcluded: excludedCount,
    caveats,
  };
}

export function calculateDealValueByStage(
  deals: NormalizedDeal[],
  filters: MetricFilterOptions = {}
): BIResult<Record<string, number>> {
  const { filtered, excludedCount, periodLabel, caveats } = filterDeals(deals, filters);

  const breakdown: Record<string, number> = {};
  for (const deal of filtered) {
    if (deal.dealValue === null) continue;
    const stage = deal.dealStage || 'Unassigned';
    breakdown[stage] = (breakdown[stage] ?? 0) + deal.dealValue;
  }

  for (const k in breakdown) {
    breakdown[k] = Math.round((breakdown[k] ?? 0) * 100) / 100;
  }

  return {
    metric: 'deal_value_by_stage',
    value: breakdown,
    unit: 'INR',
    sourceBoard: 'deals',
    period: periodLabel,
    filters,
    recordsConsidered: filtered.length,
    recordsExcluded: excludedCount,
    caveats,
  };
}

export function calculateDealValueByOwner(
  deals: NormalizedDeal[],
  filters: MetricFilterOptions = {}
): BIResult<Record<string, number>> {
  const { filtered, excludedCount, periodLabel, caveats } = filterDeals(deals, filters);

  const breakdown: Record<string, number> = {};
  for (const deal of filtered) {
    if (deal.dealValue === null) continue;
    const owner = deal.ownerCode || 'Unassigned';
    breakdown[owner] = (breakdown[owner] ?? 0) + deal.dealValue;
  }

  for (const k in breakdown) {
    breakdown[k] = Math.round((breakdown[k] ?? 0) * 100) / 100;
  }

  return {
    metric: 'deal_value_by_owner',
    value: breakdown,
    unit: 'INR',
    sourceBoard: 'deals',
    period: periodLabel,
    filters,
    recordsConsidered: filtered.length,
    recordsExcluded: excludedCount,
    caveats,
  };
}

// ==========================================
// WORK ORDERS DETERMINISTIC METRICS
// ==========================================

export function calculateWorkOrderCount(
  wos: NormalizedWorkOrder[],
  filters: MetricFilterOptions = {}
): BIResult<number> {
  const { filtered, excludedCount, periodLabel, caveats } = filterWorkOrders(wos, filters);
  return {
    metric: 'work_order_count',
    value: filtered.length,
    unit: 'count',
    sourceBoard: 'work_orders',
    period: periodLabel,
    filters,
    recordsConsidered: filtered.length,
    recordsExcluded: excludedCount,
    caveats,
  };
}

function calculateWorkOrderSum(
  wos: NormalizedWorkOrder[],
  field: keyof Pick<
    NormalizedWorkOrder,
    | 'amountExclGst'
    | 'amountInclGst'
    | 'billedValueExclGst'
    | 'billedValueInclGst'
    | 'collectedAmountInclGst'
    | 'amountToBeBilledExclGst'
    | 'amountToBeBilledInclGst'
    | 'amountReceivable'
    | 'derivedReceivableAmount'
    | 'derivedAmountToBeBilledExclGst'
    | 'derivedAmountToBeBilledInclGst'
  >,
  metricName: string,
  filters: MetricFilterOptions = {}
): BIResult<number> {
  const { filtered, excludedCount, periodLabel, caveats } = filterWorkOrders(wos, filters);

  let nullCount = 0;
  const total = filtered.reduce((sum, wo) => {
    const val = wo[field];
    if (val === null) {
      nullCount++;
      return sum;
    }
    return sum + val;
  }, 0);

  if (nullCount > 0) {
    caveats.push(`${nullCount} work orders had missing/non-numeric ${field} and were excluded from sum`);
  }

  return {
    metric: metricName,
    value: Math.round(total * 100) / 100,
    unit: 'INR',
    sourceBoard: 'work_orders',
    period: periodLabel,
    filters,
    recordsConsidered: filtered.length - nullCount,
    recordsExcluded: excludedCount + nullCount,
    caveats,
  };
}

// Source Financial Metrics
export const calculateTotalWorkOrderAmountExclGst = (wos: NormalizedWorkOrder[], f?: MetricFilterOptions) =>
  calculateWorkOrderSum(wos, 'amountExclGst', 'work_order_amount_excl_gst', f);

export const calculateTotalWorkOrderAmountInclGst = (wos: NormalizedWorkOrder[], f?: MetricFilterOptions) =>
  calculateWorkOrderSum(wos, 'amountInclGst', 'work_order_amount_incl_gst', f);

export const calculateTotalBilledValueExclGst = (wos: NormalizedWorkOrder[], f?: MetricFilterOptions) =>
  calculateWorkOrderSum(wos, 'billedValueExclGst', 'billed_value_excl_gst', f);

export const calculateTotalBilledValueInclGst = (wos: NormalizedWorkOrder[], f?: MetricFilterOptions) =>
  calculateWorkOrderSum(wos, 'billedValueInclGst', 'billed_value_incl_gst', f);

export const calculateTotalCollectedAmountInclGst = (wos: NormalizedWorkOrder[], f?: MetricFilterOptions) =>
  calculateWorkOrderSum(wos, 'collectedAmountInclGst', 'collected_amount_incl_gst', f);

export const calculateTotalAmountToBeBilledExclGst = (wos: NormalizedWorkOrder[], f?: MetricFilterOptions) =>
  calculateWorkOrderSum(wos, 'amountToBeBilledExclGst', 'amount_to_be_billed_excl_gst', f);

export const calculateTotalAmountToBeBilledInclGst = (wos: NormalizedWorkOrder[], f?: MetricFilterOptions) =>
  calculateWorkOrderSum(wos, 'amountToBeBilledInclGst', 'amount_to_be_billed_incl_gst', f);

export const calculateTotalAmountReceivable = (wos: NormalizedWorkOrder[], f?: MetricFilterOptions) =>
  calculateWorkOrderSum(wos, 'amountReceivable', 'amount_receivable', f);

// Explicitly Labeled Derived Metrics
export const calculateTotalDerivedReceivableAmount = (wos: NormalizedWorkOrder[], f?: MetricFilterOptions) =>
  calculateWorkOrderSum(wos, 'derivedReceivableAmount', 'derived_receivable_amount', f);

export const calculateTotalDerivedAmountToBeBilledExclGst = (wos: NormalizedWorkOrder[], f?: MetricFilterOptions) =>
  calculateWorkOrderSum(wos, 'derivedAmountToBeBilledExclGst', 'derived_amount_to_be_billed_excl_gst', f);

export function calculateWorkOrdersBySector(
  wos: NormalizedWorkOrder[],
  field: 'amountExclGst' | 'amountInclGst' | 'billedValueInclGst' | 'collectedAmountInclGst' = 'amountExclGst',
  filters: MetricFilterOptions = {}
): BIResult<Record<string, number>> {
  const { filtered, excludedCount, periodLabel, caveats } = filterWorkOrders(wos, filters);

  const breakdown: Record<string, number> = {};
  for (const wo of filtered) {
    const val = wo[field];
    if (val === null) continue;
    const sector = wo.sector || 'Unassigned';
    breakdown[sector] = (breakdown[sector] ?? 0) + val;
  }

  for (const k in breakdown) {
    breakdown[k] = Math.round((breakdown[k] ?? 0) * 100) / 100;
  }

  return {
    metric: `work_orders_${field}_by_sector`,
    value: breakdown,
    unit: 'INR',
    sourceBoard: 'work_orders',
    period: periodLabel,
    filters,
    recordsConsidered: filtered.length,
    recordsExcluded: excludedCount,
    caveats,
  };
}

export function calculateWorkOrdersByExecutionStatus(
  wos: NormalizedWorkOrder[],
  filters: MetricFilterOptions = {}
): BIResult<Record<string, number>> {
  const { filtered, excludedCount, periodLabel, caveats } = filterWorkOrders(wos, filters);

  const breakdown: Record<string, number> = {};
  for (const wo of filtered) {
    const status = wo.executionStatus || 'Unassigned';
    breakdown[status] = (breakdown[status] ?? 0) + 1;
  }

  return {
    metric: 'work_orders_by_execution_status',
    value: breakdown,
    unit: 'count',
    sourceBoard: 'work_orders',
    period: periodLabel,
    filters,
    recordsConsidered: filtered.length,
    recordsExcluded: excludedCount,
    caveats,
  };
}

export function calculateWorkOrdersByBillingStatus(
  wos: NormalizedWorkOrder[],
  filters: MetricFilterOptions = {}
): BIResult<Record<string, number>> {
  const { filtered, excludedCount, periodLabel, caveats } = filterWorkOrders(wos, filters);

  const breakdown: Record<string, number> = {};
  for (const wo of filtered) {
    const status = wo.billingStatus || 'Unassigned';
    breakdown[status] = (breakdown[status] ?? 0) + 1;
  }

  return {
    metric: 'work_orders_by_billing_status',
    value: breakdown,
    unit: 'count',
    sourceBoard: 'work_orders',
    period: periodLabel,
    filters,
    recordsConsidered: filtered.length,
    recordsExcluded: excludedCount,
    caveats,
  };
}
