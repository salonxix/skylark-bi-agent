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

## API Endpoints

- `GET /api/health` - Health check status endpoint verifying service uptime and readiness.
