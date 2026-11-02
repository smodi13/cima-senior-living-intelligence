'use client';
import { useMemo, useState } from 'react';
import { CADENCE, PHASES, PLAN, SCORECARD } from '@/data/content';
import { Callout, Card, Chip, PageHeader, Table, Td, Tr } from '@/components/ui';

const startOf = (d: string) => Number(d.split('-')[0]);
const endOf = (d: string) => Number(d.split('-')[1]);

export default function Turnaround() {
  const [ws, setWs] = useState('All');
  const streams = useMemo(() => ['All', ...Array.from(new Set(PLAN.map((p) => p.workstream)))], []);
  const rows = PLAN.map((p, i) => ({ ...p, seq: i + 1 })).filter((p) => ws === 'All' || p.workstream === ws).sort((a, b) => startOf(a.days) - startOf(b.days) || a.seq - b.seq);
  const windows = Array.from(new Set(rows.map((r) => r.days)));
  return (
    <>
      <PageHeader eyebrow="Module 6" title="Operating Turnaround: 100-Day Plan">
        A proposed, illustrative plan for the North Texas case. <strong>Nothing here is reported property performance, and no initiative is marked complete.</strong> Safety comes first: no initiative may reduce legally required staffing or care quality.
      </PageHeader>
      <Callout tone="warn" title="Illustrative, not actual">Every status is &quot;Proposed&quot;. No actual community operating information has been supplied; scorecard values are Unverified by design.</Callout>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {PHASES.map((p) => (
          <div key={p.window} className="rounded-md border border-line bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-brass">Day {p.window}</p>
            <p className="mt-1 text-sm font-medium text-navy-900">{p.objective}</p>
          </div>
        ))}
      </div>

      <Card className="mt-6" title="Initiatives" subtitle="Ordered by start day, then workbook sequence. Sequence # is the workbook row order, not a priority rating."
        right={<label className="flex items-center gap-2 text-sm">Workstream
          <select value={ws} onChange={(e) => setWs(e.target.value)} className="rounded border border-line bg-white px-2 py-1 text-sm">{streams.map((s) => <option key={s}>{s}</option>)}</select></label>}>
        <p className="mb-3 text-xs text-muted" aria-live="polite">{rows.length} of {PLAN.length} initiatives across {windows.length} day windows</p>
        <ul className="space-y-3 md:hidden" aria-label="100-day initiatives">
          {rows.map((r) => (
            <li key={r.seq} className="rounded border border-line p-3 text-sm">
              <div className="flex items-center justify-between gap-2"><span className="font-semibold text-navy-900">Day {r.days} <span className="font-normal text-muted">(#{r.seq})</span></span><Chip tone="warn">{r.status}</Chip></div>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brass">{r.workstream}</p>
              <p className="mt-1 text-ink">{r.initiative}</p>
              <dl className="mt-2 space-y-1 text-xs text-muted">
                <div><dt className="inline font-semibold">Owner role: </dt><dd className="inline">{r.owner}</dd></div>
                <div><dt className="inline font-semibold">Target milestone: </dt><dd className="inline">By day {endOf(r.days)}</dd></div>
                <div><dt className="inline font-semibold">KPI: </dt><dd className="inline">{r.kpi}</dd></div>
                <div><dt className="inline font-semibold">Acceptance criteria: </dt><dd className="inline">{r.gate}</dd></div>
              </dl>
            </li>
          ))}
        </ul>
        <div className="hidden md:block"><Table caption="100-day initiatives" head={['Window', 'Seq #', 'Workstream', 'Initiative', 'Owner role', 'Target milestone', 'KPI', 'Acceptance criteria', 'Status']}>
          {rows.map((r) => (
            <tr key={r.seq} className="border-b border-line align-top text-sm">
              <td className="whitespace-nowrap px-3 py-2 text-left font-semibold text-navy-900">Day {r.days}</td>
              <td className="num px-3 py-2 text-left">{r.seq}</td>
              <td className="px-3 py-2 text-left">{r.workstream}</td>
              <td className="min-w-64 px-3 py-2 text-left">{r.initiative}</td>
              <td className="px-3 py-2 text-left">{r.owner}</td>
              <td className="whitespace-nowrap px-3 py-2 text-left">By day {endOf(r.days)}</td>
              <td className="min-w-48 px-3 py-2 text-left">{r.kpi}</td>
              <td className="min-w-40 px-3 py-2 text-left">{r.gate}</td>
              <td className="px-3 py-2 text-left"><Chip tone="warn">{r.status}</Chip></td>
            </tr>
          ))}
        </Table></div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Management cadence" subtitle="From the 100-day plan PDF">
          <Table caption="Management cadence" head={['Cadence', 'Meeting / artifact', 'Owner']}>
            {CADENCE.map((c) => (<tr key={c.cadence} className="border-b border-line align-top text-sm"><td className="px-3 py-2 text-left font-medium">{c.cadence}</td><td className="px-3 py-2 text-left">{c.artifact}</td><td className="px-3 py-2 text-left">{c.owner}</td></tr>))}
          </Table>
        </Card>
        <Card title="Day 100 scorecard template" subtitle="Proposed reporting template. No actual property data exists.">
          <Table caption="Day 100 scorecard" head={['Metric', 'Target', 'Current', 'Owner']}>
            {SCORECARD.map((s) => (<Tr key={s.metric}><Td left bold>{s.metric}</Td><Td left>{s.target}</Td><Td left><Chip>{s.current}</Chip></Td><Td left>{s.owner}</Td></Tr>))}
          </Table>
        </Card>
      </div>
    </>
  );
}
