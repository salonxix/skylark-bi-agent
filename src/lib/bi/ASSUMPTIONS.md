# Business Intelligence Semantics & Assumptions Audit

This document defines the audited data normalization rules, verified Monday.com column mappings, explicit separation between **Source Fields** and **Derived Metrics**, and flags **Unresolved Business Semantics**.

---

## 1. Verified Live Column Mappings

### A. Deals Board (`5031418651`) — "Deal funnel Data"
| Column ID | Monday Column Title | Type | Normalized Property | Category |
| :--- | :--- | :--- | :--- | :--- |
| `name` | Name | text | `name` | SOURCE FIELD |
| `color_mm7bdx2e` | Owner code | status | `ownerCode` | SOURCE FIELD |
| `dropdown_mm7b4q06` | Client Code | dropdown | `clientCode` | SOURCE FIELD |
| `color_mm7bp3k2` | Deal Status | status | `dealStatus` | SOURCE FIELD |
| `date_mm7be867` | Close Date (A) | date | `closeDate` | SOURCE FIELD |
| `color_mm7b86qv` | Closure Probability | status | `closureProbability` | SOURCE FIELD |
| `numeric_mm7b65d9` | Masked Deal value | numbers | `dealValue` | SOURCE FIELD |
| `date_mm7bqvbc` | Tentative Close Date | date | `tentativeCloseDate` | SOURCE FIELD |
| `color_mm7bdmsx` | Deal Stage | status | `dealStage` | SOURCE FIELD |
| `color_mm7bjgfq` | Product deal | status | `productDeal` | SOURCE FIELD |
| `color_mm7bsqa2` | Sector/service | status | `sector` | SOURCE FIELD |
| `date_mm7b4hyz` | Created Date | date | `createdDate` | SOURCE FIELD |

### B. Work Orders Board (`5031418671`) — "Work_Order_Tracker Data"
| Column ID | Monday Column Title | Type | Normalized Property | Category |
| :--- | :--- | :--- | :--- | :--- |
| `name` | Name | text | `name` | SOURCE FIELD |
| `dropdown_mm7bj008` | WOCOMPANY_... | dropdown | `companyCode` | SOURCE FIELD |
| `dropdown_mm7bw1hf` | SDPLDEAL-... | dropdown | `dealCode` | SOURCE FIELD |
| `color_mm7bfa0f` | Project Type | status | `projectType` | SOURCE FIELD |
| `color_mm7b94mp` | Month | status | `executionMonth` | SOURCE FIELD |
| `color_mm7bbmdb` | Execution Status | status | `executionStatus` | SOURCE FIELD |
| `date_mm7bygeg` | Execution Date | date | `executionDate` | SOURCE FIELD |
| `date_mm7byqf4` | Order Date | date | `orderDate` | SOURCE FIELD |
| `color_mm7bd84s` | Order Document Type | status | `orderDocType` | SOURCE FIELD |
| `date_mm7b2nps` | Work Start Date | date | `startDate` | SOURCE FIELD |
| `date_mm7bjkd5` | Work End Date | date | `endDate` | SOURCE FIELD |
| `color_mm7bh02a` | Owner Code | status | `ownerCode` | SOURCE FIELD |
| `color_mm7be3tw` | Sector | status | `sector` | SOURCE FIELD |
| `color_mm7bshmw` | Service Scope | status | `serviceScope` | SOURCE FIELD |
| `color_mm7bhhg4` | Product | status | `product` | SOURCE FIELD |
| `date_mm7b2fv2` | Invoice Date | date | `invoiceDate` | SOURCE FIELD |
| `dropdown_mm7bjhwg` | Invoice Number | dropdown | `invoiceNumber` | SOURCE FIELD |
| `numeric_mm7bnav4` | Amount in Rupees (Excl. of GST) | numbers | `amountExclGst` | SOURCE FIELD |
| `numeric_mm7btzx2` | Amount in Rupees (Incl. of GST) | numbers | `amountInclGst` | SOURCE FIELD |
| `numeric_mm7bexxg` | Billed Value in Rupees (Excl. of GST) | numbers | `billedValueExclGst` | SOURCE FIELD |
| `numeric_mm7bkxax` | Billed Value in Rupees (Incl. of GST) | numbers | `billedValueInclGst` | SOURCE FIELD |
| `numeric_mm7b7qat` | Collected Amount in Rupees (Incl. of GST) | numbers | `collectedAmountInclGst` | SOURCE FIELD |
| `numeric_mm7b49n6` | Amount to be billed in Rs. (Excl. of GST) | numbers | `amountToBeBilledExclGst` | SOURCE FIELD |
| `numeric_mm7bn6fr` | Amount to be billed in Rs. (Incl. of GST) | numbers | `amountToBeBilledInclGst` | SOURCE FIELD |
| `numeric_mm7b9ahr` | Amount Receivable | numbers | `amountReceivable` | SOURCE FIELD |
| `color_mm7bm385` | Billing Status | status | `billingStatus` | SOURCE FIELD |
| `color_mm7bc4kf` | Lifecycle Status | status | `lifecycleStatus` | SOURCE FIELD |
| `color_mm7b8am8` | Billing Process Status | status | `billingProcessStatus` | SOURCE FIELD |

---

## 2. Source Fields vs Explicitly Derived Metrics

We strictly prohibit conflating source financial columns into generic "revenue" metrics or hardcoding assumptions (such as an immutable 18% GST rate across all historical contracts).

### Source Financial Fields (Stored As-Is)
1. **`amountExclGst`**: Direct value of "Amount in Rupees (Excl. of GST)".
2. **`amountInclGst`**: Direct value of "Amount in Rupees (Incl. of GST)".
3. **`billedValueExclGst`**: Direct value of "Billed Value in Rupees (Excl. of GST)".
4. **`billedValueInclGst`**: Direct value of "Billed Value in Rupees (Incl. of GST)".
5. **`collectedAmountInclGst`**: Direct value of "Collected Amount in Rupees (Incl. of GST)".
6. **`amountToBeBilledExclGst`**: Direct value of "Amount to be billed in Rs. (Excl. of GST)".
7. **`amountToBeBilledInclGst`**: Direct value of "Amount to be billed in Rs. (Incl. of GST)".
8. **`amountReceivable`**: Direct value of "Amount Receivable".

### Explicitly Labeled Derived Metrics
1. **`derivedReceivableAmount`**: Calculated as `billedValueInclGst - collectedAmountInclGst`.
   - *Audit Check*: Discrepancy between source `amountReceivable` and `derivedReceivableAmount` > 1.0 INR is flagged as an inconsistency in `DataQualityReport`.
2. **`derivedAmountToBeBilledExclGst`**: Calculated as `amountExclGst - billedValueExclGst`.
   - *Audit Check*: Discrepancy between source `amountToBeBilledExclGst` and `derivedAmountToBeBilledExclGst` > 1.0 INR is flagged as an inconsistency in `DataQualityReport`.
3. **`derivedAmountToBeBilledInclGst`**: Calculated as `amountInclGst - billedValueInclGst`.

---

## 3. Date Dimensions & Semantics

Dates are **never** silently substituted for one another. Date filtering strictly targets the selected dimension:

### Deals Board
- **`closeDate` (`date_mm7be867`)**: "Close Date (A)" — Actual closure date for Won deals.
- **`tentativeCloseDate` (`date_mm7bqvbc`)**: Forecasted closure date for pipeline deals.
- **`createdDate` (`date_mm7b4hyz`)**: Date the deal was created in Monday.

### Work Orders Board
- **`orderDate` (`date_mm7byqf4`)**: Purchase Order date issued by client.
- **`startDate` (`date_mm7b2nps`)**: Scheduled or actual work start date.
- **`endDate` (`date_mm7bjkd5`)**: Target completion date.
- **`executionDate` (`date_mm7bygeg`)**: Actual execution date on-site.
- **`invoiceDate` (`date_mm7b2fv2`)**: Date invoice was generated.

---

## 4. Data Quality Rules

- **Source vs Derived Integrity**: When source receivable disagrees with derived receivable, it is flagged in `inconsistencies` with exact values, rather than hiding either value or dropping the record.
- **Inclusive vs Exclusive Integrity**: When tax-inclusive values are less than tax-exclusive values (`amountInclGst < amountExclGst`), it is flagged in `inconsistencies`.
- **Negative Value Checks**: Impossible negative values in contract amounts (`amountExclGst < 0`), billed amounts, or collected amounts are flagged.
- **Zero vs Null**: Zero (`0`) is a valid financial quantity; `null` represents unrecorded data. They are never conflated.
- **Duplicate Records**: Flagged in `potentialDuplicates` without destructive automated deletion.

---

## 5. Unresolved Business Semantics (Open Questions for Business Stakeholders)

1. **Official Revenue Recognition Point**: Does Skylark recognize revenue upon:
   - Work order execution (`executionDate`),
   - Invoice issuance (`billedValueExclGst`), or
   - Customer collection (`collectedAmountInclGst`)?
2. **Tax Treatment in Executive KPIs**: Should leadership dashboards report Pipeline Opportunity and Backlog excluding GST or including GST?
3. **Partial vs Full Discrepancies**: In cases where `amountReceivable` in the source differs slightly from `billedValueInclGst - collectedAmountInclGst`, does the source column account for TDS (Tax Deducted at Source), credit notes, or retention money?
