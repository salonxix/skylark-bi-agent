# Skylark Drones - Monday.com Business Intelligence Agent

A production-ready Business Intelligence (BI) Agent for querying, analyzing, and extracting actionable insights from Monday.com CRM Deals and Work Orders boards.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript (Strict Mode)
- **Code Quality**: ESLint (`eslint-config-next`)
- **Testing**: Vitest
- **Styling**: Vanilla CSS

---

## Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (version 18.18+ or 20+)
- `npm` (or `yarn` / `pnpm` / `bun`)

### 2. Environment Configuration

Copy the sample environment file to `.env.local`:

```bash
cp .env.example .env.local
```

Configure the environment variables in `.env.local`:

```env
MONDAY_API_TOKEN=your_monday_api_token_here
MONDAY_DEALS_BOARD_ID=5031418651
MONDAY_WORK_ORDERS_BOARD_ID=5031418671
AI_API_KEY=your_ai_api_key_here
```

> **Note**: Never commit `.env` or `.env.local` files to version control.

### 3. Installation

Install all project dependencies:

```bash
npm install
```

### 4. Running the Development Server

Start the local Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server at port 3000 |
| `npm run build` | Builds the optimized production application |
| `npm run start` | Runs the compiled production build |
| `npm run lint` | Runs ESLint to verify code quality and style rules |
| `npm run typecheck` | Runs TypeScript compiler checks without emitting files |
| `npm run test` | Executes the Vitest test suite |

---

---

## Architecture Overview

The Skylark BI Agent follows a strict **Deterministic Grounding Architecture**:

```
User Natural Language Question
         │
         ▼
[ AI / Heuristic Planner ]   ──(Ambiguity / Revenue)──▶ [ Structured Clarification ]
         │
         ▼ (Validated QuerySpec)
[ Deterministic BI Engine ]  ──(Live Monday.com API)──▶ Normalization & Data Quality
         │
         ▼ (Verified BIResult Numbers)
[ AI Executive Narrator ]    ──(Grounding only)───────▶ Founder-Facing Briefing
```

- **Planner (`src/lib/agent/planner.ts`)**: Interprets natural language intent into a strict, Zod-validated `QuerySpec` (or triggers clarification if the question is ambiguous).
- **Deterministic Engine (`src/lib/bi/metrics.ts` & `src/lib/agent/executor.ts`)**: Executes all financial math, GST partitioning, aggregations, filtering, and data-quality profiling directly in TypeScript code. **The LLM never performs arithmetic.**
- **Narrator (`src/lib/agent/provider.ts` & `src/lib/agent/prompts.ts`)**: Explains only the verified numbers returned by the deterministic engine.
- See [`src/lib/bi/ASSUMPTIONS.md`](src/lib/bi/ASSUMPTIONS.md) and [`DECISION_LOG.md`](DECISION_LOG.md) for full semantic assumptions and architectural trade-offs.

---

## Monday.com Setup & Schema Mapping

The agent connects to live Monday.com boards via GraphQL API v2 (`2026-07`):
- **Deals Board ID**: `5031418651` ("Deal funnel Data")
- **Work Orders Board ID**: `5031418671` ("Work_Order_Tracker Data")

### Updating Board Column Mappings
Column IDs (e.g. `numeric_mm7bnav4`, `color_mm7bdx2e`) are board-specific. If Monday boards are cloned or recreated with new column IDs:
1. Update `MONDAY_DEALS_BOARD_ID` and `MONDAY_WORK_ORDERS_BOARD_ID` in `.env.local`.
2. Update the corresponding column ID constants in [`src/lib/bi/normalize.ts`](src/lib/bi/normalize.ts) (`normalizeDeal` and `normalizeWorkOrder`).
3. Cross-reference the documented column schema in [`src/lib/bi/ASSUMPTIONS.md`](src/lib/bi/ASSUMPTIONS.md).

---

## API Endpoints

- `GET /api/health` - Health check status endpoint verifying service uptime and readiness.
- `POST /api/agent` - Core BI agent conversational endpoint executing the plan-execute-narrate pipeline.
- `GET /api/monday/deals` - Diagnostics endpoint returning live Deals items.
- `GET /api/monday/work-orders` - Diagnostics endpoint returning live Work Orders items.
- `GET /api/monday/diagnostics` - Diagnostics endpoint returning board connectivity and column metadata.
