'use client';
import { useId, useState } from 'react';
import { CASE_META, ORIGINAL_SCENARIOS, SCENARIO_META } from '@/data/inputs';
import { CASES, SCENARIOS, computeDeal, exitEquityBridge, type ScenarioId, type ScenarioParams } from '@/engine';
import { useModel } from '@/store/model';
import { Callout, Card, PageHeader, Table, Td, Tr } from '@/components/ui';
import { WaterfallChart } from '@/components/charts';
import { WithResult } from '@/components/Guard';
import { mult, pct, usd, usdM } from '@/lib-fmt';

interface PDef { key: keyof ScenarioParams; label: string; kind: 'pct' | 'x' | 'int'; min: number; max: number; step: number; note: string }
const PARAMS: PDef[] = [
  { key: 'occDelta', label: 'Occupancy change (points)', kind: 'pct', min: -0.5, max: 0.5, step: 0.5, note: 'Absolute shift to modeled occupancy' },
  { key: 'rentMult', label: 'Resident rent multiplier', kind: 'x', min: 0.5, max: 1.5, step: 0.01, note: 'Applied to rent per unit' },
  { key: 'laborMult', label: 'Labor cost multiplier', kind: 'x', min: 0.5, max: 1.5, step: 0.01, note: 'All staffing costs' },
  { key: 'capShift', label: 'Exit cap rate shift', kind: 'pct', min: -0.05, max: 0.05, step: 0.25, note: 'Added to exit cap rate input' },
  { key: 'stabMonthsAdd', label: 'Added stabilization months', kind: 'int', min: -24, max: 60, step: 1, note: 'Delays or accelerates the ramp' },
  { key: 'ancMult', label: 'Ancillary revenue multiplier', kind: 'x', min: 0.5, max: 1.5, step: 0.01, note: 'Other resident revenue' },
  { key: 'nonlaborMult', label: 'Nonlabor operating cost multiplier', kind: 'x', min: 0.5, max: 1.5, step: 0.01, note: 'Fixed and variable nonlabor' },
  { key: 'renoOverrun', label: 'Renovation budget overrun', kind: 'pct', min: 0, max: 1, step: 5, note: 'Upfront cost stress' },
];
const show = (v: number, k: PDef['kind']) => String(k === 'pct' ? Number((v * 100).toPrecision(10)) : v);

function ParamInput({ s, def }: { s: ScenarioId; def: PDef }) {
  const m = useModel();
  const id = useId();
  const cur = m.scenario(s)[def.key];
  const orig = ORIGINAL_SCENARIOS[s][def.key];
  const [text, setText] = useState(show(cur, def.kind));
  const [err, setErr] = useState<string | null>(null);
  const [lastCur, setLastCur] = useState(cur);
  if (cur !== lastCur) { setLastCur(cur); if ((def.kind === 'pct' ? Number(text) / 100 : Number(text)) !== cur) { setText(show(cur, def.kind)); setErr(null); } }

  const change = (t: string) => {
    setText(t);
    const n = t.trim() === '' ? NaN : def.kind === 'pct' ? Number(t) / 100 : Number(t);
    let msg: string | null = null;
    if (!Number.isFinite(n)) msg = 'Enter a number';
    else if (def.kind === 'int' && !Number.isInteger(n)) msg = 'Whole number required';
    else if (n < def.min - 1e-12 || n > def.max + 1e-12) msg = `Between ${show(def.min, def.kind)} and ${show(def.max, def.kind)}`;
    else {
      const trial: ScenarioParams = { ...m.scenario(s), [def.key]: n };
      for (const c of CASES) { try { computeDeal(m.inputs(c), trial); } catch (e) { msg = (e as Error).message.replace('Invalid model inputs: ', ''); break; } }
    }
    setErr(msg);
    if (!msg) m.setScenarioParam(s, def.key, n);
  };
  const modified = cur !== orig;
  return (
    <div>
      <label htmlFor={id} className="sr-only">{def.label}, {SCENARIO_META[s].name}</label>
      <div className="flex items-center justify-end gap-1">
        <input id={id} type="number" step={def.step} value={text} onChange={(e) => change(e.target.value)} aria-invalid={!!err}
          className={`num w-20 rounded border px-2 py-1 text-right text-sm ${err ? 'border-neg bg-red-50' : modified ? 'border-amber-400 bg-amber-50' : 'border-line'}`} />
        {modified && <button type="button" className="text-xs text-warn underline" onClick={() => m.resetScenarioField(s, def.key)} aria-label={`Reset ${def.label} for ${SCENARIO_META[s].name}`}>Reset</button>}
      </div>
      {err && <p role="alert" className="mt-0.5 max-w-[160px] text-right text-xs text-neg">{err}</p>}
    </div>
  );
}

export default function Scenarios() {
  const m = useModel();
  const inp = m.inputs();
  return (
    <>
      <PageHeader eyebrow="Module 3" title="Scenario Analysis">
        Base, Downside and Upside are defined by eight workbook stress parameters. Edit them below; every comparison, chart and return recalculates. Showing {CASE_META[m.caseId].name}.
      </PageHeader>

      <Card title="Scenario comparison" subtitle="Year 5 operating figures unless stated. Levered IRR shows NM when no real IRR exists.">
        <Table caption="Scenario comparison" head={['Metric', ...SCENARIOS.map((s) => SCENARIO_META[s].name)]}>
          {([
            ['Year 5 occupancy', (r) => pct(r.forecast[4].occupancy)],
            ['Year 5 revenue', (r) => usd(r.forecast[4].revenue)],
            ['Year 5 NOI', (r) => usd(r.year5NOI)],
            ['Minimum DSCR', (r) => mult(r.minDSCR)],
            ['Exit cap rate', (r) => pct(r.exitCap, 2)],
            ['Gross exit valuation', (r) => usd(r.exitValue)],
            ['Mortgage payoff', (r) => usd(r.loanPayoff)],
            ['Net exit equity (after costs and payoff)', (r) => usd(r.netExitEquity)],
            ['Levered IRR', (r) => pct(r.leveredIRR)],
            ['Equity MOIC', (r) => mult(r.moic)],
            ['Maximum acquisition price', (r) => usd(r.maxBid)],
          ] as [string, (r: NonNullable<ReturnType<typeof m.result>>) => string][]).map(([l, fn]) => (
            <Tr key={l}><Td left bold>{l}</Td>{SCENARIOS.map((s) => { const r = m.result(m.caseId, s); return <Td key={s}>{r ? fn(r) : 'invalid'}</Td>; })}</Tr>
          ))}
        </Table>
      </Card>

      <Card className="mt-6" title="Scenario parameters (editable)" subtitle="Applied to both investment cases. Highlighted cells differ from the workbook.">
        <Table caption="Scenario parameters" head={['Adjustment', ...SCENARIOS.map((s) => SCENARIO_META[s].name), 'Description']}>
          {PARAMS.map((p) => (
            <Tr key={p.key}>
              <Td left bold>{p.label}{p.kind === 'pct' ? ' (%)' : ''}</Td>
              {SCENARIOS.map((s) => <td key={s} className="px-3 py-1.5"><ParamInput s={s} def={p} /></td>)}
              <Td left>{p.note}</Td>
            </Tr>
          ))}
        </Table>
      </Card>

      <WithResult>{(r) => {
        const ops = r.forecast.reduce((a, f) => a + f.operatingEquityCF, 0);
        const sale = r.forecast[4];
        return (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card title="Where the equity result comes from" subtitle={`${SCENARIO_META[m.scenarioId].name}, all five years`}>
              <WaterfallChart label="Equity return composition waterfall" height={320} items={[
                { label: 'Equity invested', value: -r.equity },
                { label: 'Operating cash flow', value: ops },
                { label: 'Gross sale', value: sale.grossSale },
                { label: 'Sale costs', value: sale.saleFees },
                { label: 'Loan payoff', value: sale.loanPayoff },
                { label: 'Net result', value: r.cashflows.reduce((a, b) => a + b, 0), total: true },
              ]} />
              <p className="mt-2 text-xs text-muted">Net result = total profit (loss) to equity in dollars, undiscounted. Operating cash flow nets debt service and capital reserves.</p>
            </Card>
            <div className="space-y-6">
              {(['Down', 'Up'] as const).map((s) => {
                const b = exitEquityBridge(inp, m.scenario(s));
                return (
                  <Card key={s} title={`Drivers of Year 5 net exit equity: ${SCENARIO_META[s].name}`} subtitle="From no-stress to scenario, applied in the order shown">
                    <WaterfallChart label={`Net exit equity drivers, ${SCENARIO_META[s].name}`} height={250} items={[
                      { label: 'No-stress', value: b.start, total: true },
                      ...b.steps.filter((x) => Math.abs(x.delta) > 0.5).map((x) => ({ label: x.label, value: x.delta })),
                      { label: SCENARIO_META[s].name, value: b.end, total: true },
                    ]} />
                    <p className="mt-1 text-xs text-muted">{usdM(b.start)} to {usdM(b.end)}. Attribution is order-dependent.</p>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      }}</WithResult>
      <div className="mt-6"><Callout title="Interpretation">Downside is a combined stress, not a forecast. Where net exit equity is negative the original underwriting assumes the sponsor funds the shortfall (see Financing Outcomes for an illustrative alternative), so the IRR does not exist and MOIC reads 0.00x because there are no positive distributions. That is a severe capital impairment, not a zero return.</Callout></div>
    </>
  );
}
