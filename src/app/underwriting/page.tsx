'use client';
import { CASE_META, SCENARIO_META } from '@/data/inputs';
import { useModel } from '@/store/model';
import { Callout, Card, Chip, PageHeader, Table, Td, Tr } from '@/components/ui';
import { FIELD_GROUPS } from '@/components/fieldDefs';
import { InputField } from '@/components/InputField';
import { WithResult } from '@/components/Guard';
import type { DealResult } from '@/engine';
import { mult, pct, usd } from '@/lib-fmt';

function Delta({ cur, orig, fmt, better = 'up' }: { cur: number | null; orig: number | null; fmt: (n: number | null) => string; better?: 'up' | 'down' | 'none' }) {
  if (cur === orig) return <span className="text-muted">unchanged</span>;
  if (cur === null || orig === null) return <span className="text-warn">{fmt(orig)} to {fmt(cur)}</span>;
  const up = cur > orig;
  const good = better === 'none' ? null : better === 'up' ? up : !up;
  return <span className={good === null ? 'text-ink' : good ? 'text-pos' : 'text-neg'}>{up ? '+' : '-'}{fmt(Math.abs(cur - orig))}</span>;
}

function Panel({ r, o }: { r: DealResult; o: DealResult }) {
  const rows: [string, string, string, React.ReactNode][] = [
    ['Levered IRR', pct(r.leveredIRR), pct(o.leveredIRR), <Delta key="a" cur={r.leveredIRR} orig={o.leveredIRR} fmt={(n) => pct(n)} />],
    ['Equity MOIC', mult(r.moic), mult(o.moic), <Delta key="b" cur={r.moic} orig={o.moic} fmt={(n) => mult(n)} />],
    ['Max supportable bid', usd(r.maxBid), usd(o.maxBid), <Delta key="c" cur={r.maxBid} orig={o.maxBid} fmt={(n) => usd(n)} />],
    ['Initial equity', usd(r.equity), usd(o.equity), <Delta key="d" cur={r.equity} orig={o.equity} fmt={(n) => usd(n)} better="none" />],
    ['Year 5 NOI', usd(r.year5NOI), usd(o.year5NOI), <Delta key="e" cur={r.year5NOI} orig={o.year5NOI} fmt={(n) => usd(n)} />],
    ['Minimum DSCR', mult(r.minDSCR), mult(o.minDSCR), <Delta key="f" cur={r.minDSCR} orig={o.minDSCR} fmt={(n) => mult(n)} />],
    ['Gross exit value', usd(r.exitValue), usd(o.exitValue), <Delta key="g" cur={r.exitValue} orig={o.exitValue} fmt={(n) => usd(n)} />],
    ['Net exit equity', usd(r.netExitEquity), usd(o.netExitEquity), <Delta key="h" cur={r.netExitEquity} orig={o.netExitEquity} fmt={(n) => usd(n)} />],
  ];
  return (
    <dl className="space-y-3" data-testid="impact-panel">
      {rows.map(([l, c, orig, d]) => (
        <div key={l} className="border-b border-line pb-2 last:border-0">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">{l}</dt>
          <dd className="num mt-0.5 flex flex-wrap items-baseline justify-between gap-x-2">
            <span className="font-serif text-xl text-navy-900" data-testid={`uw-${l.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{c}</span>
            <span className="text-xs">{d}</span>
          </dd>
          <dd className="text-xs text-muted">Original: {orig}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function Underwriting() {
  const m = useModel();
  const c = m.caseId;
  const n = m.modifiedKeys(c).length;
  return (
    <>
      <PageHeader eyebrow="Module 2" title="Acquisition Underwriting">
        Edit any assumption and every output on every page recalculates from the same engine. The original analyst assumptions are stored separately and never overwritten.
        Showing <strong>{CASE_META[c].name}</strong> under the <strong>{SCENARIO_META[m.scenarioId].name}</strong> scenario.
      </PageHeader>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {m.anyModified ? <Chip tone="warn">{n} input{n === 1 ? '' : 's'} changed for this case{m.modifiedScenarioKeys().length ? `, ${m.modifiedScenarioKeys().length} scenario parameter(s) changed` : ''}</Chip> : <Chip tone="pos">Original analyst assumptions</Chip>}
        <button type="button" onClick={() => m.resetCase(c)} disabled={n === 0} className="rounded border border-line bg-white px-3 py-1.5 text-sm font-medium enabled:hover:bg-paper disabled:opacity-40">Reset current case</button>
        <button type="button" onClick={m.resetAll} disabled={!m.anyModified} className="rounded border border-line bg-white px-3 py-1.5 text-sm font-medium enabled:hover:bg-paper disabled:opacity-40">Reset all assumptions</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {FIELD_GROUPS.map((g) => (
            <Card key={g.title} title={g.title}>
              <div className="grid gap-3 sm:grid-cols-2">{g.fields.map((f) => <InputField key={`${c}-${f.key}`} caseId={c} def={f} />)}</div>
            </Card>
          ))}
        </div>
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card title="Impact on returns" subtitle="Current vs original analyst assumptions">
            <WithResult>{(r) => <Panel r={r} o={m.original()} />}</WithResult>
          </Card>
        </div>
      </div>

      <WithResult>{(r) => (
        <div className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Sources and uses at close">
              <Table caption="Sources and uses" head={['Item', 'Amount']}>
                <Tr><Td left>Purchase price ({r.units} units)</Td><Td>{usd(r.acquisition)}</Td></Tr>
                <Tr><Td left>Closing costs</Td><Td>{usd(r.closing)}</Td></Tr>
                <Tr><Td left>Initial renovation capex</Td><Td>{usd(r.upfrontCapex)}</Td></Tr>
                <Tr><Td left>Financing fee</Td><Td>{usd(r.financingFee)}</Td></Tr>
                <Tr strong><Td left>Total uses</Td><Td>{usd(r.acquisition + r.closing + r.upfrontCapex + r.financingFee)}</Td></Tr>
                <Tr><Td left>Senior debt</Td><Td>{usd(r.loan)}</Td></Tr>
                <Tr strong><Td left>Sponsor equity</Td><Td>{usd(r.equity)}</Td></Tr>
              </Table>
            </Card>
            <Card title="Exit (Year 5)" subtitle="Property value, then equity proceeds. These are different things.">
              <Table caption="Exit" head={['Item', 'Amount']}>
                <Tr><Td left>Year 5 NOI</Td><Td>{usd(r.year5NOI)}</Td></Tr>
                <Tr><Td left>Exit cap rate</Td><Td>{pct(r.exitCap, 2)}</Td></Tr>
                <Tr strong><Td left>Gross property value (not equity)</Td><Td>{usd(r.exitValue)}</Td></Tr>
                <Tr><Td left>Sale transaction expenses</Td><Td>{usd(r.forecast[4].saleFees)}</Td></Tr>
                <Tr><Td left>Mortgage payoff</Td><Td>{usd(-r.loanPayoff)}</Td></Tr>
                <Tr strong><Td left>Net proceeds to equity at sale</Td><Td tone={r.netExitEquity < 0 ? 'neg' : 'neutral'}>{usd(r.netExitEquity)}</Td></Tr>
              </Table>
            </Card>
          </div>
          <Card title="Five-year annual forecast" subtitle="Annual periods (not monthly). Occupancy averages the within-year ramp.">
            <Table caption="Annual forecast" head={['Line', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']}>
              {([
                ['Occupancy', (f) => pct(f.occupancy)], ['Occupied units', (f) => f.occupiedUnits.toFixed(1)], ['Resident revenue + ancillary', (f) => usd(f.revenue)],
                ['Fixed labor', (f) => usd(-f.fixedLabor)], ['Variable labor', (f) => usd(-f.variableLabor)], ['Other fixed expenses', (f) => usd(-f.fixedNonlabor)],
                ['Variable operating expenses', (f) => usd(-f.variableOther)], ['Taxes and insurance', (f) => usd(-f.taxInsurance)], ['Management fees', (f) => usd(-f.managementFee)],
                ['Total operating expenses', (f) => usd(-f.operatingExpenses)], ['Net operating income', (f) => usd(f.noi)], ['Recurring capital reserves', (f) => usd(-f.capexReserve)],
                ['Property cash flow', (f) => usd(f.beforeDebt)], ['Interest', (f) => usd(-f.interest)], ['Principal', (f) => usd(-f.principal)], ['Debt service', (f) => usd(-f.debtService)],
                ['Closing loan balance', (f) => usd(f.closingLoan)], ['DSCR', (f) => (f.dscr === null ? 'n/a' : mult(f.dscr))],
                ['Equity cash flow (after sale in Y5)', (f) => usd(f.equityCashFlow)],
              ] as [string, (f: DealResult['forecast'][number]) => string][]).map(([l, fn]) => (
                <Tr key={l} strong={['Net operating income', 'Property cash flow', 'Equity cash flow (after sale in Y5)'].includes(l)}><Td left>{l}</Td>{r.forecast.map((f) => <Td key={f.year}>{fn(f)}</Td>)}</Tr>
              ))}
            </Table>
          </Card>
          <Callout title="Reading this model">Hold period is fixed at five annual periods to match the Excel workbook. A shortfall at sale is treated as a sponsor funding requirement, as in the workbook. See Methodology for all stated limitations.</Callout>
        </div>
      )}</WithResult>
    </>
  );
}
