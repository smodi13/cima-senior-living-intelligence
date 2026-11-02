import { DOWNLOADS, REVIEW_ITEMS } from '@/data/content';
import { Callout, Card, Chip, Disclaimer, PageHeader } from '@/components/ui';

const Sec = ({ t, children }: { t: string; children: React.ReactNode }) => (
  <Card title={t}><div className="space-y-2 text-sm leading-relaxed text-ink">{children}</div></Card>
);
const F = ({ children }: { children: React.ReactNode }) => <code className="block overflow-x-auto rounded bg-paper px-3 py-2 text-[13px] text-navy-900">{children}</code>;

export default function Methodology() {
  return (
    <>
      <PageHeader eyebrow="Module 10" title="Methodology and Downloads">
        How the model works, how it was reconciled to the Excel workbook, and what it cannot do. The workbook is the model of record; this application is an interactive port of it.
      </PageHeader>

      <Card title="Downloads" subtitle="Original materials, unmodified">
        <ul className="grid gap-3 sm:grid-cols-2">
          {DOWNLOADS.map((d) => (
            <li key={d.file} className="rounded border border-line p-3">
              <a href={d.file} download className="font-medium text-navy-900 underline" data-testid={`download-${d.type.toLowerCase()}-${d.label.split(' ')[0].toLowerCase()}`}>{d.label}</a>
              <span className="ml-2 align-middle"><Chip>{d.type}</Chip></span>
              <p className="mt-1 text-xs text-muted">{d.note}</p>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Sec t="Model structure">
          <p>Two cases (North Texas, 10 communities and 359 units; The Reserve at Katy, 82 residences) times three scenarios give six annual five-period models. Inputs and scenario parameters are typed data; every other number is calculated by one pure engine used by every page, chart and table.</p>
          <p>Flow: Inputs and scenario multipliers, then Forecast (revenue, labor, other costs, NOI, reserves, debt), then exit, then equity cash flows, then IRR, MOIC and the maximum bid. It is annual, not monthly: occupancy for each year uses the mid-year point of the ramp.</p>
        </Sec>
        <Sec t="Scenarios">
          <p>Eight workbook parameters adjust the base: occupancy points, rent multiplier, labor multiplier, exit cap shift, added stabilization months, ancillary multiplier, nonlabor cost multiplier and renovation overrun. Downside combines adverse values of all eight; it is a stress, not a probability-weighted forecast.</p>
        </Sec>
        <Sec t="Returns">
          <F>Year 0 = -(price + closing + capex - debt + financing fee)</F>
          <F>Year t equity CF = NOI - reserves - debt service (+ sale - costs - payoff in Year 5)</F>
          <p><strong>IRR:</strong> annual IRR of the six equity cash flows. When no real root exists the result is NM and is never shown as 0%.</p>
          <p><strong>MOIC (workbook definition):</strong> sum of positive Year 1-5 flows divided by (Year 0 equity plus any later negative flows, treated as additional equity). A MOIC of 0.00x means no positive distributions.</p>
        </Sec>
        <Sec t="Exit and maximum bid">
          <F>Exit value = Year 5 NOI / (exit cap + scenario shift)</F>
          <F>Net exit equity = value x (1 - sale costs) - loan balance</F>
          <p><strong>Maximum bid:</strong> the price at which the present value of equity cash flows, discounted at the required levered IRR, is zero. Debt scales with price at the assumed LTV, so the ceiling is conditional on that return hurdle and financing structure. A test confirms the full model returns exactly the required IRR when priced at the ceiling.</p>
        </Sec>
      </div>

      <Card className="mt-6" title="Reconciliation to Excel">
        <div className="space-y-2 text-sm leading-relaxed">
          <p>The automated suite compares the engine against values cached in the workbook at 1e-9 relative tolerance: all 21 Dashboard fields for each of the six cases; all 29 Forecast columns for each of the 30 case-years; the 49-cell exit cap by occupancy grid; and all 22 LP waterfall columns across five years plus the waterfall summary block. Unrounded values are used internally; only displays are rounded.</p>
          <p>Special-condition tests cover zero debt, negative cash flow, exit value below payoff, invalid cap rates, occupancy and amortization, very low DSCR, undefined IRR and extreme valid sweeps.</p>
          <p>The workbook was not modified. Open items for investment review are listed below; the engineering side has not changed any assumption.</p>
        </div>
      </Card>

      <Card className="mt-6" title="Items for investment review" subtitle="Discrepancies, workbook behaviors and proposed enhancements. None changes the underwriting.">
        <ul className="divide-y divide-line">
          {REVIEW_ITEMS.map((i) => (
            <li key={i.id} className="py-3 first:pt-0 last:pb-0">
              <p className="text-sm font-semibold text-navy-900"><span className="mr-2 text-brass">{i.id}</span>{i.title}</p>
              <p className="mt-1 text-sm text-ink">{i.detail}</p>
              <p className="mt-1 text-sm text-muted"><strong>Handling:</strong> {i.handling}</p>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Callout tone="warn" title="Major model limitations">
          Annual periods only. No property-level lease schedules, tax reassessment, clinical shift-level productivity, tax depreciation or monthly covenant tests. Exit uses Year 5 NOI at an assumed cap rate. Loan terms are not a lender quote. A shortfall at sale is a sponsor funding requirement, not a non-recourse outcome.
        </Callout>
        <Card title="Disclaimer"><Disclaimer /></Card>
      </div>
    </>
  );
}
