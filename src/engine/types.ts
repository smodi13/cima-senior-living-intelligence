export type CaseId = 'TX' | 'Katy';
export type ScenarioId = 'Base' | 'Down' | 'Up';
export const CASES: CaseId[] = ['TX', 'Katy'];
export const SCENARIOS: ScenarioId[] = ['Base', 'Down', 'Up'];
export const HOLD_YEARS = 5;

/** Workbook "Inputs" sheet, one column per case. Keys map 1:1 to Inputs rows 6-40. */
export interface DealInputs {
  properties: number; // row 6 (source fact)
  units: number; // row 7 (source fact)
  startOcc: number; // 8
  stabOcc: number; // 9
  stabMonths: number; // 10
  rent: number; // 11 monthly rent per occupied unit
  rentGrowth: number; // 12
  ancillary: number; // 13
  ancillaryGrowth: number; // 14
  fixedStaffing: number; // 15 per available unit per month
  variableLabor: number; // 16 per occupied unit per month
  laborInflation: number; // 17
  otherFixed: number; // 18 per unit per month
  otherVariablePct: number; // 19 of revenue
  fixedInflation: number; // 20
  taxIns: number; // 21 per unit per month
  taxInsInflation: number; // 22
  mgmtFeePct: number; // 23
  pricePerUnit: number; // 24
  closingPct: number; // 25
  renoPerUnit: number; // 26
  capexReservePerUnit: number; // 27
  ltv: number; // 28
  coupon: number; // 29
  ioYears: number; // 30
  amortYears: number; // 31
  finFeePct: number; // 32
  exitCap: number; // 33
  disposalPct: number; // 34
  holdYears: number; // 35 (fixed at 5)
  requiredIRR: number; // 36
  lpPref: number; // 37
  gpPromote: number; // 38
  lpShare: number; // 39
  minDSCR: number; // 40
}

/** Workbook "Scenarios" sheet rows 6-13. */
export interface ScenarioParams {
  occDelta: number;
  rentMult: number;
  laborMult: number;
  capShift: number;
  stabMonthsAdd: number;
  ancMult: number;
  nonlaborMult: number;
  renoOverrun: number;
}

export interface ForecastYear {
  year: number;
  occupancy: number;
  occupiedUnits: number;
  rent: number;
  ancillary: number;
  revenue: number;
  fixedLabor: number;
  variableLabor: number;
  fixedNonlabor: number;
  variableOther: number;
  taxInsurance: number;
  managementFee: number;
  operatingExpenses: number;
  noi: number;
  capexReserve: number;
  beforeDebt: number;
  openingLoan: number;
  interest: number;
  principal: number;
  debtService: number;
  closingLoan: number;
  /** null when there is no debt service (workbook reports 0 via IFERROR) */
  dscr: number | null;
  /** workbook-equivalent DSCR (0 when undefined) used for reconciliation only */
  dscrWorkbook: number;
  operatingEquityCF: number;
  grossSale: number;
  saleFees: number;
  loanPayoff: number;
  equityCashFlow: number;
  pvBeforeDebt: number;
  pvDebtService: number;
  pvSale: number;
}

export interface DealResult {
  units: number;
  pricePerUnit: number;
  acquisition: number;
  closing: number;
  upfrontCapex: number;
  loan: number;
  financingFee: number;
  equity: number;
  exitCap: number;
  forecast: ForecastYear[];
  year1NOI: number;
  year5NOI: number;
  exitValue: number;
  /** exitValue less disposal costs: property value net of sale costs, before debt */
  netSaleProceeds: number;
  loanPayoff: number;
  /** netSaleProceeds - loanPayoff; negative means sponsor must fund the shortfall (workbook method) */
  netExitEquity: number;
  exitShortfall: boolean;
  operatingEquityCF: number;
  /** null = economically undefined (workbook "NM") */
  leveredIRR: number | null;
  irrNote: string | null;
  moic: number;
  /** null when no positive-value solution exists or the math is undefined */
  maxBid: number | null;
  maxBidPerUnit: number | null;
  headroom: number | null;
  minDSCR: number | null;
  debtToNOI: number;
  cashflows: number[];
  clearsHurdle: boolean;
}

export type Issue = { field: string; message: string };
