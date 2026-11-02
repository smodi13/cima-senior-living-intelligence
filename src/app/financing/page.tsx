'use client';
import { CASES, SCENARIOS, computeDebtTreatment } from '@/engine';
import { CASE_META, SCENARIO_META } from '@/data/inputs';
import { useModel } from '@/store/model';
import { Callout, Card, Chip, Kpi, PageHeader, Table, Td, Tr } from '@/components/ui';
import { GroupedBars } from '@/components/charts';
import { WithResult } from '@/components/Guard';
import { mult, pct, usd, usdM } from '@/lib-fmt';

export default function Financing() {
  const m = useModel();
  const inp = m.inputs();
  return (
    <>
      <PageHeader eyebrow="Financing risk" title="Financing Outcomes at Exit">
        What happens when the sale does not repay the loan? Two <strong>illustrative</strong> conventions are shown side by side. <strong>Neither represents Cima&apos;s actual, undisclosed loan obligations</strong>: actual recourse, guaranties and lender remedies depend on loan documents that are not public.
      </PageHeader>
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card title="1. Sponsor-supported payoff (original underwriting)">
          <p className="text-sm leading-relaxed">The sponsor funds any shortfall so the lender is repaid in full. The shortfall appears as a negative Year 5 equity cash flow. This is the treatment used everywhere else in this application.</p>
        </Card>
        <Card title="2. Limited-recourse, exit-only illustration">
          <p className="text-sm leading-relaxed">Sale equity proceeds are floored at zero, so a payoff shortfall is not funded by equity at the sale. Year 5 operating cash deficits remain funded, and the debt schedule is unchanged. This is not a model of bankruptcy, carve-outs, deficiency claims or workouts.</p>
        </Card>
      </div>

      <WithResult>{(r) => {
        const t = computeDebtTreatment(r);
        return (
          <div className="space-y-6">
            <h2 className="text-sm font-semibold text-navy-900">{CASE_META[m.caseId].short} | {SCENARIO_META[m.scenarioId].name} scenario</h2>
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi label="Net sale proceeds" value={usdM(t.netSaleProceeds)} sub={`after ${usdM(-t.disposalCosts)} sale costs`} />
              <Kpi label="Outstanding loan" value={usdM(t.outstandingDebt)} />
              <Kpi label="Loan payoff shortfall" value={usd(t.payoffShortfall)} tone={t.payoffShortfall > 0 ? 'neg' : 'pos'} sub={t.payoffShortfall > 0 ? 'Net sale proceeds below loan' : 'Sale covers the loan'} />
              <Kpi label="Sale equity (floored at 0)" value={usdM(t.saleEquityFloored)} />
            </dl>
            {t.payoffShortfall > 0 && (
              <Callout tone="neg" title="Payoff shortfall">
                Net sale proceeds are {usd(t.payoffShortfall)} short of the loan. Under treatment 1 the sponsor funds that amount; under treatment 2 sale equity is zero and the shortfall is not funded by equity in this illustration. The difference in Year 5 cash flow is exactly the shortfall ({usd(t.impliedCure)}). It is not an established guarantee or contractual obligation.
              </Callout>
            )}
            <div className="grid gap-6">
              <Card title="Equity cash flows under each treatment" subtitle="Year 0 is the initial equity investment">
                <GroupedBars label="Equity cash flow by year under both financing treatments"
                  data={t.sponsorSupported.cashflows.map((v, y) => ({ x: `Year ${y}`, sponsor: v, limited: t.limitedRecourse.cashflows[y] }))}
                  series={[{ key: 'sponsor', name: 'Sponsor-supported', color: '#1d3a63' }, { key: 'limited', name: 'Limited-recourse exit-only', color: '#8a6a24' }]} />
              </Card>
              <Card title="Return measures by treatment" subtitle="Workbook IRR and MOIC definitions applied to each cash flow series">
                <Table caption="Returns by financing treatment" head={['Measure', 'Sponsor-supported', 'Limited-recourse']}>
                  <Tr><Td left bold>Year 5 equity cash flow</Td><Td tone={t.sponsorSupportedY5CF < 0 ? 'neg' : undefined}>{usd(t.sponsorSupportedY5CF)}</Td><Td tone={t.limitedRecourseY5CF < 0 ? 'neg' : undefined}>{usd(t.limitedRecourseY5CF)}</Td></Tr>
                  <Tr><Td left bold>Levered IRR</Td><Td>{pct(t.sponsorSupported.irr)}</Td><Td>{pct(t.limitedRecourse.irr)}</Td></Tr>
                  <Tr><Td left bold>Equity MOIC</Td><Td>{mult(t.sponsorSupported.moic)}</Td><Td>{mult(t.limitedRecourse.moic)}</Td></Tr>
                </Table>
                <p className="mt-3 text-xs text-muted">The workbook publishes the Year 5 cash flows (Debt Treatment columns J and K). IRR and MOIC for the alternative series are computed here with the workbook&apos;s own definitions. NM means no real IRR exists because no cash flow after Year 0 is positive. A 0.00x MOIC measures the absence of positive distributions, not the size of the cash loss.</p>
              </Card>
            </div>
          </div>
        );
      }}</WithResult>

      <Card className="mt-6" title="Exit debt bridge, all six cases" subtitle="Current assumptions. Mirrors the workbook Debt Treatment sheet.">
        <Table caption="Debt treatment for six cases" head={['Case', 'Gross sale', 'Sale costs', 'Net sale', 'Outstanding debt', 'Payoff shortfall', 'Sale equity at $0 floor', 'Sale cash after debt', 'Y5 operating CF', 'Limited-recourse Y5 CF', 'Sponsor-supported Y5 CF', 'Difference']}>
          {CASES.flatMap((c) => SCENARIOS.map((s) => {
            const x = m.result(c, s);
            if (!x) return <Tr key={c + s}><Td left>{c} {s}</Td><Td>invalid</Td></Tr>;
            const t = computeDebtTreatment(x);
            return (
              <Tr key={c + s} strong={c === m.caseId && s === m.scenarioId}>
                <Td left bold>{CASE_META[c].short} {SCENARIO_META[s].name}</Td><Td>{usd(t.grossSale)}</Td><Td>{usd(t.disposalCosts)}</Td><Td>{usd(t.netSaleProceeds)}</Td><Td>{usd(t.outstandingDebt)}</Td>
                <Td tone={t.payoffShortfall > 0 ? 'neg' : undefined}>{usd(t.payoffShortfall)}</Td><Td>{usd(t.saleEquityFloored)}</Td><Td tone={t.saleCashAfterDebt < 0 ? 'neg' : undefined}>{usd(t.saleCashAfterDebt)}</Td>
                <Td>{usd(t.y5OperatingEquityCF)}</Td><Td>{usd(t.limitedRecourseY5CF)}</Td><Td>{usd(t.sponsorSupportedY5CF)}</Td><Td>{usd(t.impliedCure)}</Td>
              </Tr>
            );
          }))}
        </Table>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Callout tone="warn" title="Lender diligence">
          Even a non-recourse loan can carry carve-outs or completion-related recourse. Loan and guaranty documents must be reviewed before any real financing conclusion.
        </Callout>
        <Callout title={`The ${inp.minDSCR.toFixed(2)}x DSCR threshold is an analyst screen, not a covenant`}>
          It is an internal screen, not a covenant claimed for this Cima transaction. Fannie Mae&apos;s public Seniors Housing Financing Term Sheet lists a 1.40x minimum DSCR when more than 50% assisted living and/or dementia care and 1.30x when more than 50% independent living; the actual lender and terms are not established by the public announcement.{' '}
          <a className="font-medium underline" href="https://multifamily.fanniemae.com/financing-options/seniors-housing/seniors-housing-financing-term-sheet" target="_blank" rel="noopener noreferrer">Fannie Mae term sheet<span className="sr-only"> (new tab)</span></a>
          {' '}<Chip>Analyst screen</Chip>
        </Callout>
      </div>
    </>
  );
}
