import type { DealInputs, Issue, ScenarioParams } from './types';

interface Rule { min: number; max: number; int?: boolean; label: string }

export const RULES: Partial<Record<keyof DealInputs, Rule>> = {
  startOcc: { min: 0, max: 1, label: 'Starting occupancy' },
  stabOcc: { min: 0, max: 1, label: 'Target occupancy' },
  stabMonths: { min: 1, max: 120, int: true, label: 'Months to stabilization' },
  rent: { min: 0, max: 50000, label: 'Monthly resident revenue' },
  rentGrowth: { min: -0.2, max: 0.3, label: 'Rent growth' },
  ancillary: { min: 0, max: 10000, label: 'Ancillary revenue' },
  ancillaryGrowth: { min: -0.2, max: 0.3, label: 'Ancillary growth' },
  fixedStaffing: { min: 0, max: 20000, label: 'Fixed staffing' },
  variableLabor: { min: 0, max: 20000, label: 'Variable care labor' },
  laborInflation: { min: -0.2, max: 0.3, label: 'Labor inflation' },
  otherFixed: { min: 0, max: 20000, label: 'Other fixed expense' },
  otherVariablePct: { min: 0, max: 1, label: 'Other variable expense' },
  fixedInflation: { min: -0.2, max: 0.3, label: 'Fixed expense inflation' },
  taxIns: { min: 0, max: 20000, label: 'Tax and insurance' },
  taxInsInflation: { min: -0.2, max: 0.3, label: 'Tax and insurance inflation' },
  mgmtFeePct: { min: 0, max: 0.5, label: 'Management fee' },
  pricePerUnit: { min: 1, max: 2_000_000, label: 'Purchase price per unit' },
  closingPct: { min: 0, max: 0.2, label: 'Closing costs' },
  renoPerUnit: { min: 0, max: 500_000, label: 'Acquisition capex per unit' },
  capexReservePerUnit: { min: 0, max: 50_000, label: 'Recurring capex per unit' },
  ltv: { min: 0, max: 1, label: 'Loan-to-value' },
  coupon: { min: 0, max: 0.3, label: 'Interest rate' },
  ioYears: { min: 0, max: 5, int: true, label: 'Interest-only years' },
  amortYears: { min: 1, max: 50, int: true, label: 'Amortization years' },
  finFeePct: { min: 0, max: 0.1, label: 'Financing fee' },
  exitCap: { min: 0.01, max: 0.3, label: 'Exit cap rate' },
  disposalPct: { min: 0, max: 0.2, label: 'Disposal costs' },
  requiredIRR: { min: -0.5, max: 1, label: 'Required IRR' },
  lpPref: { min: 0, max: 1, label: 'LP preferred return' },
  gpPromote: { min: 0, max: 1, label: 'GP promote' },
  lpShare: { min: 0, max: 1, label: 'LP share of equity' },
  minDSCR: { min: 0.5, max: 4, label: 'Minimum DSCR threshold' },
};

export function validateField(key: keyof DealInputs, value: number): string | null {
  const r = RULES[key];
  if (!r) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) return `${r.label} must be a number`;
  if (r.int && !Number.isInteger(value)) return `${r.label} must be a whole number`;
  if (value < r.min || value > r.max) return `${r.label} must be between ${r.min} and ${r.max}`;
  return null;
}

export function validateInputs(i: DealInputs, s: ScenarioParams): Issue[] {
  const out: Issue[] = [];
  for (const k of Object.keys(RULES) as (keyof DealInputs)[]) {
    const m = validateField(k, i[k]);
    if (m) out.push({ field: k, message: m });
  }
  if (!(i.units > 0) || !Number.isInteger(i.units)) out.push({ field: 'units', message: 'Units must be a positive whole number' });
  if (i.holdYears !== 5) out.push({ field: 'holdYears', message: 'Workbook methodology is a fixed five-year annual hold' });
  if (!(i.exitCap + s.capShift > 0)) out.push({ field: 'exitCap', message: 'Effective exit cap rate (input plus scenario shift) must be positive' });
  if (i.requiredIRR <= -1) out.push({ field: 'requiredIRR', message: 'Required IRR must exceed -100%' });
  return out;
}

export class ModelInputError extends Error {
  constructor(public issues: Issue[]) {
    super('Invalid model inputs: ' + issues.map((x) => `${x.field}: ${x.message}`).join('; '));
  }
}
