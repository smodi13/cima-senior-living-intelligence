/** Excel PMT(rate, n, pv) with Excel sign convention (negative payment for positive pv). */
export function excelPMT(rate: number, n: number, pv: number): number {
  if (!(n > 0)) throw new RangeError('Amortization years must be positive');
  return Math.abs(rate) < 1e-12 ? -pv / n : (-pv * rate) / (1 - Math.pow(1 + rate, -n));
}

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function npv(rate: number, flows: number[]): number {
  return flows.reduce((s, c, i) => s + c / Math.pow(1 + rate, i), 0);
}

/** Workbook MOIC (Dashboard column O): positive Year 1-5 flows / (Year 0 equity + later negative flows treated as extra equity). */
export function workbookMoic(cashflows: number[]): number {
  const later = cashflows.slice(1);
  const positives = later.filter((n) => n > 0).reduce((a, b) => a + b, 0);
  const negatives = later.filter((n) => n < 0).reduce((a, b) => a + b, 0);
  const invested = -cashflows[0] - negatives;
  return invested > 0 ? positives / invested : 0;
}

export function signChanges(flows: number[]): number {
  let n = 0;
  let prev = 0;
  for (const f of flows) {
    const s = Math.sign(f);
    if (s !== 0) {
      if (prev !== 0 && s !== prev) n++;
      prev = s;
    }
  }
  return n;
}

/**
 * Annual IRR. Returns null when no real root exists (all flows one sign, or no
 * sign change in NPV over (-99.99%, +1e6%)). Never returns 0 for "undefined".
 * With several roots (multiple sign changes) the root nearest 10% is chosen,
 * which is where Excel's default guess starts.
 */
export function irr(flows: number[]): number | null {
  if (!flows.some((x) => x < 0) || !flows.some((x) => x > 0)) return null;
  const grid: number[] = [];
  for (let r = -0.9999; r < 1; r += 0.01) grid.push(r);
  for (let r = 1; r <= 1e6; r *= 1.5) grid.push(r);
  const roots: number[] = [];
  let prevR = grid[0];
  let prevV = npv(prevR, flows);
  for (let i = 1; i < grid.length; i++) {
    const r = grid[i];
    const v = npv(r, flows);
    if (Number.isFinite(prevV) && Number.isFinite(v)) {
      if (v === 0) roots.push(r);
      else if (prevV * v < 0) {
        let lo = prevR, hi = r, flo = prevV;
        for (let j = 0; j < 200; j++) {
          const mid = (lo + hi) / 2;
          const fm = npv(mid, flows);
          if (fm * flo > 0) { lo = mid; flo = fm; } else hi = mid;
        }
        roots.push((lo + hi) / 2);
      }
    }
    prevR = r; prevV = v;
  }
  if (!roots.length) return null;
  return roots.reduce((a, b) => (Math.abs(b - 0.1) < Math.abs(a - 0.1) ? b : a));
}
