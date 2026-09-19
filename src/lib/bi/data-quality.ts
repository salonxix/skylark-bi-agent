import { DataQualityReport, NormalizedDeal, NormalizedWorkOrder } from './types';

const KNOWN_DEAL_STATUSES = new Set(['Won', 'Lost', 'Open', 'On Hold', 'Abandoned']);
const KNOWN_DEAL_PROBABILITIES = new Set(['High', 'Medium', 'Low', 'Best Case', 'Commit']);
const KNOWN_WO_EXEC_STATUSES = new Set(['Completed', 'Ongoing', 'Executed until current month', 'Stuck', 'Cancelled']);
const KNOWN_WO_BILLING_STATUSES = new Set(['Fully Billed', 'Partially Billed', 'Not billed yet', 'Billed- Visit 7', 'Billed- Visit 3', 'Stuck']);

/**
 * Profiles data quality for normalized Deals records
 */
export function profileDealsQuality(
  deals: NormalizedDeal[],
  boardId = '5031418651',
  boardName = 'Deal funnel Data'
): DataQualityReport {
  const missingFieldCounts: Record<string, number> = {
    dealStatus: 0,
    dealStage: 0,
    dealValue: 0,
    sector: 0,
    ownerCode: 0,
    clientCode: 0,
    closeDate: 0,
    createdDate: 0,
  };

  const invalidDateCounts: Record<string, number> = {
    closeDate: 0,
    tentativeCloseDate: 0,
    createdDate: 0,
  };

  const invalidNumericCounts: Record<string, number> = {
    dealValue: 0,
  };

  const unknownStatuses: Record<string, string[]> = {
    dealStatus: [],
    closureProbability: [],
  };

  const potentialDuplicates: DataQualityReport['potentialDuplicates'] = [];
  const inconsistencies: DataQualityReport['inconsistencies'] = [];
  const exclusions: DataQualityReport['exclusions'] = [];

  const seenKeys = new Map<string, NormalizedDeal>();
  let recordsWithIssues = 0;

  for (const deal of deals) {
    let hasIssue = false;

    // 1. Missing Important Fields
    if (!deal.dealStatus) { missingFieldCounts.dealStatus!++; hasIssue = true; }
    if (!deal.dealStage) { missingFieldCounts.dealStage!++; hasIssue = true; }
    if (deal.dealValue === null) {
      missingFieldCounts.dealValue!++;
      hasIssue = true;
      exclusions.push({
        recordId: deal.id,
        reason: 'Missing or non-numeric dealValue (Masked Deal value)',
        metricImpact: 'Excluded from total deal value aggregations',
      });
    }
    if (!deal.sector) { missingFieldCounts.sector!++; hasIssue = true; }
    if (!deal.ownerCode) { missingFieldCounts.ownerCode!++; hasIssue = true; }
    if (!deal.clientCode) { missingFieldCounts.clientCode!++; hasIssue = true; }
    if (!deal.closeDate) { missingFieldCounts.closeDate!++; }
    if (!deal.createdDate) { missingFieldCounts.createdDate!++; }

    // 2. Invalid Numerics (e.g. negative deal value)
    if (deal.dealValue !== null && deal.dealValue < 0) {
      invalidNumericCounts.dealValue!++;
      hasIssue = true;
      inconsistencies.push({
        recordId: deal.id,
        recordName: deal.name,
        reason: `Negative deal value (${deal.dealValue})`,
      });
    }

    // 3. Unknown Statuses
    if (deal.dealStatus && !KNOWN_DEAL_STATUSES.has(deal.dealStatus)) {
      if (!unknownStatuses.dealStatus!.includes(deal.dealStatus)) {
        unknownStatuses.dealStatus!.push(deal.dealStatus);
      }
      hasIssue = true;
    }

    if (deal.closureProbability && !KNOWN_DEAL_PROBABILITIES.has(deal.closureProbability)) {
      if (!unknownStatuses.closureProbability!.includes(deal.closureProbability)) {
        unknownStatuses.closureProbability!.push(deal.closureProbability);
      }
    }

    // 4. Inconsistencies
    if (deal.dealStatus === 'Won' && !deal.closeDate) {
      inconsistencies.push({
        recordId: deal.id,
        recordName: deal.name,
        reason: 'Deal status is "Won" but Close Date (A) is missing',
      });
      hasIssue = true;
    }

    // 5. Potential Duplicate detection (Name + Owner + Client Code)
    const dupKey = `${deal.name.toLowerCase()}|${(deal.ownerCode || '').toLowerCase()}|${(deal.clientCode || '').toLowerCase()}`;
    if (seenKeys.has(dupKey)) {
      const prev = seenKeys.get(dupKey)!;
      potentialDuplicates.push({
        id1: prev.id,
        id2: deal.id,
        name: deal.name,
        reason: `Matching name, owner (${deal.ownerCode}), and client (${deal.clientCode})`,
      });
      hasIssue = true;
    } else {
      seenKeys.set(dupKey, deal);
    }

    if (hasIssue) {
      recordsWithIssues++;
    }
  }

  return {
    boardId,
    boardName,
    generatedAt: new Date().toISOString(),
    totalRecords: deals.length,
    validRecords: deals.length - recordsWithIssues,
    recordsWithIssues,
    missingFieldCounts,
    invalidDateCounts,
    invalidNumericCounts,
    unknownStatuses,
    potentialDuplicates,
    inconsistencies,
    exclusions,
  };
}

/**
 * Profiles data quality for normalized Work Orders records
 */
export function profileWorkOrdersQuality(
  wos: NormalizedWorkOrder[],
  boardId = '5031418671',
  boardName = 'Work_Order_Tracker Data'
): DataQualityReport {
  const missingFieldCounts: Record<string, number> = {
    companyCode: 0,
    dealCode: 0,
    sector: 0,
    ownerCode: 0,
    executionStatus: 0,
    billingStatus: 0,
    amountExclGst: 0,
    amountInclGst: 0,
    billedValueExclGst: 0,
    billedValueInclGst: 0,
    collectedAmountInclGst: 0,
    amountToBeBilledExclGst: 0,
    amountToBeBilledInclGst: 0,
    amountReceivable: 0,
    orderDate: 0,
    startDate: 0,
    endDate: 0,
  };

  const invalidDateCounts: Record<string, number> = {
    orderDate: 0,
    startDate: 0,
    endDate: 0,
    executionDate: 0,
    invoiceDate: 0,
  };

  const invalidNumericCounts: Record<string, number> = {
    amountExclGst: 0,
    amountInclGst: 0,
    billedValueExclGst: 0,
    billedValueInclGst: 0,
    collectedAmountInclGst: 0,
  };

  const unknownStatuses: Record<string, string[]> = {
    executionStatus: [],
    billingStatus: [],
  };

  const potentialDuplicates: DataQualityReport['potentialDuplicates'] = [];
  const inconsistencies: DataQualityReport['inconsistencies'] = [];
  const exclusions: DataQualityReport['exclusions'] = [];

  const seenDealPo = new Map<string, NormalizedWorkOrder>();
  let recordsWithIssues = 0;

  for (const wo of wos) {
    let hasIssue = false;

    // 1. Missing Important Fields
    if (!wo.companyCode) { missingFieldCounts.companyCode!++; hasIssue = true; }
    if (!wo.dealCode) { missingFieldCounts.dealCode!++; hasIssue = true; }
    if (!wo.sector) { missingFieldCounts.sector!++; hasIssue = true; }
    if (!wo.ownerCode) { missingFieldCounts.ownerCode!++; hasIssue = true; }
    if (!wo.executionStatus) { missingFieldCounts.executionStatus!++; hasIssue = true; }
    if (!wo.billingStatus) { missingFieldCounts.billingStatus!++; hasIssue = true; }
    if (wo.amountExclGst === null) {
      missingFieldCounts.amountExclGst!++;
      hasIssue = true;
      exclusions.push({
        recordId: wo.id,
        reason: 'Missing Amount in Rupees (Excl. of GST)',
        metricImpact: 'Excluded from work order base amount calculations',
      });
    }
    if (wo.amountInclGst === null) { missingFieldCounts.amountInclGst!++; }
    if (wo.billedValueExclGst === null) { missingFieldCounts.billedValueExclGst!++; }
    if (wo.billedValueInclGst === null) { missingFieldCounts.billedValueInclGst!++; }
    if (wo.collectedAmountInclGst === null) { missingFieldCounts.collectedAmountInclGst!++; }
    if (wo.amountToBeBilledExclGst === null) { missingFieldCounts.amountToBeBilledExclGst!++; }
    if (wo.amountToBeBilledInclGst === null) { missingFieldCounts.amountToBeBilledInclGst!++; }
    if (wo.amountReceivable === null) { missingFieldCounts.amountReceivable!++; }
    if (!wo.orderDate) { missingFieldCounts.orderDate!++; }
    if (!wo.startDate) { missingFieldCounts.startDate!++; }
    if (!wo.endDate) { missingFieldCounts.endDate!++; }

    // 2. Impossible Negative Values (Contract and Billed amounts cannot be negative)
    if (wo.amountExclGst !== null && wo.amountExclGst < 0) {
      invalidNumericCounts.amountExclGst!++;
      hasIssue = true;
      inconsistencies.push({
        recordId: wo.id,
        recordName: wo.name,
        reason: `Negative Amount (Excl. of GST): ${wo.amountExclGst}`,
      });
    }

    if (wo.billedValueExclGst !== null && wo.billedValueExclGst < 0) {
      invalidNumericCounts.billedValueExclGst!++;
      hasIssue = true;
      inconsistencies.push({
        recordId: wo.id,
        recordName: wo.name,
        reason: `Negative Billed Value (Excl. of GST): ${wo.billedValueExclGst}`,
      });
    }

    if (wo.collectedAmountInclGst !== null && wo.collectedAmountInclGst < 0) {
      invalidNumericCounts.collectedAmountInclGst!++;
      hasIssue = true;
      inconsistencies.push({
        recordId: wo.id,
        recordName: wo.name,
        reason: `Negative Collected Amount: ${wo.collectedAmountInclGst}`,
      });
    }

    // 3. Inclusive vs Exclusive Relationships
    if (wo.amountInclGst !== null && wo.amountExclGst !== null && wo.amountInclGst < wo.amountExclGst) {
      inconsistencies.push({
        recordId: wo.id,
        recordName: wo.name,
        reason: `Amount (Incl. of GST) [${wo.amountInclGst}] is less than Amount (Excl. of GST) [${wo.amountExclGst}]`,
      });
      hasIssue = true;
    }

    if (wo.billedValueInclGst !== null && wo.billedValueExclGst !== null && wo.billedValueInclGst < wo.billedValueExclGst) {
      inconsistencies.push({
        recordId: wo.id,
        recordName: wo.name,
        reason: `Billed Value (Incl. of GST) [${wo.billedValueInclGst}] is less than Billed Value (Excl. of GST) [${wo.billedValueExclGst}]`,
      });
      hasIssue = true;
    }

    // 4. Source vs Derived Discrepancies
    if (
      wo.amountReceivable !== null &&
      wo.derivedReceivableAmount !== null &&
      Math.abs(wo.amountReceivable - wo.derivedReceivableAmount) > 1.0 // Tolerance for rounding
    ) {
      inconsistencies.push({
        recordId: wo.id,
        recordName: wo.name,
        reason: `Source Amount Receivable (${wo.amountReceivable}) differs from derived receivable [Billed - Collected] (${wo.derivedReceivableAmount})`,
      });
      hasIssue = true;
    }

    if (
      wo.amountToBeBilledExclGst !== null &&
      wo.derivedAmountToBeBilledExclGst !== null &&
      Math.abs(wo.amountToBeBilledExclGst - wo.derivedAmountToBeBilledExclGst) > 1.0
    ) {
      inconsistencies.push({
        recordId: wo.id,
        recordName: wo.name,
        reason: `Source Amount to be Billed (${wo.amountToBeBilledExclGst}) differs from derived [Amount - Billed] (${wo.derivedAmountToBeBilledExclGst})`,
      });
      hasIssue = true;
    }

    // 5. Date Inconsistencies
    if (wo.startDate && wo.endDate && wo.endDate < wo.startDate) {
      inconsistencies.push({
        recordId: wo.id,
        recordName: wo.name,
        reason: `Work End date (${wo.endDate}) is earlier than Start date (${wo.startDate})`,
      });
      hasIssue = true;
    }

    // 6. Unknown Statuses
    if (wo.executionStatus && !KNOWN_WO_EXEC_STATUSES.has(wo.executionStatus)) {
      if (!unknownStatuses.executionStatus!.includes(wo.executionStatus)) {
        unknownStatuses.executionStatus!.push(wo.executionStatus);
      }
    }

    if (wo.billingStatus && !KNOWN_WO_BILLING_STATUSES.has(wo.billingStatus)) {
      if (!unknownStatuses.billingStatus!.includes(wo.billingStatus)) {
        unknownStatuses.billingStatus!.push(wo.billingStatus);
      }
    }

    // 7. Duplicate detection (same Deal Code + Name / Invoice Number)
    if (wo.dealCode && wo.name) {
      const key = `${wo.dealCode.trim()}|${wo.name.trim()}|${wo.invoiceNumber || ''}`;
      if (seenDealPo.has(key)) {
        const prev = seenDealPo.get(key)!;
        potentialDuplicates.push({
          id1: prev.id,
          id2: wo.id,
          name: wo.name,
          reason: `Duplicate Deal Code (${wo.dealCode}) and Name/Invoice (${wo.name})`,
        });
        hasIssue = true;
      } else {
        seenDealPo.set(key, wo);
      }
    }

    if (hasIssue) {
      recordsWithIssues++;
    }
  }

  return {
    boardId,
    boardName,
    generatedAt: new Date().toISOString(),
    totalRecords: wos.length,
    validRecords: wos.length - recordsWithIssues,
    recordsWithIssues,
    missingFieldCounts,
    invalidDateCounts,
    invalidNumericCounts,
    unknownStatuses,
    potentialDuplicates,
    inconsistencies,
    exclusions,
  };
}
