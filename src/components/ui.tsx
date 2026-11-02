import type { ReactNode } from 'react';

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass">{eyebrow}</p>
      <h1 className="mt-1 font-serif text-3xl leading-tight text-navy-900 sm:text-4xl">{title}</h1>
      {children && <div className="mt-3 max-w-3xl text-[15px] leading-relaxed text-muted">{children}</div>}
    </header>
  );
}

export function Card({ title, subtitle, children, className = '', right }: { title?: string; subtitle?: string; children: ReactNode; className?: string; right?: ReactNode }) {
  return (
    <section className={`rounded-md border border-line bg-white ${className}`}>
      {(title || right) && (
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-4 py-3 sm:px-5">
          <div>
            {title && <h2 className="text-[15px] font-semibold text-navy-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export type Tone = 'neutral' | 'pos' | 'neg' | 'warn';
const toneCls: Record<Tone, string> = { neutral: 'text-navy-900', pos: 'text-pos', neg: 'text-neg', warn: 'text-warn' };

export function Kpi({ label, value, sub, tone = 'neutral' }: { label: string; value: string; sub?: string; tone?: Tone }) {
  return (
    <div className="rounded-md border border-line bg-white px-4 py-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</dt>
      <dd className={`num mt-1 font-serif text-2xl ${toneCls[tone]}`} data-testid={`kpi-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{value}</dd>
      {sub && <dd className="mt-0.5 text-xs text-muted">{sub}</dd>}
    </div>
  );
}

export function Chip({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'navy' | 'pos' | 'neg' | 'warn' | 'brass' }) {
  const c = {
    neutral: 'bg-paper text-muted border-line', navy: 'bg-navy-900 text-white border-navy-900', pos: 'bg-emerald-50 text-pos border-emerald-200',
    neg: 'bg-red-50 text-neg border-red-200', warn: 'bg-amber-50 text-warn border-amber-200', brass: 'bg-[#f6efdd] text-brass border-[#e3d3a5]',
  }[tone];
  return <span className={`inline-block rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${c}`}>{children}</span>;
}

export function Callout({ title, children, tone = 'neutral' }: { title: string; children: ReactNode; tone?: 'neutral' | 'warn' | 'neg' }) {
  const c = { neutral: 'border-navy-700 bg-[#eef2f8]', warn: 'border-warn bg-amber-50', neg: 'border-neg bg-red-50' }[tone];
  return (
    <div role="note" className={`rounded-r border-l-4 px-4 py-3 text-sm leading-relaxed ${c}`}>
      <p className="font-semibold text-navy-900">{title}</p>
      <div className="mt-1 text-ink">{children}</div>
    </div>
  );
}

export function Table({ head, children, caption, className = '' }: { head: ReactNode[]; children: ReactNode; caption: string; className?: string }) {
  return (
    <>
    <p className="mb-1 text-[11px] text-muted md:hidden" aria-hidden="true">Swipe sideways to see all columns</p>
    <div className="table-scroll" tabIndex={0} role="region" aria-label={caption}>
      <table className={`w-full min-w-max border-collapse text-sm ${className}`}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-navy-900 text-left">
            {head.map((h, i) => (
              <th key={i} scope="col" className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted ${i > 0 ? 'text-right' : ''}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
    </>
  );
}
export const Td = ({ children, left, bold, tone }: { children: ReactNode; left?: boolean; bold?: boolean; tone?: Tone }) => (
  <td className={`num whitespace-nowrap px-3 py-2 ${left ? 'text-left' : 'text-right'} ${bold ? 'font-semibold' : ''} ${tone ? toneCls[tone] : ''}`}>{children}</td>
);
export const Tr = ({ children, strong }: { children: ReactNode; strong?: boolean }) => (
  <tr className={`border-b border-line ${strong ? 'bg-paper font-semibold' : ''}`}>{children}</tr>
);

export function Disclaimer({ compact }: { compact?: boolean }) {
  return (
    <div className="text-xs leading-relaxed text-muted">
      <p className="font-semibold text-navy-900">Independent illustrative investment analysis.</p>
      <p>Not affiliated with or endorsed by Cima Investment Group.</p>
      {!compact && <p>Actual undisclosed transaction financials are not represented. All purchase prices, operating economics, loan terms and investor terms are analyst assumptions.</p>}
    </div>
  );
}
