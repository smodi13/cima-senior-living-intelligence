import { irr, workbookMoic } from './math';
import type { DealResult } from './types';

export interface DebtTreatment {
  grossSale: number;
  disposalCosts: number; // negative
  netSaleProceeds: number;
  outstandingDebt: number;
  /** MAX(0, debt - net sale) */
  payoffShortfall: number;
  /** MAX(0, net sale - debt): sale equity floored at zero */
  saleEquityFloored: number;
  /** net sale - debt (negative when there is a shortfall) */
  saleCashAfterDebt: number;
  y5OperatingEquityCF: number;
  /** Illustrative limited-recourse, exit-only: floored sale equity + Year 5 operating CF */
  limitedRecourseY5CF: number;
  /** Original workbook treatment: sponsor-supported payoff of all debt */
  sponsorSupportedY5CF: number;
  /** limited - sponsor; equals the payoff shortfall */
  impliedCure: number;
  sponsorSupported: { cashflows: number[]; irr: number | null; moic: number };
  limitedRecourse: { cashflows: number[]; irr: number | null; moic: number };
}

/**
 * Port of the reviewed workbook "Debt Treatment" sheet (columns B-L). Both treatments are alternative modeling conventions,
 * not Cima's actual loan terms. Operating deficits stay funded in both. The IRR and MOIC rows for each treatment are
 * computed here with the workbook's own IRR and MOIC definitions applied to the Y5 cash flow in column K or J; the
 * workbook itself publishes only the Year 5 cash flows.
 */
export function computeDebtTreatment(d: DealResult): DebtTreatment {
  const y5 = d.forecast[4];
  const grossSale = y5.grossSale;
  const disposalCosts = y5.saleFees;
  const netSaleProceeds = grossSale + disposalCosts;
  const outstandingDebt = -y5.loanPayoff;
  const payoffShortfall = Math.max(0, outstandingDebt - netSaleProceeds);
  const saleEquityFloored = Math.max(0, netSaleProceeds - outstandingDebt);
  const limitedRecourseY5CF = saleEquityFloored + y5.operatingEquityCF;
  const sponsorSupportedY5CF = y5.equityCashFlow;
  const alt = [...d.cashflows.slice(0, 5), limitedRecourseY5CF];
  return {
    grossSale, disposalCosts, netSaleProceeds, outstandingDebt, payoffShortfall, saleEquityFloored,
    saleCashAfterDebt: netSaleProceeds - outstandingDebt, y5OperatingEquityCF: y5.operatingEquityCF,
    limitedRecourseY5CF, sponsorSupportedY5CF, impliedCure: limitedRecourseY5CF - sponsorSupportedY5CF,
    sponsorSupported: { cashflows: d.cashflows, irr: d.leveredIRR, moic: d.moic },
    limitedRecourse: { cashflows: alt, irr: irr(alt), moic: workbookMoic(alt) },
  };
}
