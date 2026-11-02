# Acceptance checklist (reviewed model)

Evidence for each item is an automated test that was run; see `tests/` and `e2e/`.

| Item | Evidence |
|---|---|
| Six acquisition cases reconcile to the reviewed workbook | `tests/reconciliation.test.ts` (21 fields x 6; 29 columns x 30 case-years); baselines verified identical to previous workbook |
| LP waterfall reconciles (24 columns, LP/GP IRR) | waterfall parity tests vs `tests/waterfall-baseline.json` (from reviewed workbook) |
| GP residual = co-invest residual + promote; distributions = cash | invariant tests across all cases |
| Debt Treatment (6 cases) and alternative exit cash flow | `tests/debt-treatment-baseline.json` parity; implied cure = shortfall |
| LP/GP IRR approx. 17.5% / 31.3% from the engine | engine test and e2e (Investor Economics) |
| Editing price / occupancy / financing / exit cap recalculates | `tests/edge-cases.test.ts`, e2e editing test |
| Reset restores originals; scenario switching; charts update | e2e |
| Downloads are byte-identical to the reviewed package | e2e byte comparison |
| All routes, desktop and mobile (412px, 360px), axe WCAG 2 A/AA | e2e per route |
| TypeScript, lint, tests, production build | `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` |
