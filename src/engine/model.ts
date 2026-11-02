import { clamp, excelPMT, irr, signChanges } from './math';
import { ModelInputError, validateInputs } from './validation';
import type { DealInputs, DealResult, ForecastYear, ScenarioParams } from './types';

/**
 * Annual five-period port of the workbook (Inputs, Scenarios, Forecast, Dashboard).
 * Nothing is rounded internally. See docs/RECONCILIATION.md for deliberate departures
 * from literal Excel behaviour (all only in cases where Excel masks an error as 0).
 */
export function computeDeal(i: DealInputs, s: ScenarioParams): DealResult {
  const issues = validateInputs(i, s);
  if (issues.length) throw new ModelInputError(issues);

  const units = i.units;
  const acquisition = units * i.pricePerUnit;
  const closing = acquisition * i.closingPct;
  const upfrontCapex = units * i.renoPerUnit * (1 + s.renoOverrun);
  const loan = acquisition * i.ltv;
  const financingFee = loan * i.finFeePct;
  const equity = acquisition + closing + upfrontCapex - loan + financingFee;
  const exitCap = i.exitCap + s.capShift;
  const rampMonths = Math.max(1, i.stabMonths + s.stabMonthsAdd);
  const level = loan > 0 ? -excelPMT(i.coupon, i.amortYears, loan) : 0;
  const disc = 1 + i.requiredIRR;

  const forecast: ForecastYear[] = [];
  for (let y = 1; y <= 5; y++) {
    const g = (r: number) => Math.pow(1 + r, y - 1);
    const occupancy = clamp(i.startOcc + (i.stabOcc - i.startOcc) * Math.min(1, ((y - 0.5) * 12) / rampMonths) + s.occDelta, 0, 1);
    const occupiedUnits = units * occupancy;
    const rent = i.rent * g(i.rentGrowth) * s.rentMult;
    const ancillary = i.ancillary * g(i.ancillaryGrowth) * s.ancMult;
    const revenue = occupiedUnits * (rent + ancillary) * 12;
    const fixedLabor = units * i.fixedStaffing * 12 * g(i.laborInflation) * s.laborMult;
    const variableLabor = occupiedUnits * i.variableLabor * 12 * g(i.laborInflation) * s.laborMult;
    const fixedNonlabor = units * i.otherFixed * 12 * g(i.fixedInflation) * s.nonlaborMult;
    const variableOther = revenue * i.otherVariablePct * s.nonlaborMult;
    const taxInsurance = units * i.taxIns * 12 * g(i.taxInsInflation);
    const managementFee = revenue * i.mgmtFeePct;
    const operatingExpenses = fixedLabor + variableLabor + fixedNonlabor + variableOther + taxInsurance + managementFee;
    const noi = revenue - operatingExpenses;
    const capexReserve = units * i.capexReservePerUnit * g(i.fixedInflation);
    const beforeDebt = noi - capexReserve;
    const openingLoan = y === 1 ? loan : forecast[y - 2].closingLoan;
    const interest = openingLoan * i.coupon;
    const principal = y <= i.ioYears ? 0 : Math.min(openingLoan, Math.max(0, level - interest));
    const debtService = interest + principal;
    const closingLoan = openingLoan - principal;
    const dscr = debtService > 0 ? noi / debtService : null;
    const operatingEquityCF = beforeDebt - debtService;
    const isExit = y === i.holdYears;
    const grossSale = isExit ? noi / exitCap : 0;
    const saleFees = -grossSale * i.disposalPct;
    const loanPayoff = isExit ? -closingLoan : 0;
    const equityCashFlow = operatingEquityCF + grossSale + saleFees + loanPayoff;
    const d = Math.pow(disc, y);
    forecast.push({
      year: y, occupancy, occupiedUnits, rent, ancillary, revenue, fixedLabor, variableLabor, fixedNonlabor,
      variableOther, taxInsurance, managementFee, operatingExpenses, noi, capexReserve, beforeDebt, openingLoan,
      interest, principal, debtService, closingLoan, dscr, dscrWorkbook: dscr ?? 0, operatingEquityCF, grossSale,
      saleFees, loanPayoff, equityCashFlow, pvBeforeDebt: beforeDebt / d, pvDebtService: debtService / d,
      pvSale: (grossSale + saleFees) / d,
    });
  }

  const y5 = forecast[4];
  const cashflows = [-equity, ...forecast.map((f) => f.equityCashFlow)];
  const leveredIRR = irr(cashflows);
  let irrNote: string | null = null;
  if (leveredIRR === null) irrNote = 'No real IRR exists: the equity cash flows never turn positive after the initial investment.';
  else if (signChanges(cashflows) > 1) irrNote = 'Multiple sign changes in equity cash flows: IRR may not be unique.';

  // Workbook MOIC: positive flows / (initial equity + later negative flows treated as extra equity)
  const positives = cashflows.slice(1).filter((n) => n > 0).reduce((a, b) => a + b, 0);
  const negatives = cashflows.slice(1).filter((n) => n < 0).reduce((a, b) => a + b, 0);
  const invested = equity - negatives;
  const moic = invested > 0 ? positives / invested : 0;

  // Maximum bid: price at which PV of equity cash flows at the required IRR equals zero.
  // Loan, interest and amortization scale linearly with price, so the workbook expresses the debt
  // PVs per dollar of price (its LTV/Loan term equals 1/acquisition). Valid at zero leverage too.
  const pvOps = forecast.reduce((a, f) => a + f.pvBeforeDebt + f.pvSale, 0);
  const pvDebt = forecast.reduce((a, f) => a + f.pvDebtService, 0) + -y5.loanPayoff / Math.pow(disc, i.holdYears);
  const bidDen = 1 + i.closingPct - i.ltv + i.ltv * i.finFeePct + pvDebt / acquisition;
  const bidNum = pvOps - upfrontCapex;
  const rawBid = bidNum / bidDen;
  const maxBid = Number.isFinite(rawBid) && bidDen > 0 ? rawBid : null;

  const dscrs = forecast.map((f) => f.dscr).filter((d): d is number => d !== null);
  const netSaleProceeds = y5.grossSale + y5.saleFees;
  const netExitEquity = netSaleProceeds + y5.loanPayoff;
  return {
    units, pricePerUnit: i.pricePerUnit, acquisition, closing, upfrontCapex, loan, financingFee, equity, exitCap, forecast,
    year1NOI: forecast[0].noi, year5NOI: y5.noi, exitValue: y5.grossSale, netSaleProceeds,
    loanPayoff: -y5.loanPayoff, netExitEquity, exitShortfall: netExitEquity < 0,
    operatingEquityCF: forecast.reduce((a, f) => a + f.operatingEquityCF, 0),
    leveredIRR, irrNote, moic, maxBid,
    maxBidPerUnit: maxBid === null ? null : maxBid / units,
    headroom: maxBid === null ? null : maxBid / acquisition - 1,
    minDSCR: dscrs.length ? Math.min(...dscrs) : null,
    debtToNOI: y5.noi > 0 ? -y5.loanPayoff / y5.noi : 0,
    cashflows,
    clearsHurdle: leveredIRR !== null && leveredIRR >= i.requiredIRR,
  };
}
