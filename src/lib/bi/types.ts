import { RawMondayItem } from '@/lib/monday/types';

/**
 * Normalized representation of a Deal from Monday.com Deals board
 * (Source: Deals Board 5031418651)
 */
export interface NormalizedDeal {
  id: string;
  name: string;
  ownerCode: string | null; // Source: "Owner code" (color_mm7bdx2e)
  clientCode: string | null; // Source: "Client Code" (dropdown_mm7b4q06)
  dealStatus: string | null; // Source: "Deal Status" (color_mm7bp3k2)
  dealStage: string | null; // Source: "Deal Stage" (color_mm7bdmsx)
  closureProbability: string | null; // Source: "Closure Probability" (color_mm7b86qv)
  dealValue: number | null; // Source: "Masked Deal value" (numeric_mm7b65d9)
  productDeal: string | null; // Source: "Product deal" (color_mm7bjgfq)
  sector: string | null; // Source: "Sector/service" (color_mm7bsqa2)
  closeDate: string | null; // Source: "Close Date (A)" (date_mm7be867) ISO YYYY-MM-DD
  tentativeCloseDate: string | null; // Source: "Tentative Close Date" (date_mm7bqvbc) ISO YYYY-MM-DD
  createdDate: string | null; // Source: "Created Date" (date_mm7b4hyz) ISO YYYY-MM-DD
  raw: RawMondayItem;
}

/**
 * Normalized representation of a Work Order from Monday.com Work Orders board
 * (Source: Work Orders Board 5031418671)
 */
export interface NormalizedWorkOrder {
  id: string;
  name: string;
  companyCode: string | null; // Source: "WOCOMPANY_..." (dropdown_mm7bj008)
  dealCode: string | null; // Source: "SDPLDEAL-..." (dropdown_mm7bw1hf)
  projectType: string | null; // Source: "Project Type" (color_mm7bfa0f)
  executionMonth: string | null; // Source: "Month" (color_mm7b94mp)
  executionStatus: string | null; // Source: "Execution Status" (color_mm7bbmdb)
  lifecycleStatus: string | null; // Source: "Lifecycle Status" (color_mm7bc4kf)
  billingStatus: string | null; // Source: "Billing Status" (color_mm7bm385)
  billingProcessStatus: string | null; // Source: "Billing Process Status" (color_mm7b8am8)
  ownerCode: string | null; // Source: "Owner Code" (color_mm7bh02a)
  sector: string | null; // Source: "Sector" (color_mm7be3tw)
  serviceScope: string | null; // Source: "Service Scope" (color_mm7bshmw)
  product: string | null; // Source: "Product" (color_mm7bhhg4)
  orderDocType: string | null; // Source: "Order Doc Type" (color_mm7bd84s)
  invoiceNumber: string | null; // Source: "Invoice Number" (dropdown_mm7bjhwg)

  // Date Dimensions
  orderDate: string | null; // Source: "PO / Order Date" (date_mm7byqf4) ISO YYYY-MM-DD
  startDate: string | null; // Source: "Work Start Date" (date_mm7b2nps) ISO YYYY-MM-DD
  endDate: string | null; // Source: "Work End Date" (date_mm7bjkd5) ISO YYYY-MM-DD
  executionDate: string | null; // Source: "Execution Date" (date_mm7bygeg) ISO YYYY-MM-DD
  invoiceDate: string | null; // Source: "Invoice Date" (date_mm7b2fv2) ISO YYYY-MM-DD

  // Exact Source Financial Fields (Rupees)
  amountExclGst: number | null; // Source: "Amount in Rupees (Excl. of GST)" (numeric_mm7bnav4)
  amountInclGst: number | null; // Source: "Amount in Rupees (Incl. of GST)" (numeric_mm7btzx2)
  billedValueExclGst: number | null; // Source: "Billed Value in Rupees (Excl. of GST)" (numeric_mm7bexxg)
  billedValueInclGst: number | null; // Source: "Billed Value in Rupees (Incl. of GST)" (numeric_mm7bkxax)
  collectedAmountInclGst: number | null; // Source: "Collected Amount in Rupees (Incl. of GST)" (numeric_mm7b7qat)
  amountToBeBilledExclGst: number | null; // Source: "Amount to be billed in Rs. (Excl. of GST)" (numeric_mm7b49n6)
  amountToBeBilledInclGst: number | null; // Source: "Amount to be billed in Rs. (Incl. of GST)" (numeric_mm7bn6fr)
  amountReceivable: number | null; // Source: "Amount Receivable" (numeric_mm7b9ahr)

  // Explicitly Labeled Derived Financial Values (Preserves separation from source values)
  derivedReceivableAmount: number | null; // DERIVED: billedValueInclGst - collectedAmountInclGst
  derivedAmountToBeBilledExclGst: number | null; // DERIVED: amountExclGst - billedValueExclGst
  derivedAmountToBeBilledInclGst: number | null; // DERIVED: amountInclGst - billedValueInclGst

  raw: RawMondayItem;
}

/**
 * Data Quality Issue details
 */
export interface DataQualityIssue {
  recordId: string;
  recordName: string;
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  rawValue?: unknown;
}

/**
 * Data Quality Profiler Report
 */
export interface DataQualityReport {
  boardId: string;
  boardName: string;
  generatedAt: string;
  totalRecords: number;
  validRecords: number;
  recordsWithIssues: number;
  missingFieldCounts: Record<string, number>;
  invalidDateCounts: Record<string, number>;
  invalidNumericCounts: Record<string, number>;
  unknownStatuses: Record<string, string[]>;
  potentialDuplicates: Array<{
    id1: string;
    id2: string;
    name: string;
    reason: string;
  }>;
  inconsistencies: Array<{
    recordId: string;
    recordName: string;
    reason: string;
  }>;
  exclusions: Array<{
    recordId: string;
    reason: string;
    metricImpact: string;
  }>;
}

/**
 * Date filtering options
 */
export type DatePeriodType =
  | 'all'
  | 'current_quarter'
  | 'previous_quarter'
  | 'current_month'
  | 'current_year'
  | 'custom_range';

export type DealDateField = 'closeDate' | 'tentativeCloseDate' | 'createdDate';
export type WorkOrderDateField =
  | 'orderDate'
  | 'startDate'
  | 'endDate'
  | 'executionDate'
  | 'invoiceDate';

export interface DateFilterOptions {
  period?: DatePeriodType;
  startDate?: string; // ISO 'YYYY-MM-DD'
  endDate?: string; // ISO 'YYYY-MM-DD'
  dateField?: string;
  referenceDate?: Date; // Allows deterministic testing
}

/**
 * Filter options for BI queries
 */
export interface MetricFilterOptions extends DateFilterOptions {
  sector?: string;
  dealStatus?: string;
  dealStage?: string;
  ownerCode?: string;
  executionStatus?: string;
  billingStatus?: string;
  lifecycleStatus?: string;
  [key: string]: unknown;
}

/**
 * Standardized BI Result contract for AI and UI consumption
 */
export interface BIResult<T = number | Record<string, number>> {
  metric: string;
  value: T;
  unit: 'INR' | 'count' | 'percentage' | 'ratio' | 'summary';
  sourceBoard: 'deals' | 'work_orders' | 'cross_board';
  period: string;
  filters: Record<string, unknown>;
  recordsConsidered: number;
  recordsExcluded: number;
  caveats: string[];
}
