# Senior Living Acquisition and Turnaround Intelligence

Independent, illustrative private equity underwriting case study of two senior living acquisition cases (North Texas portfolio, 10 communities / 359 units; The Reserve at Katy, 82 residences). Built as a work sample for a Private Equity Analyst application.

> **Independent illustrative investment analysis. Not affiliated with or endorsed by Cima Investment Group. Actual undisclosed transaction financials are not represented.** Only unit counts and public market benchmarks are sourced facts; all prices, operating economics, loan terms and investor terms are analyst assumptions.

## Stack
Next.js (App Router) + TypeScript (strict) + Tailwind CSS + Recharts. No backend, database, auth or tracking; all calculations run in the browser. Tests: Vitest (engine) and Playwright + axe (end to end, desktop and mobile).

## Architecture
```
src/engine/      pure calculation engine (model, math/IRR, waterfall, sensitivity, validation)
src/data/        typed analyst inputs (from model-data.json), source register, diligence, 100-day plan, review items
src/store/       React context: selected case/scenario + user edits kept SEPARATE from frozen originals
src/components/  UI primitives, charts, input fields
src/app/         10 routes, one per module
tests/           engine reconciliation + edge-case tests; Excel baselines
e2e/             Playwright tests
reference/       original workbook, PDFs, prototype (inputs, unmodified)
```
Separation: source facts and analyst assumptions (`src/data`), scenario parameters, calculation functions (`src/engine`), calculated outputs (never stored), research content, UI. No derived financial output is hardcoded; every page reads the same engine through one store. User edits are an overlay on frozen originals, flagged in the UI and resettable per field, per case, or globally.

## Excel reconciliation
`underwriting.xlsx` is the model of record and was not modified. The suite compares the engine with the workbook's cached values at 1e-9 relative tolerance:
- 21 Dashboard fields x 6 cases (acquisition, sources and uses, exit, IRR (NM = null), MOIC, max bid, DSCR)
- 29 Forecast columns x 5 years x 6 cases (NOI, debt schedule, equity cash flows, PVs)
- 49-cell exit cap x occupancy grid (TX Base)
- LP waterfall: 22 columns x 5 years + summary block (LP/GP IRR)
- Extra checks: the full model returns exactly the 15% required IRR when priced at the computed max bid (cases A and B, and at zero leverage).

Edge cases covered: zero debt, negative cash flow, negative exit equity, exit value below debt payoff, invalid cap rate / occupancy / amortization, very low DSCR, undefined IRR (never shown as 0%), negative interim equity cash flow, extreme valid sweeps.

### Items for investment review (nothing in the underwriting was changed)
See `src/data/content.ts` (`REVIEW_ITEMS`) or the Methodology page: zero-leverage max bid and DSCR show 0 in Excel via IFERROR; waterfall pays capital before the LP pref and is published for TX Base only; exit shortfall is modeled as sponsor funding (not non-recourse); Bid Sensitivity is hard-wired to TX Base; hold period is only valid at 5; 100-day plan has no priority field; a monthly model is proposed as an enhancement only.

## Develop
```
npm install
npm run dev          # http://localhost:3000
npm test             # engine reconciliation + edge cases
npm run typecheck
npm run build && npm run e2e   # Playwright (installs: npx playwright install chromium)
E2E_BASE_URL=https://<deployment> npm run e2e   # run against production
```

## Screenshots
`docs/screenshots/`

## Acceptance checklist
See `docs/ACCEPTANCE.md`.
