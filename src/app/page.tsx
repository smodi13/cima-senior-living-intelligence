'use client';
import Link from 'next/link';
import { CASES, SCENARIOS, type CaseId } from '@/engine';
import { CASE_META, SCENARIO_META } from '@/data/inputs';
import { useModel } from '@/store/model';
import { Callout, Card, Chip, Kpi, Table, Td, Tr } from '@/components/ui';
import { GroupedBars, IrrBars, SCEN_COLOR } from '@/components/charts';
import { WithResult } from '@/components/Guard';
import { mult, pct, usd, usdM } from '@/lib-fmt';

export default function Overview() {
  const m = useModel();
  const inp = m.inputs();
  return (
    <>
      <section className="mb-8 rounded-md bg-navy-900 px-5 py-7 text-white sm:px-8">
        <Chip tone="brass">Independent case study | 2 November 2026</Chip>
        <h1 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">Senior Living Acquisition and Turnaround Intelligence</h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-slate-200">
          An independent, formula-driven retrospective scenario analysis of two senior living acquisitions that Cima has already completed (North Texas, announced 29 September 2026; Katy, June 2025), built as a private equity analyst work sample. It is not a recommendation about whether to acquire these assets. Public facts are limited to unit counts;
          every price, rent, cost, loan term and exit value is an illustrative analyst assumption, not an actual Cima transaction financial.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {CASES.map((c) => (
            <button key={c} type="button" onClick={() => m.setCaseId(c)} aria-pressed={m.caseId === c}
              className={`rounded border p-4 text-left transition-colors ${m.caseId === c ? 'border-[#d9bd7a] bg-white/12' : 'border-white/20 hover:bg-white/8'}`}>
              <span className="block text-[11px] uppercase tracking-wider text-[#d9bd7a]">{c === 'TX' ? 'Case A' : 'Case B'}</span>
              <span className="mt-1 block font-serif text-lg">{CASE_META[c].name}</span>
              <span className="text-sm text-slate-300">{CASE_META[c].scope}</span>
            </button>
          ))}
        </div>
      </section>

      <WithResult>{(r) => {
        const hurdle = inp.requiredIRR;
        return (
          <div className="space-y-6">
            <div>
              <h2 className="mb-3 text-sm font-semibold text-navy-900">
                {CASE_META[m.caseId].short} | {SCENARIO_META[m.scenarioId].name} scenario <span className="font-normal text-muted">(change case and scenario in the bar above)</span>
              </h2>
              <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Kpi label="Levered IRR" value={pct(r.leveredIRR)} tone={r.leveredIRR === null ? 'neg' : r.clearsHurdle ? 'pos' : 'warn'}
                  sub={r.leveredIRR === null ? 'Not meaningful: equity never recovered' : `${r.clearsHurdle ? 'Clears' : 'Below'} ${pct(hurdle)} required IRR`} />
                <Kpi label="Equity MOIC" value={mult(r.moic)} sub={r.leveredIRR === null ? 'No positive distributions' : 'Workbook definition'} />
                <Kpi label="Max supportable bid" value={usdM(r.maxBid)} sub={r.maxBid === null ? '' : `${usd(r.maxBidPerUnit)} per unit`} />
                <Kpi label="Minimum DSCR" value={mult(r.minDSCR)} tone={r.minDSCR !== null && r.minDSCR < inp.minDSCR ? 'neg' : 'neutral'} sub={`Analyst screen ${mult(inp.minDSCR)}, not a covenant`} />
                <Kpi label="Acquisition price" value={usdM(r.acquisition)} sub={`${usd(r.pricePerUnit)} per unit (illustrative)`} />
                <Kpi label="Initial equity" value={usdM(r.equity)} sub={`${usdM(r.loan)} debt at ${pct(inp.ltv, 0)} LTV`} />
                <Kpi label="Year 5 NOI" value={usdM(r.year5NOI, 2)} sub={`Year 1: ${usdM(r.year1NOI, 2)}`} />
                <Kpi label="Gross exit value" value={usdM(r.exitValue)} tone={r.exitShortfall ? 'neg' : 'neutral'} sub={`vs ${usdM(r.loanPayoff)} loan payoff`} />
              </dl>
            </div>

            {r.exitShortfall && (
              <Callout tone="neg" title="Exit value does not cover the loan payoff">
                Net sale proceeds of {usd(r.netSaleProceeds)} fall short of the {usd(r.loanPayoff)} loan by {usd(-r.netExitEquity)}. The original underwriting treats this as a sponsor funding requirement, so Year 5 equity cash flow is negative and no real IRR exists. An illustrative limited-recourse alternative is on the Financing Outcomes page; neither represents Cima&apos;s actual loan terms.
              </Callout>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="Net operating income by year" subtitle={`${CASE_META[m.caseId].short}, all three scenarios`}>
                <GroupedBars label="Net operating income by year and scenario"
                  data={[1, 2, 3, 4, 5].map((y) => ({ x: `Year ${y}`, ...Object.fromEntries(SCENARIOS.map((s) => [s, m.result(m.caseId, s)?.forecast[y - 1].noi ?? 0])) }))}
                  series={SCENARIOS.map((s) => ({ key: s, name: SCENARIO_META[s].name, color: SCEN_COLOR[s] }))} />
              </Card>
              <Card title="Equity cash flow" subtitle={`${SCENARIO_META[m.scenarioId].name}: Year 0 investment, operations, and Year 5 sale net of loan payoff`}>
                <GroupedBars label="Projected equity cash flow by year"
                  data={r.cashflows.map((v, y) => ({ x: `Year ${y}`, cf: v }))}
                  series={[{ key: 'cf', name: 'Equity cash flow', color: '#1d3a63' }]} />
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="Scenario return comparison" subtitle="Levered IRR / equity MOIC">
                <IrrBars hurdle={hurdle} rows={SCENARIOS.map((s) => { const x = m.result(m.caseId, s); return { id: s, name: SCENARIO_META[s].name, irr: x?.leveredIRR ?? null, moic: x?.moic ?? 0, color: SCEN_COLOR[s] }; })} />
              </Card>
              <Card title="Key risk indicators" subtitle="Computed from current assumptions">
                <ul className="space-y-2 text-sm">
                  {SCENARIOS.map((s) => {
                    const x = m.result(m.caseId, s);
                    if (!x) return null;
                    const flags = [
                      x.exitShortfall && 'exit value below loan payoff',
                      x.minDSCR !== null && x.minDSCR < 1 && 'DSCR below 1.00x',
                      x.minDSCR !== null && x.minDSCR >= 1 && x.minDSCR < inp.minDSCR && `DSCR below ${mult(inp.minDSCR)} threshold`,
                      x.leveredIRR === null && 'no real IRR',
                      x.leveredIRR !== null && !x.clearsHurdle && 'below required IRR',
                    ].filter(Boolean) as string[];
                    return (
                      <li key={s} className="flex flex-wrap items-center gap-2">
                        <span className="w-20 font-medium text-navy-900">{SCENARIO_META[s].name}</span>
                        {flags.length ? flags.map((f) => <Chip key={f} tone="neg">{f}</Chip>) : <Chip tone="pos">No flags</Chip>}
                      </li>
                    );
                  })}
                  <li className="pt-2 text-xs text-muted">Price headroom (max bid vs assumed price, Base): {pct(m.result(m.caseId, 'Base')?.headroom ?? null)}. Max bid is conditional on the {pct(hurdle, 0)} required IRR and the assumed financing.</li>
                </ul>
              </Card>
            </div>
          </div>
        );
      }}</WithResult>

      <Card className="mt-6" title="All six cases" subtitle="Current assumptions. The highlighted row is the selected case and scenario.">
        <Table caption="Six scenario outcomes" head={['Case', 'Price', 'Equity', 'Levered IRR', 'MOIC', 'Max bid', 'Min DSCR', 'Year 5 NOI', 'Exit value', 'Loan payoff']}>
          {CASES.flatMap((c: CaseId) => SCENARIOS.map((s) => {
            const x = m.result(c, s);
            if (!x) return <Tr key={c + s}><Td left>{c} {s}</Td><Td>invalid</Td></Tr>;
            return (
              <Tr key={c + s} strong={c === m.caseId && s === m.scenarioId}>
                <Td left bold>{CASE_META[c].short} {SCENARIO_META[s].name}</Td><Td>{usdM(x.acquisition)}</Td><Td>{usdM(x.equity)}</Td>
                <Td tone={x.leveredIRR === null ? 'neg' : 'neutral'}>{pct(x.leveredIRR)}</Td><Td>{mult(x.moic)}</Td><Td>{usdM(x.maxBid)}</Td>
                <Td tone={x.minDSCR !== null && x.minDSCR < 1 ? 'neg' : 'neutral'}>{mult(x.minDSCR)}</Td><Td>{usdM(x.year5NOI, 2)}</Td>
                <Td>{usdM(x.exitValue)}</Td><Td tone={x.exitShortfall ? 'neg' : 'neutral'}>{usdM(x.loanPayoff)}</Td>
              </Tr>
            );
          }))}
        </Table>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Research limitations">
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink">
            <li>Only unit counts (359 and 82) and public market benchmarks are sourced facts. Purchase prices, rent rolls, NOI, debt and exit values are not public.</li>
            <li>Five annual periods; this is not a monthly model. Lender-ready work requires monthly property financials.</li>
            <li>Maximum bid is conditional on the assumed return hurdle and financing structure.</li>
            <li>No live data feeds. Source dates are shown on the Research page.</li>
          </ul>
        </Card>
        <Card title="Where to go next">
          <p className="text-sm leading-relaxed text-ink">Edit assumptions on <Link className="font-medium underline" href="/underwriting">Acquisition Underwriting</Link>, stress the bid on <Link className="font-medium underline" href="/pricing">Purchase Price Discipline</Link>, or read the <Link className="font-medium underline" href="/methodology">methodology and reconciliation notes</Link>. Original analyst assumptions are never overwritten; any edit is flagged and can be reset.</p>
        </Card>
      </div>
    </>
  );
}
