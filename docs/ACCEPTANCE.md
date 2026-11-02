# Acceptance checklist

Status reflects commands actually run locally (see README). Production items are verified separately after deployment (see bottom).

| Item | Evidence |
|---|---|
| Every workbook scenario reconciles | `tests/reconciliation.test.ts` (6 cases x 21 fields; 30 case-years x 29 columns) |
| Derived outputs are formula-derived | Engine only; data modules hold inputs and text |
| No unauthorized assumptions added | Inputs read from `model-data.json`; only validation ranges added (UI guard rails) |
| Edit price / occupancy / financing / exit cap recalculates | `tests/edge-cases.test.ts` + e2e "editing assumptions" |
| Max bid recalculates and solves the hurdle | IRR at max bid = 15% test |
| Reset restores originals | e2e reset tests |
| Scenario switching, charts update | e2e overview test |
| Diligence/research load | e2e content test |
| Downloads (xlsx, 3 PDFs) | e2e download tests (status, content type, magic bytes) |
| All routes, desktop and mobile | e2e route tests, both projects |
| Accessibility (axe wcag2a/aa) | e2e a11y per route |
| Typecheck, tests, build | `npm run typecheck`, `npm test`, `npm run build` |
