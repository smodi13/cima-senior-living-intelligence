'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { CASES, SCENARIOS } from '@/engine';
import { CASE_META, SCENARIO_META } from '@/data/inputs';
import { useModel } from '@/store/model';
import { Disclaimer } from './ui';

export const NAV = [
  { href: '/', label: 'Investment Overview' },
  { href: '/underwriting', label: 'Acquisition Underwriting' },
  { href: '/scenarios', label: 'Scenario Analysis' },
  { href: '/pricing', label: 'Purchase Price Discipline' },
  { href: '/sensitivity', label: 'Sensitivity Analysis' },
  { href: '/turnaround', label: 'Operating Turnaround' },
  { href: '/diligence', label: 'Investment Diligence' },
  { href: '/investors', label: 'Investor Economics' },
  { href: '/research', label: 'Investment Research' },
  { href: '/methodology', label: 'Methodology and Downloads' },
];

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; text: string }[]; onChange(v: T): void }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex overflow-hidden rounded border border-line bg-white text-sm">
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} onClick={() => onChange(o.id)}
          className={`px-3 py-1.5 font-medium transition-colors ${value === o.id ? 'bg-navy-900 text-white' : 'text-ink hover:bg-paper'}`}>{o.text}</button>
      ))}
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const m = useModel();
  const nav = (
    <nav aria-label="Primary" className="flex flex-col gap-0.5">
      {NAV.map((n) => {
        const active = path === n.href;
        return (
          <Link key={n.href} href={n.href} onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined}
            className={`rounded px-3 py-2 text-sm ${active ? 'bg-white/12 font-semibold text-white' : 'text-slate-300 hover:bg-white/8 hover:text-white'}`}>{n.label}</Link>
        );
      })}
    </nav>
  );
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-2">Skip to content</a>
      <aside className="hidden bg-navy-900 px-4 py-6 lg:block">
        <div className="sticky top-6">
          <Link href="/" className="block px-3 pb-5">
            <span className="block font-serif text-lg leading-tight text-white">Senior Living Acquisition and Turnaround Intelligence</span>
            <span className="mt-1 block text-[11px] uppercase tracking-[0.14em] text-[#d9bd7a]">Independent case study</span>
          </Link>
          {nav}
          <div className="mt-8 border-t border-white/15 px-3 pt-4 text-slate-300 [&_p]:text-slate-300 [&_.text-navy-900]:text-white"><Disclaimer compact /></div>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="bg-navy-900 px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between">
            <Link href="/" className="font-serif text-base text-white">Senior Living Intelligence</Link>
            <button type="button" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)} className="rounded border border-white/40 px-3 py-1.5 text-sm text-white">{open ? 'Close' : 'Menu'}</button>
          </div>
          {open && <div id="mobile-nav" className="mt-3">{nav}</div>}
        </div>
        <div className="border-b border-[#e3d3a5] bg-[#f6efdd] px-4 py-1.5 text-center text-xs text-brass sm:px-8">
          <strong>Independent case study.</strong> Not affiliated with or endorsed by Cima Investment Group. All acquisition economics are illustrative analyst assumptions.
        </div>
        <div className="sticky top-0 z-30 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-white/95 px-4 py-2.5 backdrop-blur sm:px-8">
          <Seg label="Investment case" value={m.caseId} onChange={m.setCaseId} options={CASES.map((c) => ({ id: c, text: CASE_META[c].short }))} />
          <Seg label="Scenario" value={m.scenarioId} onChange={m.setScenarioId} options={SCENARIOS.map((s) => ({ id: s, text: SCENARIO_META[s].name }))} />
          <span className="text-xs text-muted">{CASE_META[m.caseId].scope}</span>
          <div className="ml-auto flex items-center gap-2" aria-live="polite">
            {m.anyModified
              ? <><span className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-warn" data-testid="modified-badge">Assumptions modified</span>
                <button type="button" onClick={m.resetAll} className="rounded border border-line px-2 py-1 text-xs font-medium hover:bg-paper">Reset all</button></>
              : <span className="text-xs text-muted" data-testid="original-badge">Original analyst assumptions</span>}
          </div>
        </div>
        <main id="main" tabIndex={-1} className="mx-auto max-w-[1180px] px-4 py-8 sm:px-8">{children}</main>
        <footer className="border-t border-line bg-white px-4 py-6 sm:px-8"><div className="mx-auto max-w-[1180px]"><Disclaimer /></div></footer>
      </div>
    </div>
  );
}
