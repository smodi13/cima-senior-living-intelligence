import { describe, expect, it } from 'vitest';
import baseline from './excel-baseline.json';
import wfBase from './waterfall-baseline.json';
import dtBase from './debt-treatment-baseline.json';
import { KEYS, caseKey, close, deal, inputs, scen } from './helpers';
import { CAP_AXIS, OCC_AXIS, computeDebtTreatment, computeWaterfall, exitValueGrid } from '@/engine';

const sumH = baseline.summary[0] as string[];
const SUMMARY: Record<string, string> = {
  'Units': 'units', 'Price / unit': 'pricePerUnit', 'Acquisition $': 'acquisition', 'Closing costs': 'closing', 'Upfront capex': 'upfrontCapex',
  'Initial debt': 'loan', 'Financing fee': 'financingFee', 'Initial equity': 'equity', 'Exit cap': 'exitCap', 'Exit value': 'exitValue',
  'Debt payoff': 'loanPayoff', 'Net operating equity CF': 'operatingEquityCF', 'Levered IRR': 'leveredIRR', 'Equity MOIC': 'moic',
  'MAX BID price': 'maxBid', 'MAX BID / unit': 'maxBidPerUnit', 'Headroom vs price': 'headroom', 'Year 1 NOI': 'year1NOI',
  'Year 5 NOI': 'year5NOI', 'Min DSCR': 'minDSCR', 'Debt / Year 5 NOI': 'debtToNOI',
};
const FORECAST: Record<string, string> = {
  'Occupancy': 'occupancy', 'Occupied units': 'occupiedUnits', 'Rent / mo': 'rent', 'Ancillary / mo': 'ancillary', 'Revenue / yr': 'revenue',
  'Fixed labor': 'fixedLabor', 'Variable labor': 'variableLabor', 'Fixed nonlabor': 'fixedNonlabor', 'Other variable cost': 'variableOther',
  'Tax + insurance': 'taxInsurance', 'Management fee': 'managementFee', 'Total opex': 'operatingExpenses', 'NOI': 'noi', 'Capex reserve': 'capexReserve',
  'CF before debt': 'beforeDebt', 'Opening loan': 'openingLoan', 'Interest': 'interest', 'Principal': 'principal', 'Debt service': 'debtService',
  'Closing loan': 'closingLoan', 'DSCR': 'dscrWorkbook', 'Operating equity CF': 'operatingEquityCF', 'Gross sale': 'grossSale', 'Sale fees': 'saleFees',
  'Loan payoff': 'loanPayoff', 'Total equity CF': 'equityCashFlow', 'PV before debt': 'pvBeforeDebt', 'PV debt service': 'pvDebtService', 'PV sale': 'pvSale',
};

describe('1. Six cases reconcile to Excel Dashboard (21 fields each)', () => {
  for (const [c, s] of KEYS) {
    it(caseKey(c, s), () => {
      const row = (baseline.summary as unknown[][]).find((r) => r[0] === caseKey(c, s))!;
      const d = deal(c, s) as unknown as Record<string, number | null>;
      let n = 0;
      for (let j = 1; j < row.length; j++) {
        const k = SUMMARY[sumH[j]];
        if (row[j] === 'NM') expect(d[k], `${sumH[j]} must be null (NM)`).toBeNull();
        else close(d[k] as number, row[j] as number, `${caseKey(c, s)} ${sumH[j]}`);
        n++;
      }
      expect(n).toBe(21);
    });
  }
});

describe('2-9. All forecast periods, debt, NOI, equity CF, exit reconcile (29 fields x 5 years x 6 cases)', () => {
  const fh = baseline.forecast[0] as string[];
  let caseName = '', yi = 0;
  for (const r of (baseline.forecast as unknown[][]).slice(1)) {
    if (r[0]) { caseName = r[0] as string; yi = 0; }
    if (!r[1]) continue;
    const name = caseName, y = yi++, row = r;
    it(`${name} year ${y + 1}`, () => {
      const [c, s] = name.split(' ') as ['TX' | 'Katy', 'Base' | 'Down' | 'Up'];
      const f = deal(c, s).forecast[y] as unknown as Record<string, number>;
      expect(f.year).toBe(row[1]);
      for (let j = 2; j < row.length; j++) close(f[FORECAST[fh[j]]], row[j] as number, `${name} Y${y + 1} ${fh[j]}`);
    });
  }
});

describe('Sources and uses', () => {
  it.each(KEYS)('%s: debt + equity = price + closing + capex + fee', (c, s) => {
    const d = deal(c, s);
    close(d.loan + d.equity, d.acquisition + d.closing + d.upfrontCapex + d.financingFee, 'S&U', 1e-12);
  });
  it('equity cash flow = ops + exit waterfall every year', () => {
    for (const [c, s] of KEYS) for (const f of deal(c, s).forecast)
      close(f.equityCashFlow, f.operatingEquityCF + f.grossSale + f.saleFees + f.loanPayoff, 'ECF', 1e-12);
  });
});

describe('13. Bid sensitivity grid = Excel (TX Base, 49 cells)', () => {
  it('matches', () => {
    const d = deal('TX', 'Base');
    const grid = exitValueGrid(d, inputs('TX'), scen('Base'));
    const x = baseline.sensitivity as number[][];
    expect(OCC_AXIS).toEqual(x[0].slice(1));
    expect(CAP_AXIS).toEqual(x.slice(1).map((r) => r[0]));
    grid.forEach((row, r) => row.forEach((v, c) => close(v, x[r + 1][c + 1], `sens ${r},${c}`)));
  });
});

describe('14. REVIEWED LP/GP waterfall = Excel (TX Base)', () => {
  const d = deal('TX', 'Base');
  const w = computeWaterfall(d, inputs('TX'));
  const cols = ['year', 'projectCF', 'openLP', 'openGP', 'call', 'lpContrib', 'gpContrib', 'cash', 'lpPrefAccrual', 'rocLP', 'rocGP', 'lpPrefPaid',
    'residualLP', 'residualGP', 'lpTotal', 'gpTotal', 'endLP', 'endGP', 'unpaidPref', 'reconciliation', 'lpNet', 'gpNet', 'gpCoInvestResidual', 'gpPromote'];
  it('all 24 columns (A:X, incl. new W and X) x 5 years', () => {
    (wfBase.rows as number[][]).forEach((row, y) => cols.forEach((k, j) => {
      const got = (w.years[y] as unknown as Record<string, number>)[k];
      close(got, row[j], `WF Y${y + 1} ${k}`, 1e-9);
    }));
  });
  it('summary block', () => {
    const s = wfBase.summary as Record<string, number>;
    close(w.lpInitial, s['LP initial contribution'], 'lp0'); close(w.gpInitial, s['GP initial contribution'], 'gp0');
    close(w.lpDistributions, s['LP distributions'], 'lpd'); close(w.gpDistributions, s['GP distributions'], 'gpd');
    close(w.lpIRR!, s['LP annualized IRR'], 'lpirr'); close(w.gpIRR!, s['GP annualized IRR'], 'gpirr');
    expect(Math.abs(w.residualCash)).toBeLessThan(0.01);
  });
});

describe('Workbook control tests (Checks sheet) hold in the app', () => {
  it('direction: downside < base < upside', () => {
    for (const c of ['TX', 'Katy'] as const) {
      expect(deal(c, 'Down').leveredIRR).toBeNull();
      expect(deal(c, 'Up').leveredIRR!).toBeGreaterThan(deal(c, 'Base').leveredIRR!);
    }
  });
  it('loan balance never negative; five annual periods', () => {
    for (const [c, s] of KEYS) { const f = deal(c, s).forecast; expect(f).toHaveLength(5); f.forEach((y) => expect(y.closingLoan).toBeGreaterThanOrEqual(0)); }
  });
});

describe('Reviewed waterfall: GP co-invest residual + promote', () => {
  const d = deal('TX', 'Base');
  const w = computeWaterfall(d, inputs('TX'));
  it('GP residual = co-invest residual + promote; LP residual = residual - GP residual (every year)', () => {
    for (const y of w.years) {
      close(y.residualGP, y.gpCoInvestResidual + y.gpPromote, 'N = W + X', 1e-12);
      close(y.residualLP + y.residualGP, Math.max(0, y.cash - y.rocLP - y.rocGP - y.lpPrefPaid), 'M + N = residual', 1e-12);
      close(y.lpTotal + y.gpTotal, y.cash, 'distributions = distributable cash', 1e-12);
    }
  });
  it('residual split is 72/28 at 90% LP, 20% promote (derived from inputs, not hardcoded)', () => {
    const y = w.years[4];
    close(y.residualLP / (y.residualLP + y.residualGP), 0.9 * (1 - 0.2), 'LP share of residual', 1e-12);
    close(y.gpCoInvestResidual / (y.residualLP + y.residualGP), 0.1, 'GP co-invest share', 1e-12);
    close(y.gpPromote / (y.residualLP + y.residualGP), 0.9 * 0.2, 'promote share', 1e-12);
  });
  it('engine-derived LP and GP IRRs are approximately 17.5% and 31.3%', () => {
    expect(w.lpIRR!).toBeGreaterThan(0.1745); expect(w.lpIRR!).toBeLessThan(0.1755);
    expect(w.gpIRR!).toBeGreaterThan(0.3125); expect(w.gpIRR!).toBeLessThan(0.3135);
  });
  it('no promote when promote input is 0; LP and GP share residual pro rata to capital', () => {
    const w0 = computeWaterfall(d, { ...inputs('TX'), gpPromote: 0 });
    expect(w0.years[4].gpPromote).toBe(0);
    close(w0.years[4].gpCoInvestResidual / (w0.years[4].residualLP + w0.years[4].residualGP), 0.1, 'pro rata', 1e-12);
  });
  it('invariants hold across all cases/scenarios and a capital-call case', () => {
    for (const [c, s] of KEYS) {
      const ww = computeWaterfall(deal(c, s), inputs(c));
      for (const y of ww.years) { expect(Math.abs(y.reconciliation)).toBeLessThan(0.01); close(y.residualGP, y.gpCoInvestResidual + y.gpPromote, 'N=W+X', 1e-12); }
    }
  });
});

describe('15. Debt Treatment sheet (6 cases) = Excel; alternative exit cash flow', () => {
  const names = ['TX Base', 'TX Down', 'TX Up', 'Katy Base', 'Katy Down', 'Katy Up'];
  (dtBase.rows as (string | number)[][]).forEach((row, i) => {
    it(names[i], () => {
      expect(row[0]).toBe(names[i]);
      const [c, s] = names[i].split(' ') as ['TX' | 'Katy', 'Base' | 'Down' | 'Up'];
      const t = computeDebtTreatment(deal(c, s));
      const got = [t.grossSale, t.disposalCosts, t.netSaleProceeds, t.outstandingDebt, t.payoffShortfall, t.saleEquityFloored, t.saleCashAfterDebt,
        t.y5OperatingEquityCF, t.limitedRecourseY5CF, t.sponsorSupportedY5CF, t.impliedCure];
      got.forEach((g, j) => close(g, row[j + 1] as number, `${names[i]} col ${j + 1}`, 1e-9));
      close(t.impliedCure, t.payoffShortfall, 'difference equals payoff shortfall', 1e-9);
    });
  });
  it('shortfall cases: NT Down ~ $4,750,480 and Katy Down ~ $1,365,406 after sale costs; floored sale equity is zero', () => {
    close(computeDebtTreatment(deal('TX', 'Down')).payoffShortfall, 4750479.9284, 'tx', 1e-8);
    close(computeDebtTreatment(deal('Katy', 'Down')).payoffShortfall, 1365405.9738, 'katy', 1e-8);
    expect(computeDebtTreatment(deal('TX', 'Down')).saleEquityFloored).toBe(0);
  });
  it('alternative treatment: operating deficits stay funded; IRR NM and MOIC 0 stay NM in downside; unchanged where no shortfall', () => {
    const dn = computeDebtTreatment(deal('TX', 'Down'));
    expect(dn.limitedRecourse.cashflows.slice(1).every((x) => x <= 0)).toBe(true);
    expect(dn.limitedRecourse.irr).toBeNull();
    expect(dn.limitedRecourse.moic).toBe(0);
    const b = computeDebtTreatment(deal('TX', 'Base'));
    expect(b.payoffShortfall).toBe(0);
    close(b.limitedRecourse.irr!, b.sponsorSupported.irr!, 'same IRR when no shortfall', 1e-12);
  });
  it('responds to assumption changes (higher leverage creates a shortfall under a stress)', () => {
    const t = computeDebtTreatment(deal('TX', 'Base', { exitCap: 0.2, ltv: 0.75 }));
    expect(t.payoffShortfall).toBeGreaterThan(0);
    close(t.impliedCure, t.payoffShortfall, 'cure', 1e-9);
  });
});
