'use client';
import { useMemo, useState } from 'react';
import { CASE_META, ORIGINAL_INPUTS, SCENARIO_META } from '@/data/inputs';
import { sweep } from '@/engine';
import { useModel } from '@/store/model';
import { Callout, Card, Chip, Kpi, PageHeader, Table, Td, Tr } from '@/components/ui';
import { LineSweep } from '@/components/charts';
import { WithResult } from '@/components/Guard';
import { mult, pct, signedPct, usd, usdM } from '@/lib-fmt';

export default function Pricing() {
  const m = useModel();
  const inp = m.inputs();
  const sc = m.scenario();
  const [stress, setStress] = useState(0); // % change vs current price per unit
  const base = m.result();
  const origPrice = ORIGINAL_INPUTS[m.caseId].pricePerUnit;
  const stressedPrice = Math.round(inp.pricePerUnit * (1 + stress / 100));
  const stressed = useMemo(() => sweep(inp, sc, 'pricePerUnit', [stressedPrice])[0], [inp, sc, stressedPrice]);
  const grid = useMemo(() => sweep(inp, sc, 'pricePerUnit', [-20, -15, -10, -5, 0, 5, 10, 15, 20, 30].map((p) => Math.round(inp.pricePerUnit * (1 + p / 100)))), [inp, sc]);
  const ceiling = base?.maxBid ?? null;
  const d = stressed.deal;
  const premium = d && ceiling ? d.acquisition / ceiling - 1 : null;

  return (
    <>
      <PageHeader eyebrow="Module 4" title="Purchase Price Discipline">
        What can be paid and still earn the required return? The ceiling is the price at which the present value of equity cash flows, discounted at the {pct(inp.requiredIRR, 0)} required levered IRR, equals zero.
        <strong> It is conditional on the workbook hurdle and the assumed {pct(inp.ltv, 0)} LTV financing, not a market price.</strong> Showing {CASE_META[m.caseId].short}, {SCENARIO_META[m.scenarioId].name}.
      </PageHeader>

      <WithResult>{(r) => (
        <div className="space-y-6">
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Original illustrative price" value={usdM(ORIGINAL_INPUTS[m.caseId].units * origPrice)} sub={`${usd(origPrice)} per unit (analyst assumption)`} />
            <Kpi label="Maximum modeled bid" value={usdM(r.maxBid)} sub={r.maxBid === null ? 'Undefined' : `${usd(r.maxBidPerUnit)} per unit`} />
            <Kpi label="Current price vs ceiling" value={r.maxBid ? signedPct(r.acquisition / r.maxBid - 1) : 'n/a'} tone={r.maxBid && r.acquisition > r.maxBid ? 'neg' : 'pos'}
              sub={r.maxBid && r.acquisition > r.maxBid ? 'Premium: price exceeds the bid ceiling' : 'Discount to bid ceiling'} />
            <Kpi label="Headroom (ceiling vs price)" value={signedPct(r.headroom)} sub={r.maxBid ? `${usd(r.maxBid - r.acquisition)} of price room` : ''} />
          </dl>
          {r.maxBid !== null && r.maxBid <= 0 && <Callout tone="neg" title="No positive price meets the hurdle">Under these assumptions the present value of property cash flows does not cover the upfront capex at the required IRR.</Callout>}

          <Card title="Interactive price stress test" subtitle="Local to this page. Does not change your underwriting assumptions."
            right={<button type="button" className="rounded border border-line px-2 py-1 text-xs font-medium hover:bg-paper" onClick={() => setStress(0)}>Reset stress</button>}>
            <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
              <div>
                <label htmlFor="stress" className="text-sm font-medium text-navy-900">Price change vs current assumption: <span className="num" data-testid="stress-value">{signedPct(stress / 100, 0)}</span></label>
                <input id="stress" type="range" min={-30} max={40} step={1} value={stress} onChange={(e) => setStress(Number(e.target.value))} className="mt-2 w-full accent-navy-800" aria-valuetext={`${stress} percent`} />
                <div className="flex justify-between text-xs text-muted"><span>-30%</span><span>0</span><span>+40%</span></div>
                <p className="num mt-4 text-sm text-ink">Stressed price: <strong data-testid="stress-price">{usd(stressedPrice)}</strong> per unit, <strong>{usd(stressedPrice * inp.units)}</strong> total.</p>
              </div>
              {d ? (
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {([
                    ['Debt required', usd(d.loan)], ['Equity required', usd(d.equity)],
                    ['Levered IRR', pct(d.leveredIRR)], ['Equity MOIC', mult(d.moic)], ['Minimum DSCR', mult(d.minDSCR)],
                    ['Price vs bid ceiling', premium === null ? 'n/a' : signedPct(premium)],
                  ] as [string, string][]).map(([l, v]) => (
                    <div key={l}><dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">{l}</dt><dd className="num font-serif text-lg text-navy-900" data-testid={`stress-${l.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{v}</dd></div>
                  ))}
                </dl>
              ) : <p className="text-sm text-neg" role="alert">{stressed.error}</p>}
              {d && <div className="lg:col-start-2">{d.clearsHurdle ? <Chip tone="pos">Clears {pct(inp.requiredIRR, 0)} required IRR</Chip> : <Chip tone="neg">Does not clear {pct(inp.requiredIRR, 0)} required IRR</Chip>}</div>}
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Levered IRR vs purchase price per unit" subtitle="Each point re-runs the full model. Gaps are prices where no real IRR exists.">
              <LineSweep label="Levered IRR versus purchase price" yName="Levered IRR" xFmt={(v) => `$${Math.round(v / 1000)}K`} yFmt={(v) => pct(v, 0)} refY={inp.requiredIRR}
                refX={r.maxBidPerUnit ?? undefined} data={grid.map((g) => ({ x: g.value, y: g.deal?.leveredIRR ?? null }))} />
            </Card>
            <Card title="Price vs returns" subtitle="Debt scales with price at the assumed LTV">
              <Table caption="Purchase price sensitivity" head={['Price / unit', 'vs current', 'Total price', 'Debt', 'Equity', 'IRR', 'MOIC', 'Min DSCR']}>
                {grid.map((g, i) => {
                  const pctChg = [-20, -15, -10, -5, 0, 5, 10, 15, 20, 30][i];
                  return (
                    <Tr key={g.value} strong={pctChg === 0}>
                      <Td left bold>{usd(g.value)}</Td><Td>{signedPct(pctChg / 100, 0)}</Td>
                      {g.deal ? <><Td>{usdM(g.deal.acquisition)}</Td><Td>{usdM(g.deal.loan)}</Td><Td>{usdM(g.deal.equity)}</Td><Td tone={g.deal.leveredIRR === null ? 'neg' : g.deal.clearsHurdle ? 'pos' : 'warn'}>{pct(g.deal.leveredIRR)}</Td><Td>{mult(g.deal.moic)}</Td><Td>{mult(g.deal.minDSCR)}</Td></> : <Td>invalid</Td>}
                    </Tr>
                  );
                })}
              </Table>
            </Card>
          </div>

          <Callout title="How to read the bid ceiling">
            The ceiling holds operating assumptions, exit cap, loan terms and the {pct(inp.requiredIRR, 0)} hurdle constant, and scales debt with price. It does not account for lender sizing limits, the downside scenario, or the fact that the Downside case returns no real IRR at any price near the assumed one. Paying at the ceiling leaves no cushion; the memo's decision gates call for sizing price against downside DSCR and exit liquidity.
          </Callout>
        </div>
      )}</WithResult>
    </>
  );
}
