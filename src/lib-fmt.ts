export const NM = 'NM';
const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
/** Full dollars, parentheses for negatives. */
export const usd = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? '–' : n < 0 ? `(${usd0.format(-n)})` : usd0.format(n));
/** Compact $M / $K for headline cards. */
export function usdM(n: number | null | undefined, d = 1) {
  if (n == null || !Number.isFinite(n)) return '–';
  const a = Math.abs(n), s = n < 0 ? '-' : '';
  if (a >= 1e6) return `${s}$${(a / 1e6).toFixed(d)}M`;
  if (a >= 1e3) return `${s}$${(a / 1e3).toFixed(0)}K`;
  return `${s}$${a.toFixed(0)}`;
}
export const pct = (n: number | null | undefined, d = 1) => (n == null || !Number.isFinite(n) ? NM : `${(n * 100).toFixed(d)}%`);
export const mult = (n: number | null | undefined, d = 2) => (n == null || !Number.isFinite(n) ? 'n/a' : `${n.toFixed(d)}x`);
export const int = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
export const signedPct = (n: number | null | undefined, d = 1) => (n == null || !Number.isFinite(n) ? '–' : `${n >= 0 ? '+' : ''}${(n * 100).toFixed(d)}%`);
