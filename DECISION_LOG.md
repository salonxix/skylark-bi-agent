# Engineering Decision Log: Skylark BI Agent

This document records the core architectural decisions, data modeling assumptions, trade-offs, and future roadmap for the Skylark Drones Monday.com Business Intelligence Agent.

---

## 1. Key Business & Data Assumptions

All financial and operational assumptions are grounded directly in the live Monday.com boards (`5031418651` Deals and `5031418671` Work Orders) as audited in [`src/lib/bi/ASSUMPTIONS.md`](src/lib/bi/ASSUMPTIONS.md):

1. **GST / Tax Semantics**: We reject the assumption of a static 18% GST rate across historical contracts. The Monday Work Orders schema provides distinct source columns for Exclusive and Inclusive amounts (`amountExclGst`, `amountInclGst`, `billedValueExclGst`, `billedValueInclGst`, `amountToBeBilledExclGst`, `amountToBeBilledInclGst`). These are preserved as independent source values.
2. **Source vs. Derived Metrics**: `amountReceivable` is preserved directly as recorded in Monday. A separate `derivedReceivableAmount` is calculated as `billedValueInclGst - collectedAmountInclGst`. Discrepancies (> ₹1.00) are flagged in the `DataQualityReport` rather than silently mutating records.
3. **Revenue Disambiguation**: Generic inquiries about "revenue" or "income" are inherently ambiguous across project lifecycles (contracted vs. invoiced vs. collected). The agent enforces deterministic clarification options rather than guessing an accounting convention.
4. **Date Dimension Isolation**: Dates (`closeDate`, `tentativeCloseDate`, `createdDate`, `orderDate`, `startDate`, `endDate`, `executionDate`, `invoiceDate`) are never conflated or substituted during period filtering.
5. **Zero vs. Null**: Zero (`₹0`) represents a recorded zero financial quantity (e.g. fully collected receivable); `null` represents unrecorded data. They are handled distinctly across aggregations.

---

## 2. Architectural Trade-offs & Rationale

| Decision | Approach Chosen | Alternative Considered | Rationale & Failure Mode |
| :--- | :--- | :--- | :--- |
| **Column ID Mapping** | Hardcoded per-board column IDs in `normalize.ts` (e.g. `numeric_mm7bnav4`). | Dynamic runtime schema discovery via column titles. | **Rationale**: Guarantees deterministic, type-safe field extraction within a 6-hour delivery scope without fragile fuzzy string matching.<br>**Failure Mode**: If Monday boards are recreated with new column IDs, `normalize.ts` must be updated with the new IDs. |
| **Arithmetic Grounding** | 100% deterministic TypeScript calculation engine (`metrics.ts`). | LLM-generated SQL, Python execution, or direct prompt arithmetic. | **Rationale**: LLMs hallucinate calculations and financial aggregations. The LLM is strictly restricted to intent parsing (Planner) and prose narration (Narrator). |
| **Data Quality Transparency** | Non-destructive profiling (`data-quality.ts`). Inconsistencies and exclusions are surfaced in the UI drawer. | Automated record mutation or silent row dropping. | **Rationale**: Executives must know if missing `dealValue` records impacted the aggregate pipeline. |
| **Pagination & Caching** | Cursor-based pagination (`items_page` / `next_items_page`) fetching up to 500 items per batch. | Unpaginated queries or client-side caching. | **Rationale**: Complies with Monday API v2 (`2026-07`) rate limits while ensuring complete snapshot retrieval for aggregations. |

---

## 3. "Leadership Update" Interpretation

We interpreted the **Leadership Update** requirement as a comprehensive cross-board executive briefing rather than a single KPI.

When a user requests a leadership update (e.g., *"Give me a leadership update"* or *"Executive briefing"*), the pipeline triggers a cross-board `leadership_update` metric in `executor.ts` that deterministically aggregates:
1. **Sales Pipeline Health**: Total open deal value (`₹230.55 Cr`), total deal count (`346` deals), and sector distribution (Deals Board `5031418651`).
2. **Operational Contract Fulfillment**: Total contracted purchase order amount (`₹18.00 Cr`) (Work Orders Board `5031418671`).
3. **Billing Velocity**: Invoiced value excluding GST (`₹10.58 Cr`).
4. **Cash Collection & Receivables**: Cash collected (`₹9.86 Cr`) and outstanding receivables (`₹2.62 Cr`).
5. **Data Quality Health**: Total records analyzed and flagged inconsistencies.

The AI Narrator receives only these verified figures and produces a concise briefing.

---

## 4. What We Would Do Differently With More Time

1. **Dynamic Schema Mapping UI**: Implement an administrative column-mapping configuration layer that dynamically detects Monday board column title changes and updates mappings without code changes.
2. **Webhooks for Real-Time Cache Invalidation**: Replace pull-based board snapshots with Monday.com webhooks (`item_created`, `column_value_changed`) to maintain an in-memory cache with sub-second query latency.
3. **Interactive Duplicate-Resolution UX**: Add executive decision workflows in the UI allowing users to flag or merge identified potential duplicate records directly back to Monday.com.
4. **Time-Series Velocity Tracking**: Implement month-over-month deal velocity, DSO (Days Sales Outstanding), and billing turnaround trends by cross-referencing `orderDate`, `executionDate`, and `invoiceDate`.
