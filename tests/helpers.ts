import { ORIGINAL_INPUTS, ORIGINAL_SCENARIOS } from '@/data/inputs';
import { computeDeal } from '@/engine';
import type { CaseId, DealInputs, ScenarioId, ScenarioParams } from '@/engine';

export const inputs = (c: CaseId, over: Partial<DealInputs> = {}): DealInputs => ({ ...ORIGINAL_INPUTS[c], ...over });
export const scen = (s: ScenarioId, over: Partial<ScenarioParams> = {}): ScenarioParams => ({ ...ORIGINAL_SCENARIOS[s], ...over });
export const deal = (c: CaseId, s: ScenarioId, io: Partial<DealInputs> = {}, so: Partial<ScenarioParams> = {}) =>
  computeDeal(inputs(c, io), scen(s, so));
export const KEYS: [CaseId, ScenarioId][] = [['TX', 'Base'], ['TX', 'Down'], ['TX', 'Up'], ['Katy', 'Base'], ['Katy', 'Down'], ['Katy', 'Up']];
export const caseKey = (c: CaseId, s: ScenarioId) => `${c} ${s}`;
export function close(a: number, b: number, msg: string, tol = 1e-9) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a - b) > Math.max(1, Math.abs(b)) * tol)
    throw new Error(`${msg}: app=${a} excel=${b}`);
}
