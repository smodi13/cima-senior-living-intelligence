import raw from './model-data.json';
import type { CaseId, DealInputs, ScenarioId, ScenarioParams } from '@/engine/types';

/** Workbook Inputs row number -> DealInputs key. */
const ROW_TO_KEY: Record<string, keyof DealInputs> = {
  '6': 'properties', '7': 'units', '8': 'startOcc', '9': 'stabOcc', '10': 'stabMonths', '11': 'rent', '12': 'rentGrowth',
  '13': 'ancillary', '14': 'ancillaryGrowth', '15': 'fixedStaffing', '16': 'variableLabor', '17': 'laborInflation',
  '18': 'otherFixed', '19': 'otherVariablePct', '20': 'fixedInflation', '21': 'taxIns', '22': 'taxInsInflation',
  '23': 'mgmtFeePct', '24': 'pricePerUnit', '25': 'closingPct', '26': 'renoPerUnit', '27': 'capexReservePerUnit',
  '28': 'ltv', '29': 'coupon', '30': 'ioYears', '31': 'amortYears', '32': 'finFeePct', '33': 'exitCap',
  '34': 'disposalPct', '35': 'holdYears', '36': 'requiredIRR', '37': 'lpPref', '38': 'gpPromote', '39': 'lpShare', '40': 'minDSCR',
};
const SCEN_ROW_TO_KEY: Record<string, keyof ScenarioParams> = {
  '6': 'occDelta', '7': 'rentMult', '8': 'laborMult', '9': 'capShift', '10': 'stabMonthsAdd', '11': 'ancMult',
  '12': 'nonlaborMult', '13': 'renoOverrun',
};

function map<T>(src: Record<string, number>, keys: Record<string, string>): T {
  const o: Record<string, number> = {};
  for (const [row, key] of Object.entries(keys)) {
    if (!(row in src)) throw new Error(`model-data.json missing row ${row}`);
    o[key] = src[row];
  }
  return o as unknown as T;
}

/** AUTHORITATIVE analyst assumptions (workbook Inputs sheet). Frozen; user edits live in separate state. */
export const ORIGINAL_INPUTS: Readonly<Record<CaseId, Readonly<DealInputs>>> = deepFreeze({
  TX: map<DealInputs>(raw.inputs.TX, ROW_TO_KEY),
  Katy: map<DealInputs>(raw.inputs.Katy, ROW_TO_KEY),
});
/** AUTHORITATIVE scenario parameters (workbook Scenarios sheet). */
export const ORIGINAL_SCENARIOS: Readonly<Record<ScenarioId, Readonly<ScenarioParams>>> = deepFreeze({
  Base: map<ScenarioParams>(raw.scenario.Base, SCEN_ROW_TO_KEY),
  Down: map<ScenarioParams>(raw.scenario.Down, SCEN_ROW_TO_KEY),
  Up: map<ScenarioParams>(raw.scenario.Up, SCEN_ROW_TO_KEY),
});

function deepFreeze<T>(o: T): T {
  Object.values(o as object).forEach((v) => typeof v === 'object' && v && Object.freeze(v));
  return Object.freeze(o);
}

export const CASE_META: Record<CaseId, { name: string; short: string; scope: string }> = {
  TX: { name: 'Cima North Texas Senior Living Portfolio', short: 'North Texas', scope: '10 communities, 359 units' },
  Katy: { name: 'The Reserve at Katy', short: 'Katy', scope: '82 residences' },
};
export const SCENARIO_META: Record<ScenarioId, { name: string; blurb: string }> = {
  Base: { name: 'Base', blurb: 'Workbook base assumptions' },
  Down: { name: 'Downside', blurb: 'Lower occupancy and rent, higher labor and nonlabor cost, slower ramp, wider exit cap, renovation overrun' },
  Up: { name: 'Upside', blurb: 'Higher occupancy and rent, lower cost, faster ramp, tighter exit cap' },
};
