/** Research and narrative content transcribed from the vetted PDFs and workbook text. No derived financial outputs live here. */
import wb from './workbook-content.json';
import raw from './model-data.json';

export interface SourceRow { ref: string; date: string; source: string; statement: string; value: number | null; cls: string; url: string }
const [, ...factRows] = raw.facts as (string | number | null)[][];
export const SOURCES: SourceRow[] = factRows.map((r) => ({ ref: r[0] as string, date: r[1] as string, source: r[2] as string, statement: r[3] as string, value: r[4] as number | null, cls: r[5] as string, url: r[6] as string }));

export interface DiligenceItem { priority: string; area: string; request: string; rationale: string; owner: string; status: string }
export const DILIGENCE: DiligenceItem[] = wb.diligence as DiligenceItem[];

export interface PlanItem { days: string; workstream: string; initiative: string; owner: string; kpi: string; gate: string; status: string }
export const PLAN: PlanItem[] = wb.plan as PlanItem[];

export const INPUT_META = wb.inputMeta as Record<string, { label: string; status: string; rationale: string; ref: string }>;

/** Required diligence topics mapped to the workbook's diligence areas (no items are invented). */
export const DILIGENCE_TOPICS: { topic: string; areas: string[] }[] = [
  { topic: 'Property financials', areas: ['Financial', 'Portfolio-level'] },
  { topic: 'Rent rolls', areas: ['Occupancy'] },
  { topic: 'Occupancy and resident mix', areas: ['Occupancy', 'Market'] },
  { topic: 'Staffing and payroll', areas: ['Labor'] },
  { topic: 'Licensing and compliance', areas: ['Clinical'] },
  { topic: 'Property condition', areas: ['Capex'] },
  { topic: 'Renovation requirements', areas: ['Capex'] },
  { topic: 'Competitive supply', areas: ['Market'] },
  { topic: 'Debt documentation', areas: ['Debt'] },
  { topic: 'Insurance', areas: ['Tax/insurance'] },
  { topic: 'Taxes', areas: ['Tax/insurance'] },
  { topic: 'Legal and regulatory', areas: ['Legal', 'LP / governance'] },
];

export const PHASES: { window: string; objective: string }[] = [
  { window: '0-15', objective: 'Protect residents and validate baseline' },
  { window: '15-30', objective: 'Diagnose occupancy and unit availability' },
  { window: '30-60', objective: 'Improve revenue quality' },
  { window: '45-90', objective: 'Deploy prioritized renovation capital' },
  { window: '90-100', objective: 'Re-underwrite and make a capital decision' },
];

export const SCORECARD: { metric: string; target: string; current: string; owner: string }[] = [
  { metric: 'Resident safety / major citations', target: '0 unresolved critical risks', current: 'Unverified', owner: 'Clinical lead' },
  { metric: 'Licensed-shift coverage', target: '100% legally required', current: 'Unverified', owner: 'Nursing director' },
  { metric: 'Physical occupancy', target: 'Actual census by property', current: 'Unverified', owner: 'Executive Director' },
  { metric: 'Net move-ins', target: 'Monthly move-ins less move-outs', current: 'Unverified', owner: 'Sales lead' },
  { metric: 'Staff overtime / agency', target: 'Agency hours share and overtime cost', current: 'Unverified', owner: 'Regional Ops' },
  { metric: 'Billing reconciliation', target: '0 material unresolved GL differences', current: 'Unverified', owner: 'Controller' },
  { metric: 'Renovation capex', target: 'Committed and spent vs approved', current: 'Unverified', owner: 'Facilities' },
  { metric: 'Portfolio NOI', target: 'Actual T3 / budget variance', current: 'Unverified', owner: 'CFO' },
  { metric: 'Debt service coverage', target: 'Lender covenants confirmed', current: 'Unverified', owner: 'Finance' },
  { metric: 'Proposed re-underwriting', target: 'Complete by Day 100', current: 'Not started', owner: 'Investment analyst' },
];

export const CADENCE: { cadence: string; artifact: string; owner: string }[] = [
  { cadence: 'Daily, Days 0 to 30', artifact: 'Clinical safety issues, incident escalations, move-ins/outs, open shifts', owner: 'Executive Director + Director of Nursing' },
  { cadence: 'Weekly', artifact: 'Community occupancy and sales funnel; labor, agency, NOI variance, capex and resident experience', owner: 'Asset Manager + Regional Ops' },
  { cadence: 'Biweekly', artifact: 'Revenue-cycle review, aged receivables, care billing audits, unit-turn and marketing ROI', owner: 'Controller + Revenue Manager' },
  { cadence: 'Monthly', artifact: 'CFO package: T3 cash variance, debt service, maintenance reserve, covenant outlook', owner: 'Controller / Finance' },
  { cadence: 'Day 45', artifact: 'Investment budget and operating-reset approval with evidence of safe staffing', owner: 'IC / Clinical Leadership' },
  { cadence: 'Day 100', artifact: 'Updated investment committee memo and rolling 12-month forecast with operating results', owner: 'Investments + Asset Mgmt' },
];

export const DOWNLOADS = [
  { file: '/downloads/Cima_Senior_Living_Underwriting_Model.xlsx', label: 'Formula-driven Excel workbook', note: 'Reviewed model of record: 13 sheets incl. Debt Treatment; all derived values are formulas', type: 'XLSX' },
  { file: '/downloads/Investment_Committee_Memo.pdf', label: 'Investment committee memo', note: 'Reviewed version, 8 pages, 2 November 2026', type: 'PDF' },
  { file: '/downloads/Executive_Brief.pdf', label: 'Executive brief', note: 'One-page North Texas summary', type: 'PDF' },
  { file: '/downloads/100_Day_Value_Creation_Plan.pdf', label: '100-day value creation plan', note: 'Operating playbook, 4 pages', type: 'PDF' },
];

/** Methodology notes from the 2026-11-02 financial review (ChatGPT, investment-analysis owner) plus engineering observations. */
export interface ReviewItem { id: string; title: string; detail: string; handling: string; status: 'Resolved by methodology review' | 'Noted' | 'Proposed enhancement' }
export const REVIEW_ITEMS: ReviewItem[] = [
  { id: 'R1', status: 'Resolved by methodology review', title: 'LP waterfall: GP co-investment and promote', detail: 'The reviewed workbook (LP Waterfall M6:N10, new columns W and X) separates the GP residual into its co-investment share and a promote earned on the LP residual share. Capital is returned before the LP-only preferred return; the preference is a simple annual accrual on beginning unrecovered LP capital, tracked until paid. This ordering is intentional and illustrative.', handling: 'Implemented exactly as the reviewed workbook and reconciled to all 24 columns. No catch-up, clawback or tax distributions are modeled. Not Cima\'s actual fund terms.' },
  { id: 'R2', status: 'Resolved by methodology review', title: 'Exit payoff shortfalls: two illustrative treatments', detail: 'The reviewed Debt Treatment sheet separates the original sponsor-supported payoff from a limited-recourse, exit-only illustration in which sale equity proceeds are floored at zero while operating deficits remain funded. Neither is a model of Cima\'s actual loan guaranty, carve-outs, deficiency claims or workouts.', handling: 'Both are shown on the Financing Outcomes page with the payoff shortfall. The default throughout the application remains the original sponsor-supported treatment.' },
  { id: 'R3', status: 'Noted', title: 'DSCR threshold is an analyst screen', detail: 'The 1.25x threshold in Inputs is an internal screen, not a covenant for this transaction. Fannie Mae\'s public Seniors Housing term sheet lists 1.40x (majority assisted living or dementia care) and 1.30x (majority independent living); the actual lender and terms are not public.', handling: 'Labeled as an analyst screen wherever shown.' },
  { id: 'R4', status: 'Noted', title: 'Zero-leverage maximum bid returns 0 in Excel', detail: 'Dashboard column P divides by the loan amount. At 0% LTV that is 0/0, and IFERROR displays a max bid of 0.', handling: 'The app computes the algebraically equivalent expression (LTV / debt = 1 / price), which matches Excel for all six cases and stays defined at 0% LTV.' },
  { id: 'R5', status: 'Noted', title: 'DSCR reads 0.00x when there is no debt service', detail: 'Forecast column W uses IFERROR(NOI / debt service, 0), so an unlevered case reports a DSCR of 0.', handling: 'The app shows n/a. Reconciliation compares the workbook-equivalent value for the six published cases (all have debt).' },
  { id: 'R6', status: 'Noted', title: 'Waterfall is published for North Texas Base only', detail: 'The LP Waterfall sheet links only to Forecast rows 7-11.', handling: 'The app reconciles exactly for TX Base and applies the same formulas to other cases and scenarios, labeled as an extension.' },
  { id: 'R7', status: 'Noted', title: 'Bid Sensitivity sheet is hard-wired to North Texas Base', detail: 'Its per-unit marginal contribution omits the scenario labor multiplier (identical in Base, where the multiplier is 1.0).', handling: 'The app includes the multiplier so the grid stays consistent in other scenarios; the North Texas Base grid reconciles exactly (49 cells).' },
  { id: 'R8', status: 'Noted', title: 'Hold period input is only valid at 5', detail: 'Inputs row 35 is editable in Excel, but the Forecast has exactly five periods; any other value produces no exit and a meaningless IRR.', handling: 'The app fixes the hold at five annual periods and does not expose it.' },
  { id: 'R9', status: 'Noted', title: 'The 100-day plan has no priority field', detail: 'The workbook plan lists days, workstream, owner, KPI and gate, but no priority rating.', handling: 'The app shows the workbook sequence and day window rather than inventing a priority.' },
  { id: 'R10', status: 'Proposed enhancement', title: 'Monthly model', detail: 'A monthly model would capture the occupancy ramp, interest-only roll-off and lender covenant testing more precisely than annual averaging.', handling: 'Not built, per scope. The annual methodology is unchanged.' },
];
