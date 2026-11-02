'use client';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { ORIGINAL_INPUTS, ORIGINAL_SCENARIOS } from '@/data/inputs';
import { CASES, SCENARIOS, computeDeal, type CaseId, type DealInputs, type DealResult, type ScenarioId, type ScenarioParams } from '@/engine';

type InputEdits = Record<CaseId, Partial<DealInputs>>;
type ScenEdits = Record<ScenarioId, Partial<ScenarioParams>>;
const emptyInputs = (): InputEdits => ({ TX: {}, Katy: {} });
const emptyScen = (): ScenEdits => ({ Base: {}, Down: {}, Up: {} });

interface Ctx {
  caseId: CaseId; setCaseId(c: CaseId): void;
  scenarioId: ScenarioId; setScenarioId(s: ScenarioId): void;
  /** Effective (original + user edits) values. */
  inputs(c?: CaseId): DealInputs;
  scenario(s?: ScenarioId): ScenarioParams;
  /** Results for current assumptions / for the untouched analyst assumptions. */
  result(c?: CaseId, s?: ScenarioId): DealResult | null;
  original(c?: CaseId, s?: ScenarioId): DealResult;
  setInput<K extends keyof DealInputs>(c: CaseId, k: K, v: number): void;
  setScenarioParam<K extends keyof ScenarioParams>(s: ScenarioId, k: K, v: number): void;
  resetField(c: CaseId, k: keyof DealInputs): void;
  resetScenarioField(s: ScenarioId, k: keyof ScenarioParams): void;
  resetCase(c: CaseId): void;
  resetAll(): void;
  modifiedKeys(c: CaseId): (keyof DealInputs)[];
  modifiedScenarioKeys(): { s: ScenarioId; k: keyof ScenarioParams }[];
  isModified(c?: CaseId): boolean;
  anyModified: boolean;
}
const C = createContext<Ctx | null>(null);
export const useModel = () => { const c = useContext(C); if (!c) throw new Error('ModelProvider missing'); return c; };

// Originals never change, so compute once per session.
const ORIG_RESULTS: Record<string, DealResult> = {};
for (const c of CASES) for (const s of SCENARIOS) ORIG_RESULTS[`${c}|${s}`] = computeDeal({ ...ORIGINAL_INPUTS[c] }, { ...ORIGINAL_SCENARIOS[s] });

export function ModelProvider({ children }: { children: ReactNode }) {
  const [caseId, setCaseId] = useState<CaseId>('TX');
  const [scenarioId, setScenarioId] = useState<ScenarioId>('Base');
  const [ie, setIe] = useState<InputEdits>(emptyInputs);
  const [se, setSe] = useState<ScenEdits>(emptyScen);

  const inputs = useCallback((c: CaseId = caseId): DealInputs => ({ ...ORIGINAL_INPUTS[c], ...ie[c] }), [caseId, ie]);
  const scenario = useCallback((s: ScenarioId = scenarioId): ScenarioParams => ({ ...ORIGINAL_SCENARIOS[s], ...se[s] }), [scenarioId, se]);

  const results = useMemo(() => {
    const m: Record<string, DealResult | null> = {};
    for (const c of CASES) for (const s of SCENARIOS) {
      try { m[`${c}|${s}`] = computeDeal({ ...ORIGINAL_INPUTS[c], ...ie[c] }, { ...ORIGINAL_SCENARIOS[s], ...se[s] }); } catch { m[`${c}|${s}`] = null; }
    }
    return m;
  }, [ie, se]);

  const setInput: Ctx['setInput'] = useCallback((c, k, v) => setIe((p) => {
    const next = { ...p[c] };
    if (v === ORIGINAL_INPUTS[c][k]) delete next[k]; else next[k] = v;
    return { ...p, [c]: next };
  }), []);
  const setScenarioParam: Ctx['setScenarioParam'] = useCallback((s, k, v) => setSe((p) => {
    const next = { ...p[s] };
    if (v === ORIGINAL_SCENARIOS[s][k]) delete next[k]; else next[k] = v;
    return { ...p, [s]: next };
  }), []);

  const modifiedKeys = useCallback((c: CaseId) => Object.keys(ie[c]) as (keyof DealInputs)[], [ie]);
  const modifiedScenarioKeys = useCallback(
    () => SCENARIOS.flatMap((s) => (Object.keys(se[s]) as (keyof ScenarioParams)[]).map((k) => ({ s, k }))), [se]);
  const scenModified = SCENARIOS.some((s) => Object.keys(se[s]).length > 0);

  const value: Ctx = {
    caseId, setCaseId, scenarioId, setScenarioId, inputs, scenario,
    result: (c = caseId, s = scenarioId) => results[`${c}|${s}`],
    original: (c = caseId, s = scenarioId) => ORIG_RESULTS[`${c}|${s}`],
    setInput, setScenarioParam,
    resetField: (c, k) => setIe((p) => { const n = { ...p[c] }; delete n[k]; return { ...p, [c]: n }; }),
    resetScenarioField: (s, k) => setSe((p) => { const n = { ...p[s] }; delete n[k]; return { ...p, [s]: n }; }),
    resetCase: (c) => setIe((p) => ({ ...p, [c]: {} })),
    resetAll: () => { setIe(emptyInputs()); setSe(emptyScen()); },
    modifiedKeys, modifiedScenarioKeys,
    isModified: (c) => (c ? Object.keys(ie[c]).length > 0 : CASES.some((x) => Object.keys(ie[x]).length > 0)) || scenModified,
    anyModified: CASES.some((x) => Object.keys(ie[x]).length > 0) || scenModified,
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}
