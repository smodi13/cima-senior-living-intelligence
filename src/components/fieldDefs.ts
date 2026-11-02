import type { DealInputs } from '@/engine';

export type Unit = 'usd' | 'pct' | 'int';
export interface FieldDef { key: keyof DealInputs; label: string; unit: Unit; step: number; suffix?: string; hint?: string }
export interface FieldGroup { title: string; fields: FieldDef[] }

export const FIELD_GROUPS: FieldGroup[] = [
  { title: 'Acquisition', fields: [
    { key: 'pricePerUnit', label: 'Purchase price per unit', unit: 'usd', step: 1000, suffix: '$ / unit', hint: 'Illustrative; not a disclosed price' },
    { key: 'closingPct', label: 'Closing costs', unit: 'pct', step: 0.25, suffix: '% of price' },
    { key: 'renoPerUnit', label: 'Acquisition capex (renovation)', unit: 'usd', step: 500, suffix: '$ / unit' },
  ] },
  { title: 'Occupancy and revenue', fields: [
    { key: 'startOcc', label: 'Starting occupancy', unit: 'pct', step: 1, suffix: '%' },
    { key: 'stabOcc', label: 'Target occupancy', unit: 'pct', step: 1, suffix: '%' },
    { key: 'stabMonths', label: 'Occupancy stabilization period', unit: 'int', step: 1, suffix: 'months' },
    { key: 'rent', label: 'Monthly resident revenue', unit: 'usd', step: 50, suffix: '$ / occupied unit / mo' },
    { key: 'rentGrowth', label: 'Rent growth', unit: 'pct', step: 0.25, suffix: '% / yr' },
    { key: 'ancillary', label: 'Ancillary revenue', unit: 'usd', step: 10, suffix: '$ / occupied unit / mo' },
    { key: 'ancillaryGrowth', label: 'Ancillary growth', unit: 'pct', step: 0.25, suffix: '% / yr' },
  ] },
  { title: 'Labor and operating expenses', fields: [
    { key: 'fixedStaffing', label: 'Fixed staffing', unit: 'usd', step: 10, suffix: '$ / unit / mo' },
    { key: 'variableLabor', label: 'Variable care labor', unit: 'usd', step: 10, suffix: '$ / occupied unit / mo' },
    { key: 'laborInflation', label: 'Labor inflation', unit: 'pct', step: 0.25, suffix: '% / yr' },
    { key: 'otherFixed', label: 'Other fixed expense', unit: 'usd', step: 10, suffix: '$ / unit / mo' },
    { key: 'otherVariablePct', label: 'Other variable expense', unit: 'pct', step: 0.5, suffix: '% of revenue' },
    { key: 'fixedInflation', label: 'Fixed expense inflation', unit: 'pct', step: 0.25, suffix: '% / yr' },
    { key: 'taxIns', label: 'Property tax and insurance', unit: 'usd', step: 5, suffix: '$ / unit / mo' },
    { key: 'taxInsInflation', label: 'Tax and insurance inflation', unit: 'pct', step: 0.25, suffix: '% / yr' },
    { key: 'mgmtFeePct', label: 'Management fee', unit: 'pct', step: 0.25, suffix: '% of revenue' },
  ] },
  { title: 'Recurring capital', fields: [
    { key: 'capexReservePerUnit', label: 'Recurring capex reserve', unit: 'usd', step: 25, suffix: '$ / unit / yr' },
  ] },
  { title: 'Financing', fields: [
    { key: 'ltv', label: 'Loan-to-value', unit: 'pct', step: 1, suffix: '%' },
    { key: 'coupon', label: 'Interest rate', unit: 'pct', step: 0.25, suffix: '%' },
    { key: 'ioYears', label: 'Interest-only period', unit: 'int', step: 1, suffix: 'years' },
    { key: 'amortYears', label: 'Amortization period', unit: 'int', step: 1, suffix: 'years' },
    { key: 'finFeePct', label: 'Financing fee', unit: 'pct', step: 0.25, suffix: '% of loan' },
  ] },
  { title: 'Exit and return hurdle', fields: [
    { key: 'exitCap', label: 'Exit cap rate', unit: 'pct', step: 0.25, suffix: '%' },
    { key: 'disposalPct', label: 'Sale transaction expenses', unit: 'pct', step: 0.25, suffix: '% of sale' },
    { key: 'requiredIRR', label: 'Required levered IRR (bid hurdle)', unit: 'pct', step: 0.5, suffix: '%' },
    { key: 'minDSCR', label: 'Minimum DSCR threshold', unit: 'usd', step: 0.05, suffix: 'x' },
  ] },
];
export const FIELD_BY_KEY = Object.fromEntries(FIELD_GROUPS.flatMap((g) => g.fields).map((f) => [f.key, f])) as Record<keyof DealInputs, FieldDef>;

/** Fractions are shown as percentages; trim float noise without rounding the stored value. */
export const toDisplay = (v: number, u: Unit) => String(u === 'pct' ? Number((v * 100).toPrecision(10)) : v);
export const fromDisplay = (t: string, u: Unit) => { const n = t.trim() === '' ? NaN : Number(t); return u === 'pct' ? n / 100 : n; };
