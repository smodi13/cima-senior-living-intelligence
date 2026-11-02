# Senior Living Acquisition and Turnaround Intelligence

Independent, illustrative retrospective scenario analysis of two senior living acquisitions that Cima has already completed (North Texas portfolio, 10 communities / 359 units; The Reserve at Katy, 82 residences). Built as a work sample for a Private Equity Analyst application.

> **Independent illustrative investment analysis. Not affiliated with or endorsed by Cima Investment Group. Actual undisclosed transaction financials are not represented.** Only unit counts and public market benchmarks are sourced facts; all prices, operating economics, loan terms and investor terms are analyst assumptions.

## Stack
Next.js (App Router) + TypeScript (strict) + Tailwind CSS + Recharts. No backend, database, auth or tracking; all calculations run in the browser. Tests: Vitest (engine) and Playwright + axe (end to end, desktop and mobile).

## Architecture
```
src/engine/      pure calculation engine (model, math/IRR, waterfall, debt treatment, sensitivity, validation)
src/data/        typed analyst inputs (from model-data.json), source register, diligence, 100-day plan, review notes
src/store/       React context: selected case/scenario + user edits kept SEPARATE from frozen originals
src/components/  UI primitives, charts, input fields
src/app/         11 routes (10 modules + Financing Outcomes)
tests/           engine reconciliation + edge-case tests; Excel baselines
e2e/             Playwright tests
reference/       original workbook, PDFs, prototype (inputs, unmodified)
```
Separation: source facts and analyst assumptions (`src/data`), scenario parameters, calculation functions (`src/engine`), calculated outputs (never stored), research content, UI. No derived financial output is hardcoded; every page reads the same engine through one store. User edits are an overlay on frozen originals, flagged in the UI and resettable per field, per case, or globally.

## Excel reconciliation
The **reviewed** workbook (`reference/underwriting.xlsx`, from the 2 November 2026 methodology review; see `financial_review/METHODOLOGY_AND_INTEGRATION.md`) is the model of record and was not modified by engineering. The previous workbook and memo are kept in `reference/superseded/`. The six acquisition cases are unchanged between versions (1,179 cached cells compared). The suite compares the engine with the reviewed workbook's cached values at 1e-9 relative tolerance (one micro-dollar absolute floor for cells that are exactly zero):
- 21 Dashboard fields x 6 cases (acquisition, sources and uses, exit, IRR (NM = null), MOIC, max bid, DSCR)
- 29 Forecast columns x 5 years x 6 cases (NOI, debt schedule, equity cash flows, PVs)
- 49-cell exit cap x occupancy grid (TX Base)
- Reviewed LP waterfall: 24 columns (A:X, incl. GP co-invest residual W and promote X) x 5 years + summary block (LP and GP IRR); GP residual = W + X; distributions = distributable cash each year
- Debt Treatment sheet for all six cases (payoff shortfall, floored sale equity, limited-recourse Year 5 cash flow, implied cure = shortfall)
- Extra checks: the full model returns exactly the 15% required IRR when priced at the computed max bid (cases A and B, and at zero leverage).

Edge cases covered: zero debt, negative cash flow, negative exit equity, exit value below debt payoff, invalid cap rate / occupancy / amortization, very low DSCR, undefined IRR (never shown as 0%), negative interim equity cash flow, extreme valid sweeps.

### Methodology notes
Resolved by the review: capital-first LP waterfall with GP co-investment residual plus promote on the LP share; two illustrative exit-financing treatments (sponsor-supported payoff, limited-recourse exit-only), neither representing Cima's loan terms; the 1.25x DSCR is an analyst screen, not a covenant. Remaining workbook behaviors and enhancements are listed on the Methodology page (`REVIEW_ITEMS` in `src/data/content.ts`).

## Develop
```
npm install
npm run dev          # http://localhost:3000
npm test             # engine reconciliation + edge cases
npm run typecheck
npm run lint
npm run build && npm run e2e   # Playwright (installs: npx playwright install chromium)
E2E_BASE_URL=https://<deployment> npm run e2e   # run against production
```

## Screenshots
`docs/screenshots/` (desktop and mobile; regenerated after the reviewed-model update)

## Acceptance checklist
See `docs/ACCEPTANCE.md`.
