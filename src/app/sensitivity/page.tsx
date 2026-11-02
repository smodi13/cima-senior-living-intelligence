'use client';
import { useMemo, useState } from 'react';
import { CASE_META, SCENARIO_META } from '@/data/inputs';
import { CAP_AXIS, OCC_AXIS, capVsNOIGrid, computeDeal, equityFromValue, exitValueGrid, sweep, type DealInputs, type DealResult, type ScenarioParams } from '@/engine';
import { useModel } from '@/store/model';
import { Callout, Card, Chip, PageHeader, Table, Td, Tr } from '@/components/ui';
import { WithResult } from '@/components/Guard';
import { mult, pct, signedPct, usd, usdM } from '@/lib-fmt';

type Basis = 'value' | 'equity';
function BasisToggle({ v, on }: { v: Basis; on(b: Basis): void }) {
  return (
    <div role="radiogroup" aria-label="Table basis" className="inline-flex overflow-hidden rounded border border-line text-xs">
      {([['value', 'Gross property value'], ['equity', 'Net equity proceeds']] as const).map(([id, t]) => (
        <button key={id} type="button" role="radio" aria-checked={v === id} onClick={() => on(id)} className={`px-2.5 py-1 font-medium ${v === id ? 'bg-navy-900 text-white' : 'hover:bg-paper'}`}>{t}</button>
      ))}
    </div>
  );
}

function Grid({ rows, rowLabels, colLabels, cell, corner, caption }: { rows: number[][]; rowLabels: string[]; colLabels: string[]; cell(v: number): string; corner: string; caption: string }) {
  return (
    <Table caption={caption} head={[corner, ...colLabels]}>
      {rows.map((r, i) => (
        <Tr key={i}><Td left bold>{rowLabels[i]}</Td>{r.map((v, j) => <Td key={j} tone={v < 0 ? 'neg' : undefined}>{cell(v)}</Td>)}</Tr>
      ))}
    </Table>
  );
}

function IrrPriceCap({ inp, sc }: { inp: DealInputs; sc: ScenarioParams }) {
  const prices = [-10, -5, 0, 5, 10, 20].map((p) => Math.round(inp.pricePerUnit * (1 + p / 100)));
  const caps = [-0.01, -0.005, 0, 0.005, 0.01].map((d) => Number((inp.exitCap + d).toFixed(6)));
  const cells = prices.map((p) => caps.map((c) => { try { return computeDeal({ ...inp, pricePerUnit: p, exitCap: c }, sc); } catch { return null; } }));
  return (
    <Table caption="Levered IRR by purchase price and exit cap" head={['Price / unit \\ exit cap', ...caps.map((c) => pct(c + sc.capShift, 2))]}>
      {cells.map((row, i) => (
        <Tr key={i}><Td left bold>{usd(prices[i])}</Td>
          {row.map((d, j) => <Td key={j} tone={!d || d.leveredIRR === null ? 'neg' : d.clearsHurdle ? 'pos' : 'warn'}>{d ? pct(d.leveredIRR) : 'invalid'}</Td>)}</Tr>
      ))}
    </Table>
  );
}

export default function Sensitivity() {
  const m = useModel();
  const inp = m.inputs();
  const sc = m.scenario();
  const [b1, setB1] = useState<Basis>('value');
  const [b2, setB2] = useState<Basis>('value');
  const ltvs = [0, 0.2, 0.3, 0.4, 0.5, 0.6, 0.65, 0.7, 0.75];
  const lev = useMemo(() => sweep(inp, sc, 'ltv', ltvs), [inp, sc]); // eslint-disable-line react-hooks/exhaustive-deps
  const noiD = [-0.2, -0.1, 0, 0.1, 0.2];
  return (
    <>
      <PageHeader eyebrow="Module 5" title="Sensitivity Analysis">
        All tables recalculate from your current assumptions ({CASE_META[m.caseId].short}, {SCENARIO_META[m.scenarioId].name}). Each table is labeled by what it measures:
        <span className="ml-1 inline-flex flex-wrap gap-1 align-middle"><Chip tone="navy">Property value</Chip><Chip tone="brass">Equity proceeds</Chip><Chip tone="pos">Investment return</Chip></span>
      </PageHeader>
      <WithResult>{(r: DealResult) => {
        const fv = (v: number) => (b1 === 'value' ? v : equityFromValue(v, inp, r));
        const fv2 = (v: number) => (b2 === 'value' ? v : equityFromValue(v, inp, r));
        return (
          <div className="space-y-6">
            <Card title="Exit cap rate vs Year 5 occupancy" subtitle={`Reproduces the workbook Bid Sensitivity method. Current: Year 5 occupancy ${pct(r.forecast[4].occupancy)}, exit cap ${pct(r.exitCap, 2)}.`}
              right={<div className="flex items-center gap-2"><Chip tone={b1 === 'value' ? 'navy' : 'brass'}>{b1 === 'value' ? 'Property value' : 'Equity proceeds'}</Chip><BasisToggle v={b1} on={setB1} /></div>}>
              <Grid caption="Exit cap versus occupancy" corner="Exit cap \ occupancy" colLabels={OCC_AXIS.map((o) => pct(o, 0))} rowLabels={CAP_AXIS.map((c) => pct(c, 1))}
                rows={exitValueGrid(r, inp, sc).map((row) => row.map(fv))} cell={usdM} />
              <p className="mt-3 text-xs text-muted">{b1 === 'value' ? 'Gross terminal property value = Year 5 NOI / cap rate, before sale costs and debt. It is not investor proceeds.' : `Equity proceeds = gross value less ${pct(inp.disposalPct)} sale costs less the ${usdM(r.loanPayoff)} loan payoff. Negative values (red) are shortfalls the sponsor would fund.`} The workbook holds other economics fixed except incremental occupied-unit contribution; it is not a full re-run of returns.</p>
            </Card>

            <Card title="Exit cap rate vs change in Year 5 NOI" subtitle="Direct capitalization of an adjusted NOI"
              right={<div className="flex items-center gap-2"><Chip tone={b2 === 'value' ? 'navy' : 'brass'}>{b2 === 'value' ? 'Property value' : 'Equity proceeds'}</Chip><BasisToggle v={b2} on={setB2} /></div>}>
              <Grid caption="Exit cap versus NOI change" corner="Exit cap \ NOI change" colLabels={noiD.map((d) => signedPct(d, 0))} rowLabels={CAP_AXIS.map((c) => pct(c, 1))}
                rows={capVsNOIGrid(r, noiD).map((row) => row.map(fv2))} cell={usdM} />
            </Card>

            <Card title="Purchase price vs exit cap rate" subtitle="Full model re-run per cell. Levered IRR (NM = no real IRR). Debt scales with price at the assumed LTV."
              right={<Chip tone="pos">Investment return</Chip>}>
              <IrrPriceCap inp={inp} sc={sc} />
              <p className="mt-3 text-xs text-muted">Green clears the {pct(inp.requiredIRR, 0)} required IRR; amber is a real IRR below it; red is not meaningful.</p>
            </Card>

            <Card title="Leverage vs returns" subtitle="Loan-to-value re-run through the full workbook logic (interest, amortization, fees, payoff)" right={<Chip tone="pos">Investment return</Chip>}>
              <Table caption="Leverage versus returns" head={['LTV', 'Debt', 'Equity', 'Year 2 debt service', 'Min DSCR', 'Levered IRR', 'Equity MOIC', 'Net exit equity']}>
                {lev.map((x) => (
                  <Tr key={x.value} strong={x.value === inp.ltv}>
                    <Td left bold>{pct(x.value, 0)}</Td>
                    {x.deal ? <><Td>{usdM(x.deal.loan)}</Td><Td>{usdM(x.deal.equity)}</Td><Td>{usdM(x.deal.forecast[1].debtService, 2)}</Td><Td tone={x.deal.minDSCR !== null && x.deal.minDSCR < inp.minDSCR ? 'warn' : undefined}>{mult(x.deal.minDSCR)}</Td>
                      <Td tone={x.deal.leveredIRR === null ? 'neg' : undefined}>{pct(x.deal.leveredIRR)}</Td><Td>{mult(x.deal.moic)}</Td><Td tone={x.deal.netExitEquity < 0 ? 'neg' : undefined}>{usdM(x.deal.netExitEquity)}</Td></> : <Td>invalid</Td>}
                  </Tr>
                ))}
              </Table>
              <p className="mt-3 text-xs text-muted">Zero leverage shows DSCR as n/a because there is no debt service. More leverage raises IRR only while NOI covers debt service and the sale covers the payoff; lenders will cap LTV by DSCR, which is not modeled here.</p>
            </Card>
            <Callout title="Property value, equity value and return are different measures">Gross property value is what a buyer might pay. Net equity proceeds subtract sale costs and the loan. Levered IRR and MOIC measure the sponsor&apos;s return on the equity actually invested, including interim cash flows.</Callout>
          </div>
        );
      }}</WithResult>
    </>
  );
}
