'use client';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usdM, pct, mult } from '@/lib-fmt';

export const SCEN_COLOR = { Base: '#1d3a63', Down: '#a12f2f', Up: '#17694a' } as const;
const axis = { fontSize: 12, fill: '#566170' };
const tipStyle = { fontSize: 12, borderRadius: 4, border: '1px solid #d9dee5' };
const $m = (v: number) => usdM(v);

export function ChartFrame({ label, children, height = 280 }: { label: string; children: React.ReactElement; height?: number }) {
  return (
    <div role="img" aria-label={label} style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>{children}</ResponsiveContainer>
    </div>
  );
}

export function GroupedBars({ data, series, label, fmt = $m }: {
  data: Record<string, number | string>[]; series: { key: string; name: string; color: string }[]; label: string; fmt?: (v: number) => string;
}) {
  return (
    <ChartFrame label={label}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#e6e9ee" vertical={false} />
        <XAxis dataKey="x" tick={axis} tickLine={false} />
        <YAxis tick={axis} tickFormatter={fmt} width={64} tickLine={false} axisLine={false} />
        <Tooltip formatter={(v) => fmt(Number(v))} contentStyle={tipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <ReferenceLine y={0} stroke="#1c2530" />
        {series.map((s) => <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[2, 2, 0, 0]} isAnimationActive={false} />)}
      </BarChart>
    </ChartFrame>
  );
}

export interface WfItem { label: string; value: number; total?: boolean }
/** Floating-bar waterfall. Totals start at 0; deltas float from the running total. */
export function WaterfallChart({ items, label, height = 300 }: { items: WfItem[]; label: string; height?: number }) {
  let run = 0;
  const data = items.map((it) => {
    const start = it.total ? 0 : run;
    const end = it.total ? it.value : run + it.value;
    run = end;
    return { x: it.label, range: [Math.min(start, end), Math.max(start, end)] as [number, number], value: it.value, total: !!it.total };
  });
  return (
    <ChartFrame label={label} height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#e6e9ee" vertical={false} />
        <XAxis dataKey="x" tick={{ ...axis, fontSize: 11 }} interval={0} tickLine={false} angle={-35} textAnchor="end" height={72} />
        <YAxis tick={axis} tickFormatter={$m} width={64} tickLine={false} axisLine={false} />
        <Tooltip formatter={(_v, _n, p) => $m((p.payload as { value: number }).value)} contentStyle={tipStyle} />
        <ReferenceLine y={0} stroke="#1c2530" />
        <Bar dataKey="range" isAnimationActive={false}>
          {data.map((d, i) => <Cell key={i} fill={d.total ? '#0b1f3a' : d.value >= 0 ? '#17694a' : '#a12f2f'} />)}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}

export function LineSweep({ data, xFmt, yFmt, refX, refY, label, yName }: {
  data: { x: number; y: number | null }[]; xFmt: (v: number) => string; yFmt: (v: number) => string; refX?: number; refY?: number; label: string; yName: string;
}) {
  return (
    <ChartFrame label={label}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#e6e9ee" />
        <XAxis dataKey="x" type="number" domain={['dataMin', 'dataMax']} tickFormatter={xFmt} tick={axis} tickLine={false} />
        <YAxis tick={axis} tickFormatter={yFmt} width={56} tickLine={false} axisLine={false} />
        <Tooltip formatter={(v) => yFmt(Number(v))} labelFormatter={(v) => xFmt(Number(v))} contentStyle={tipStyle} />
        {refY !== undefined && <ReferenceLine y={refY} stroke="#8a6a24" strokeDasharray="4 3" label={{ value: 'Required IRR', fontSize: 11, fill: '#8a6a24', position: 'insideTopRight' }} />}
        {refX !== undefined && <ReferenceLine x={refX} stroke="#a12f2f" strokeDasharray="4 3" label={{ value: 'Max bid', fontSize: 11, fill: '#a12f2f', position: 'insideTopLeft' }} />}
        <Line type="monotone" dataKey="y" name={yName} stroke="#1d3a63" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} isAnimationActive={false} />
      </LineChart>
    </ChartFrame>
  );
}

/** Scenario return bars. Undefined IRR is shown as "NM", never as a zero-length bar. */
export function IrrBars({ rows, hurdle }: { rows: { id: string; name: string; irr: number | null; moic: number; color: string }[]; hurdle: number }) {
  const max = Math.max(hurdle * 1.5, ...rows.map((r) => r.irr ?? 0)) || 0.4;
  return (
    <ul className="space-y-3" aria-label="Levered IRR by scenario">
      {rows.map((r) => (
        <li key={r.id} className="grid grid-cols-[84px_1fr_auto] items-center gap-3 text-sm">
          <span className="font-medium text-navy-900">{r.name}</span>
          <div className="relative h-5 rounded-sm bg-paper">
            {r.irr !== null
              ? <div className="h-full rounded-sm" style={{ width: `${Math.max(0, (r.irr / max) * 100)}%`, background: r.color }} />
              : <span className="absolute inset-y-0 left-2 flex items-center text-xs font-semibold text-neg">No IRR: equity never recovered</span>}
            <div className="absolute inset-y-[-3px] w-0.5 bg-brass" style={{ left: `${(hurdle / max) * 100}%` }} title={`Required IRR ${pct(hurdle)}`} />
          </div>
          <span className="num w-28 text-right"><strong>{r.irr === null ? 'NM' : pct(r.irr)}</strong> <span className="text-muted">/ {r.irr === null ? 'no distributions' : mult(r.moic)}</span></span>
        </li>
      ))}
      <li className="text-xs text-muted">Brass marker = required levered IRR ({pct(hurdle)}). NM = not meaningful (no real IRR exists).</li>
    </ul>
  );
}
