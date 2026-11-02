'use client';
import { useMemo } from 'react';
import { CASE_META, SCENARIO_META } from '@/data/inputs';
import { computeWaterfall } from '@/engine';
import { useModel } from '@/store/model';
import { Callout, Card, Chip, Kpi, PageHeader, Table, Td, Tr } from '@/components/ui';
import { GroupedBars } from '@/components/charts';
import { WithResult } from '@/components/Guard';
import { mult, pct, usd, usdM } from '@/lib-fmt';

export default function Investors() {
  const m = useModel();
  const inp = m.inputs();
  const r = m.result();
  const w = useMemo(() => (r ? computeWaterfall(r, inp) : null), [r, inp]);
  const isWorkbookScope = m.caseId === 'TX' && m.scenarioId === 'Base';
  return (
    <>
      <PageHeader eyebrow="Module 8" title="Investor Economics">
        An illustrative LP/GP distribution waterfall that follows the workbook&apos;s LP Waterfall sheet exactly: return of capital, then the {pct(inp.lpPref, 0)} LP preferred return, then residual split with a {pct(inp.gpPromote, 0)} GP promote.
        LP funds {pct(inp.lpShare, 0)} of equity. <strong>These are not Cima&apos;s actual fund terms.</strong>
      </PageHeader>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Chip tone="navy">{CASE_META[m.caseId].short} | {SCENARIO_META[m.scenarioId].name}</Chip>
        {isWorkbookScope ? <Chip tone="pos">Matches the workbook&apos;s published waterfall</Chip> : <Chip tone="warn">Extension: workbook publishes this waterfall for North Texas Base only</Chip>}
      </div>
      <WithResult>{(deal) => {
        if (!w) return null;
        const totalProfit = w.lpDistributions + w.gpDistributions - deal.equity - w.years.reduce((a, y) => a + y.call, 0);
        const promote = w.years.reduce((a, y) => a + y.residualGP, 0);
        const lpContrib = w.lpInitial + w.years.reduce((a, y) => a + y.lpContrib, 0);
        const gpContrib = w.gpInitial + w.years.reduce((a, y) => a + y.gpContrib, 0);
        return (
          <div className="space-y-6">
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi label="LP contribution" value={usdM(lpContrib)} sub={`GP co-invest ${usdM(gpContrib)}`} />
              <Kpi label="LP distributions" value={usdM(w.lpDistributions)} sub={`LP IRR ${pct(w.lpIRR)}`} tone={w.lpIRR === null ? 'neg' : 'neutral'} />
              <Kpi label="GP distributions" value={usdM(w.gpDistributions)} sub={`GP IRR ${pct(w.gpIRR)}`} tone={w.gpIRR === null ? 'neg' : 'neutral'} />
              <Kpi label="GP promote" value={usdM(promote)} sub={totalProfit > 0 ? `${pct(promote / totalProfit)} of total profit` : 'No residual profit'} />
            </dl>
            {w.years.some((y) => y.call > 0) && <Callout tone="warn" title="Capital calls">Negative project cash flow in at least one year is treated as a capital call funded {pct(inp.lpShare, 0)} LP / {pct(1 - inp.lpShare, 0)} GP, as in the workbook.</Callout>}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="Net cash flow to LP and GP" subtitle="Contributions negative, distributions positive">
                <GroupedBars label="LP and GP net cash flow by year" data={w.lpCashflows.map((v, i) => ({ x: `Year ${i}`, lp: v, gp: w.gpCashflows[i] }))}
                  series={[{ key: 'lp', name: 'LP', color: '#1d3a63' }, { key: 'gp', name: 'GP', color: '#8a6a24' }]} />
              </Card>
              <Card title="Waterfall mechanics" subtitle="Per the workbook">
                <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                  <li>Positive project equity cash flow is distributed; negative cash flow is a capital call split LP/GP.</li>
                  <li>Cash returns capital pro rata to LP and GP capital balances first.</li>
                  <li>Remaining cash pays the LP preferred return: {pct(inp.lpPref, 0)} of LP capital per year, simple (not compounded), with any unpaid amount carried forward.</li>
                  <li>Any residual splits {pct(1 - inp.gpPromote, 0)} LP / {pct(inp.gpPromote, 0)} GP promote.</li>
                </ol>
                <p className="mt-3 text-xs text-muted">Excluded: catch-up, clawback, fees, lookback and tax distributions. See Methodology for review notes on ordering.</p>
              </Card>
            </div>
            <Card title="Annual waterfall" subtitle="All amounts in dollars">
              <Table caption="LP/GP waterfall by year" head={['Year', 'Project equity CF', 'Capital call', 'Cash to distribute', 'Capital returned', 'LP pref accrued', 'LP pref paid', 'Unpaid LP pref', 'Residual to LP', 'GP promote', 'LP total', 'GP total']}>
                {w.years.map((y) => (
                  <Tr key={y.year}><Td left bold>{y.year}</Td><Td tone={y.projectCF < 0 ? 'neg' : undefined}>{usd(y.projectCF)}</Td><Td>{usd(y.call)}</Td><Td>{usd(y.cash)}</Td><Td>{usd(y.rocLP + y.rocGP)}</Td>
                    <Td>{usd(y.lpPrefAccrual)}</Td><Td>{usd(y.lpPrefPaid)}</Td><Td>{usd(y.unpaidPref)}</Td><Td>{usd(y.residualLP)}</Td><Td>{usd(y.residualGP)}</Td><Td bold>{usd(y.lpTotal)}</Td><Td bold>{usd(y.gpTotal)}</Td></Tr>
                ))}
                <Tr strong><Td left>Total</Td><Td>{usd(w.years.reduce((a, y) => a + y.projectCF, 0))}</Td><Td>{usd(w.years.reduce((a, y) => a + y.call, 0))}</Td><Td>{usd(w.years.reduce((a, y) => a + y.cash, 0))}</Td><Td>{usd(w.years.reduce((a, y) => a + y.rocLP + y.rocGP, 0))}</Td>
                  <Td>{usd(w.years.reduce((a, y) => a + y.lpPrefAccrual, 0))}</Td><Td>{usd(w.years.reduce((a, y) => a + y.lpPrefPaid, 0))}</Td><Td>{usd(w.years[4].unpaidPref)}</Td><Td>{usd(w.years.reduce((a, y) => a + y.residualLP, 0))}</Td><Td>{usd(promote)}</Td><Td>{usd(w.lpDistributions)}</Td><Td>{usd(w.gpDistributions)}</Td></Tr>
              </Table>
              <p className="mt-3 text-xs text-muted">Cash reconciliation (distributed minus available) across all years: {usd(w.residualCash)}. LP multiple on contributions: {mult(lpContrib ? w.lpDistributions / lpContrib : null)}; GP: {mult(gpContrib ? w.gpDistributions / gpContrib : null)}.</p>
            </Card>
          </div>
        );
      }}</WithResult>
    </>
  );
}
