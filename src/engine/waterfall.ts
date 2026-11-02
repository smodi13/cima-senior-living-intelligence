import { irr } from './math';
import type { DealResult } from './types';

export interface WaterfallYear {
  year: number; projectCF: number; openLP: number; openGP: number; call: number; lpContrib: number; gpContrib: number;
  cash: number; lpPrefAccrual: number; rocLP: number; rocGP: number; lpPrefPaid: number; residualLP: number;
  /** Residual to GP = gpCoInvestResidual + gpPromote (workbook N = W + X) */
  residualGP: number; gpCoInvestResidual: number; gpPromote: number; lpTotal: number; gpTotal: number; endLP: number; endGP: number; unpaidPref: number;
  reconciliation: number; lpNet: number; gpNet: number;
}
export interface WaterfallResult {
  years: WaterfallYear[]; lpInitial: number; gpInitial: number; lpDistributions: number; gpDistributions: number;
  lpIRR: number | null; gpIRR: number | null; residualCash: number; lpCashflows: number[]; gpCashflows: number[];
}

/**
 * Exact port of the REVIEWED workbook "LP Waterfall" rows 6-10 and 15-21: capital returned first (pro rata), then the LP-only
 * preferred return, then the residual. Residual W = GP co-invest share, X = promote on the LP share, N = W + X, M = residual - N.
 */
export function computeWaterfall(deal: DealResult, p: { lpPref: number; gpPromote: number; lpShare: number }): WaterfallResult {
  const years: WaterfallYear[] = [];
  let prev: WaterfallYear | null = null;
  deal.forecast.forEach((f, idx) => {
    const projectCF = f.equityCashFlow;
    const openLP = prev ? prev.endLP : deal.equity * p.lpShare;
    const openGP = prev ? prev.endGP : deal.equity * (1 - p.lpShare);
    const call = Math.max(0, -projectCF);
    const lpContrib = call * p.lpShare;
    const gpContrib = call * (1 - p.lpShare);
    const cash = Math.max(0, projectCF);
    const lpPrefAccrual = (openLP + lpContrib) * p.lpPref;
    const base = openLP + openGP + call;
    const ret = Math.min(cash, base);
    const rocLP = base === 0 ? 0 : (ret * (openLP + lpContrib)) / base; // IFERROR(...,0)
    const rocGP = ret - rocLP;
    const priorUnpaid = idx === 0 ? 0 : prev!.unpaidPref;
    const lpPrefPaid = Math.min(Math.max(0, cash - rocLP - rocGP), lpPrefAccrual + priorUnpaid);
    const resid = Math.max(0, cash - rocLP - rocGP - lpPrefPaid);
    const gpCoInvestResidual = resid * (1 - p.lpShare); // W
    const gpPromote = resid * p.lpShare * p.gpPromote; // X
    const residualGP = gpCoInvestResidual + gpPromote; // N
    const residualLP = resid - residualGP; // M
    const lpTotal = rocLP + lpPrefPaid + residualLP;
    const gpTotal = rocGP + residualGP;
    const w: WaterfallYear = {
      year: f.year, projectCF, openLP, openGP, call, lpContrib, gpContrib, cash, lpPrefAccrual, rocLP, rocGP, lpPrefPaid,
      residualLP, residualGP, gpCoInvestResidual, gpPromote, lpTotal, gpTotal, endLP: Math.max(0, openLP + lpContrib - rocLP),
      endGP: Math.max(0, openGP + gpContrib - rocGP), unpaidPref: Math.max(0, lpPrefAccrual + priorUnpaid - lpPrefPaid),
      reconciliation: projectCF + call - (lpTotal + gpTotal), lpNet: lpTotal - lpContrib, gpNet: gpTotal - gpContrib,
    };
    years.push(w);
    prev = w;
  });
  const lpInitial = deal.equity * p.lpShare;
  const gpInitial = deal.equity * (1 - p.lpShare);
  const lpCashflows = [-lpInitial, ...years.map((y) => y.lpNet)];
  const gpCashflows = [-gpInitial, ...years.map((y) => y.gpNet)];
  return {
    years, lpInitial, gpInitial, lpDistributions: years.reduce((a, y) => a + y.lpTotal, 0),
    gpDistributions: years.reduce((a, y) => a + y.gpTotal, 0), lpIRR: irr(lpCashflows), gpIRR: irr(gpCashflows),
    residualCash: years.reduce((a, y) => a + y.reconciliation, 0), lpCashflows, gpCashflows,
  };
}
