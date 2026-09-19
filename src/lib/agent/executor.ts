import { MondayClient } from '@/lib/monday/client';
import { getMondayConfig } from '@/lib/monday/config';
import { normalizeDeals, normalizeWorkOrders } from '@/lib/bi/normalize';
import { profileDealsQuality, profileWorkOrdersQuality } from '@/lib/bi/data-quality';
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
} from '@/lib/bi/metrics';
import { BIResult, DataQualityReport, MetricFilterOptions, NormalizedDeal, NormalizedWorkOrder } from '@/lib/bi/types';
import { QuerySpec } from './types';

export interface ExecutionContext {
  mondayClient?: MondayClient;
  preloadedDeals?: NormalizedDeal[];
  preloadedWorkOrders?: NormalizedWorkOrder[];
  referenceDate?: Date;
}

export interface ExecutionResult {
  results: BIResult[];
  dataQuality: DataQualityReport[];
}

export async function executeQuerySpec(
  spec: QuerySpec,
  ctx?: ExecutionContext
): Promise<ExecutionResult> {
  let normalizedDeals: NormalizedDeal[] = ctx?.preloadedDeals ?? [];
  let normalizedWorkOrders: NormalizedWorkOrder[] = ctx?.preloadedWorkOrders ?? [];

  let client: MondayClient | undefined = ctx?.mondayClient;
  const getClient = (): MondayClient => {
    if (!client) {
      const config = getMondayConfig();
      client = new MondayClient(config);
    }
    return client;
  };

  // Fetch Deals if required and not preloaded
  if ((spec.dataset === 'deals' || spec.dataset === 'both') && !ctx?.preloadedDeals) {
    const dealsBoardId = process.env.MONDAY_DEALS_BOARD_ID?.trim() || '5031418651';
    const snapshot = await getClient().fetchBoardSnapshot(dealsBoardId);
    normalizedDeals = normalizeDeals(snapshot.items);
  }

  // Fetch Work Orders if required and not preloaded
  if ((spec.dataset === 'work_orders' || spec.dataset === 'both') && !ctx?.preloadedWorkOrders) {
    const woBoardId = process.env.MONDAY_WORK_ORDERS_BOARD_ID?.trim() || '5031418671';
    const snapshot = await getClient().fetchBoardSnapshot(woBoardId);
    normalizedWorkOrders = normalizeWorkOrders(snapshot.items);
  }

  // Profile Data Quality
  const dataQualityReports: DataQualityReport[] = [];
  if (normalizedDeals.length > 0) {
    dataQualityReports.push(profileDealsQuality(normalizedDeals));
  }
  if (normalizedWorkOrders.length > 0) {
    dataQualityReports.push(profileWorkOrdersQuality(normalizedWorkOrders));
  }

  const filterOptions: MetricFilterOptions = {
    sector: spec.sector,
    dealStatus: spec.status,
    dealStage: spec.stage,
    ownerCode: spec.owner,
    executionStatus: spec.status,
    period: spec.dateRange?.period,
    startDate: spec.dateRange?.startDate,
    endDate: spec.dateRange?.endDate,
    dateField: spec.dateField,
    referenceDate: ctx?.referenceDate,
  };

  const results: BIResult[] = [];

  switch (spec.metric) {
    // --- DEALS METRICS ---
    case 'deal_count':
      results.push(calculateDealCount(normalizedDeals, filterOptions));
      break;

    case 'total_deal_value':
      results.push(calculateTotalDealValue(normalizedDeals, filterOptions));
      break;

    case 'deal_value_by_sector':
      results.push(calculateDealValueBySector(normalizedDeals, filterOptions));
      break;

    case 'deal_count_by_sector':
      results.push(calculateDealCountBySector(normalizedDeals, filterOptions));
      break;

    case 'deal_value_by_status':
      results.push(calculateDealValueByStatus(normalizedDeals, filterOptions));
      break;

    case 'deal_value_by_stage':
      results.push(calculateDealValueByStage(normalizedDeals, filterOptions));
      break;

    case 'deal_value_by_owner':
      results.push(calculateDealValueByOwner(normalizedDeals, filterOptions));
      break;

    // --- WORK ORDERS METRICS ---
    case 'work_order_count':
      results.push(calculateWorkOrderCount(normalizedWorkOrders, filterOptions));
      break;

    case 'work_order_amount_excl_gst':
      results.push(calculateTotalWorkOrderAmountExclGst(normalizedWorkOrders, filterOptions));
      break;

    case 'work_order_amount_incl_gst':
      results.push(calculateTotalWorkOrderAmountInclGst(normalizedWorkOrders, filterOptions));
      break;

    case 'billed_value_excl_gst':
      results.push(calculateTotalBilledValueExclGst(normalizedWorkOrders, filterOptions));
      break;

    case 'billed_value_incl_gst':
      results.push(calculateTotalBilledValueInclGst(normalizedWorkOrders, filterOptions));
      break;

    case 'collected_amount_incl_gst':
      results.push(calculateTotalCollectedAmountInclGst(normalizedWorkOrders, filterOptions));
      break;

    case 'amount_to_be_billed_excl_gst':
      results.push(calculateTotalAmountToBeBilledExclGst(normalizedWorkOrders, filterOptions));
      break;

    case 'amount_to_be_billed_incl_gst':
      results.push(calculateTotalAmountToBeBilledInclGst(normalizedWorkOrders, filterOptions));
      break;

    case 'amount_receivable':
      results.push(calculateTotalAmountReceivable(normalizedWorkOrders, filterOptions));
      break;

    case 'derived_receivable_amount':
      results.push(calculateTotalDerivedReceivableAmount(normalizedWorkOrders, filterOptions));
      break;

    case 'derived_amount_to_be_billed_excl_gst':
      results.push(calculateTotalDerivedAmountToBeBilledExclGst(normalizedWorkOrders, filterOptions));
      break;

    case 'work_orders_by_sector':
      results.push(calculateWorkOrdersBySector(normalizedWorkOrders, 'amountExclGst', filterOptions));
      break;

    case 'work_orders_by_execution_status':
      results.push(calculateWorkOrdersByExecutionStatus(normalizedWorkOrders, filterOptions));
      break;

    case 'work_orders_by_billing_status':
      results.push(calculateWorkOrdersByBillingStatus(normalizedWorkOrders, filterOptions));
      break;

    // --- CROSS BOARD METRICS ---
    case 'cross_board_overview':
      results.push(calculateTotalDealValue(normalizedDeals, filterOptions));
      results.push(calculateTotalWorkOrderAmountExclGst(normalizedWorkOrders, filterOptions));
      results.push(calculateTotalBilledValueExclGst(normalizedWorkOrders, filterOptions));
      results.push(calculateTotalCollectedAmountInclGst(normalizedWorkOrders, filterOptions));
      results.push(calculateTotalAmountReceivable(normalizedWorkOrders, filterOptions));
      break;

    case 'cross_board_sector_summary':
      results.push(calculateDealValueBySector(normalizedDeals, filterOptions));
      results.push(calculateWorkOrdersBySector(normalizedWorkOrders, 'billedValueInclGst', filterOptions));
      break;

    default:
      throw new Error(`Unsupported metric requested: "${spec.metric}"`);
  }

  return {
    results,
    dataQuality: dataQualityReports,
  };
}
