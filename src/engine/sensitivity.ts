import { computeDeal } from './model';
import type { DealInputs, DealResult, ScenarioParams } from './types';

export const OCC_AXIS = [0.85, 0.87, 0.89, 0.91, 0.93, 0.95, 0.97];
export const CAP_AXIS = [0.07, 0.075, 0.08, 0.085, 0.09, 0.095, 0.1];

/** Net operating contribution of one extra occupied unit per month in Year 5 (workbook Bid Sensitivity marginal). */
export function marginalPerOccupiedUnit(deal: DealResult, i: DealInputs, s: ScenarioParams): number {
  const y5 = deal.forecast[4];
  const perUnit = y5.rent + y5.ancillary;
  return perUnit - i.variableLabor * s.laborMult * Math.pow(1 + i.laborInflation, 4) - perUnit * (i.otherVariablePct * s.nonlaborMult + i.mgmtFeePct);
}

/**
 * Gross terminal PROPERTY value (not equity) for exit cap x Year-5 occupancy.
 * Equals the workbook "Bid Sensitivity" sheet for North Texas Base. For other cases/scenarios the same
 * formula is applied (the workbook only publishes the TX Base grid); the variable-labor scenario multiplier
 * is included so the grid stays consistent with the Forecast (it is 1.0 in Base, so Base matches exactly).
 */
export function exitValueGrid(deal: DealResult, i: DealInputs, s: ScenarioParams, occs = OCC_AXIS, caps = CAP_AXIS): number[][] {
  const m = marginalPerOccupiedUnit(deal, i, s);
  const y5 = deal.forecast[4];
  return caps.map((c) => occs.map((o) => (y5.noi + (o - y5.occupancy) * i.units * 12 * m) / c));
}

/** Net equity proceeds at exit = value less disposal costs less loan payoff (can be negative). */
export const equityFromValue = (value: number, i: DealInputs, deal: DealResult) => value * (1 - i.disposalPct) - deal.loanPayoff;

/** Exit cap rate x change in Year-5 NOI (percent) -> gross property value. */
export function capVsNOIGrid(deal: DealResult, noiDeltas: number[], caps = CAP_AXIS): number[][] {
  return caps.map((c) => noiDeltas.map((d) => (deal.year5NOI * (1 + d)) / c));
}

export type Sweepable = keyof DealInputs;
/** Re-runs the full engine for each value of one input (price, leverage, etc.). */
export function sweep(i: DealInputs, s: ScenarioParams, key: Sweepable, values: number[]) {
  return values.map((v) => {
    try {
      const d = computeDeal({ ...i, [key]: v }, s);
      return { value: v, deal: d, error: null as string | null };
    } catch (e) {
      return { value: v, deal: null, error: (e as Error).message };
    }
  });
}

const NEUTRAL: ScenarioParams = { occDelta: 0, rentMult: 1, laborMult: 1, capShift: 0, stabMonthsAdd: 0, ancMult: 1, nonlaborMult: 1, renoOverrun: 0 };
export interface BridgeStep { label: string; delta: number }
/**
 * Sequential attribution of the change in Year-5 net exit equity from the neutral (no-stress) scenario to the selected one.
 * Order-dependent by construction; steps sum exactly to the total.
 */
export function exitEquityBridge(i: DealInputs, s: ScenarioParams) {
  const steps: [string, Partial<ScenarioParams>][] = [
    ['Occupancy', { occDelta: s.occDelta }],
    ['Stabilization timing', { stabMonthsAdd: s.stabMonthsAdd }],
    ['Resident rent', { rentMult: s.rentMult }],
    ['Ancillary revenue', { ancMult: s.ancMult }],
    ['Labor cost', { laborMult: s.laborMult }],
    ['Nonlabor cost', { nonlaborMult: s.nonlaborMult }],
    ['Exit cap rate', { capShift: s.capShift }],
  ];
  let cur = { ...NEUTRAL };
  const start = computeDeal(i, cur).netExitEquity;
  let last = start;
  const out: BridgeStep[] = [];
  for (const [label, patch] of steps) {
    cur = { ...cur, ...patch };
    const v = computeDeal(i, cur).netExitEquity;
    out.push({ label, delta: v - last });
    last = v;
  }
  return { start, steps: out, end: last };
}
