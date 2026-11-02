import { describe, expect, it } from 'vitest';
import { close, deal, inputs, scen } from './helpers';
import { ModelInputError, computeDeal, computeWaterfall, excelPMT, irr, sweep, exitEquityBridge, capVsNOIGrid, validateField } from '@/engine';

describe('11-12. Changes propagate', () => {
  it('purchase price raises acquisition, loan, equity; lowers IRR; maxBid unchanged', () => {
    const a = deal('TX', 'Base'), b = deal('TX', 'Base', { pricePerUnit: 150000 });
    expect(b.acquisition).toBeGreaterThan(a.acquisition);
    expect(b.loan).toBeGreaterThan(a.loan);
    expect(b.equity).toBeGreaterThan(a.equity);
    expect(b.leveredIRR!).toBeLessThan(a.leveredIRR!);
    close(b.maxBid!, a.maxBid!, 'max bid is price-invariant', 1e-9);
  });
  it('IRR at max bid equals the required IRR (max-bid solves the hurdle)', () => {
    for (const c of ['TX', 'Katy'] as const) {
      const base = deal(c, 'Base');
      const at = deal(c, 'Base', { pricePerUnit: base.maxBidPerUnit! });
      close(at.leveredIRR!, 0.15, `${c} IRR at max bid`, 1e-6);
    }
  });
  it('occupancy raises NOI and IRR', () => {
    const a = deal('TX', 'Base'), b = deal('TX', 'Base', { stabOcc: 0.95 });
    expect(b.year5NOI).toBeGreaterThan(a.year5NOI);
    expect(b.leveredIRR!).toBeGreaterThan(a.leveredIRR!);
  });
  it('financing changes debt service, DSCR and IRR', () => {
    const a = deal('TX', 'Base'), b = deal('TX', 'Base', { ltv: 0.7, coupon: 0.09 });
    expect(b.forecast[1].debtService).toBeGreaterThan(a.forecast[1].debtService);
    expect(b.minDSCR!).toBeLessThan(a.minDSCR!);
  });
  it('exit cap changes terminal value inversely', () => {
    const a = deal('TX', 'Base'), b = deal('TX', 'Base', { exitCap: 0.09 });
    close(b.exitValue, a.exitValue * 0.08 / 0.09, 'terminal value');
    expect(b.leveredIRR!).toBeLessThan(a.leveredIRR!);
  });
  it('scenario params propagate; sensitivity recalculates', () => {
    expect(deal('TX', 'Base', {}, { occDelta: -0.1 }).year5NOI).toBeLessThan(deal('TX', 'Base').year5NOI);
    const sw = sweep(inputs('TX'), scen('Base'), 'pricePerUnit', [120000, 135000, 150000]);
    expect(sw[0].deal!.leveredIRR!).toBeGreaterThan(sw[2].deal!.leveredIRR!);
    const g = capVsNOIGrid(deal('TX', 'Base'), [-0.1, 0, 0.1], [0.08]);
    expect(g[0][2]).toBeGreaterThan(g[0][0]);
  });
});

describe('Special conditions', () => {
  it('zero debt: no NaN, DSCR undefined (not 0), max bid still defined', () => {
    const d = deal('TX', 'Base', { ltv: 0 });
    expect(d.loan).toBe(0);
    expect(d.minDSCR).toBeNull();
    expect(d.forecast.every((f) => f.dscr === null && f.debtService === 0)).toBe(true);
    expect(Number.isFinite(d.leveredIRR!)).toBe(true);
    expect(d.maxBid).toBeGreaterThan(0);
    close(deal('TX', 'Base', { ltv: 0, pricePerUnit: d.maxBidPerUnit! }).leveredIRR!, 0.15, 'unlevered IRR at max bid', 1e-6);
    expect(d.debtToNOI).toBe(0);
  });
  it('exit value below debt payoff: shortfall flagged, equity cash flow negative, IRR undefined not 0', () => {
    const d = deal('TX', 'Down');
    expect(d.exitValue).toBeLessThan(d.loanPayoff);
    expect(d.exitShortfall).toBe(true);
    expect(d.netExitEquity).toBeLessThan(0);
    expect(d.forecast[4].equityCashFlow).toBeLessThan(0);
    expect(d.leveredIRR).toBeNull();
    expect(d.irrNote).toMatch(/No real IRR/);
    expect(d.moic).toBe(0);
    expect(d.clearsHurdle).toBe(false);
  });
  it('very low DSCR is reported as-is (<1.0x) and negative cash flow is allowed', () => {
    expect(deal('TX', 'Down').minDSCR!).toBeLessThan(1);
    const d = deal('Katy', 'Down');
    expect(d.forecast.some((f) => f.operatingEquityCF < 0)).toBe(true);
  });
  it('negative interim equity cash flow is treated as additional equity in MOIC and the waterfall as a capital call', () => {
    const d = deal('TX', 'Base', { rent: 3200 });
    const neg = d.forecast.filter((f) => f.equityCashFlow < 0);
    expect(neg.length).toBeGreaterThan(0);
    const w = computeWaterfall(d, inputs('TX'));
    expect(w.years.some((y) => y.call > 0)).toBe(true);
    w.years.forEach((y) => expect(Math.abs(y.reconciliation)).toBeLessThan(0.01));
    const pos = d.cashflows.slice(1).filter((x) => x > 0).reduce((a, b) => a + b, 0);
    const negsum = d.cashflows.slice(1).filter((x) => x < 0).reduce((a, b) => a + b, 0);
    close(d.moic, pos / (d.equity - negsum), 'moic');
  });
  it('IRR utility: undefined cases return null, never 0', () => {
    expect(irr([-100, -10, -5])).toBeNull();
    expect(irr([100, 10])).toBeNull();
    expect(irr([-100, 0, 0, 0, 0, 0])).toBeNull();
    close(irr([-100, 110])!, 0.1, 'simple');
    close(irr([-100, 50])!, -0.5, 'negative IRR is a real answer');
  });
  it('IRR utility: multiple sign changes flagged by deal note', () => {
    const d = deal('TX', 'Base', { rent: 3600 });
    if (d.cashflows.slice(1).some((x) => x < 0) && d.leveredIRR !== null) expect(d.irrNote).toMatch(/Multiple sign changes/);
  });
});

describe('Invalid inputs are rejected, not silently computed', () => {
  const bad: [string, Partial<ReturnType<typeof inputs>>][] = [
    ['exit cap 0', { exitCap: 0 }], ['exit cap negative', { exitCap: -0.05 }], ['exit cap 80%', { exitCap: 0.8 }],
    ['occupancy 120%', { startOcc: 1.2 }], ['occupancy negative', { stabOcc: -0.1 }], ['NaN price', { pricePerUnit: NaN }],
    ['amortization 0', { amortYears: 0 }], ['amortization negative', { amortYears: -5 }], ['amortization fractional', { amortYears: 12.5 }],
    ['LTV 110%', { ltv: 1.1 }], ['hold 7 years', { holdYears: 7 }], ['stabilization 0 months', { stabMonths: 0 }],
  ];
  it.each(bad)('%s', (_n, over) => { expect(() => computeDeal(inputs('TX', over), scen('Base'))).toThrow(ModelInputError); });
  it('scenario shift that drives the effective cap rate to <= 0 is rejected', () => {
    expect(() => computeDeal(inputs('TX', { exitCap: 0.01 }), scen('Base', { capShift: -0.02 }))).toThrow(ModelInputError);
  });
  it('field validator gives immediate messages', () => {
    expect(validateField('exitCap', 0.4)).toMatch(/between/);
    expect(validateField('amortYears', 25.5)).toMatch(/whole/);
    expect(validateField('ltv', 0.6)).toBeNull();
  });
  it('PMT guards', () => { expect(() => excelPMT(0.05, 0, 100)).toThrow(); close(excelPMT(0, 10, 100), -10, 'zero rate'); });
});

describe('Extreme but valid values stay finite', () => {
  it('sweeps across full valid ranges never produce NaN/Infinity', () => {
    for (const [key, vals] of [['exitCap', [0.01, 0.3]], ['ltv', [0, 1]], ['coupon', [0, 0.3]], ['amortYears', [1, 50]], ['stabMonths', [1, 120]],
      ['pricePerUnit', [1, 2_000_000]], ['ioYears', [0, 5]]] as const) {
      for (const r of sweep(inputs('TX'), scen('Base'), key, [...vals])) {
        expect(r.error, `${key}=${r.value}`).toBeNull();
        const d = r.deal!;
        for (const v of [d.equity, d.year5NOI, d.exitValue, d.moic, d.debtToNOI, ...d.cashflows]) expect(Number.isFinite(v)).toBe(true);
        if (d.leveredIRR !== null) expect(Number.isFinite(d.leveredIRR)).toBe(true);
      }
    }
  });
  it('exit equity bridge steps sum exactly to total change', () => {
    for (const s of ['Down', 'Up'] as const) {
      const b = exitEquityBridge(inputs('TX'), scen(s));
      close(b.start + b.steps.reduce((a, x) => a + x.delta, 0), b.end, 'bridge sum', 1e-12);
      close(b.end, deal('TX', s).netExitEquity, 'bridge end = scenario net exit equity', 1e-9);
    }
  });
  it('engine does not mutate its inputs', () => {
    const i = inputs('TX'), s = scen('Down'), before = JSON.stringify([i, s]);
    computeDeal(i, s);
    expect(JSON.stringify([i, s])).toBe(before);
  });
});
