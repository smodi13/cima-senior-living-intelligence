'use client';
import { INPUT_META, SOURCES } from '@/data/content';
import { CASE_META } from '@/data/inputs';
import { CASES } from '@/engine';
import { useModel } from '@/store/model';
import { Callout, Card, Chip, PageHeader, Table, Td, Tr } from '@/components/ui';
import { FIELD_BY_KEY, toDisplay } from '@/components/fieldDefs';
import { pct } from '@/lib-fmt';
import type { DealInputs } from '@/engine';

const ROW_KEYS: [string, keyof DealInputs][] = [['8', 'startOcc'], ['9', 'stabOcc'], ['10', 'stabMonths'], ['11', 'rent'], ['12', 'rentGrowth'], ['13', 'ancillary'], ['14', 'ancillaryGrowth'],
  ['15', 'fixedStaffing'], ['16', 'variableLabor'], ['17', 'laborInflation'], ['18', 'otherFixed'], ['19', 'otherVariablePct'], ['20', 'fixedInflation'], ['21', 'taxIns'], ['22', 'taxInsInflation'],
  ['23', 'mgmtFeePct'], ['24', 'pricePerUnit'], ['25', 'closingPct'], ['26', 'renoPerUnit'], ['27', 'capexReservePerUnit'], ['28', 'ltv'], ['29', 'coupon'], ['30', 'ioYears'], ['31', 'amortYears'],
  ['32', 'finFeePct'], ['33', 'exitCap'], ['34', 'disposalPct'], ['35', 'holdYears'], ['36', 'requiredIRR'], ['37', 'lpPref'], ['38', 'gpPromote'], ['39', 'lpShare'], ['40', 'minDSCR']];

const bench = (ref: string) => SOURCES.find((s) => s.ref === ref)!.value as number;

export default function Research() {
  const m = useModel();
  const tx = m.inputs('TX'), katy = m.inputs('Katy');
  const comps: { label: string; model: string; bench: string; diff: string; refs: string }[] = [
    { label: 'Katy starting occupancy vs Houston senior housing', model: pct(katy.startOcc), bench: pct(bench('S07')), diff: `${((katy.startOcc - bench('S07')) * 100).toFixed(1)} pts`, refs: 'S07' },
    { label: 'North Texas starting occupancy vs national assisted living', model: pct(tx.startOcc), bench: pct(bench('S06')), diff: `${((tx.startOcc - bench('S06')) * 100).toFixed(1)} pts`, refs: 'S06' },
    { label: 'North Texas stabilized occupancy vs national assisted living', model: pct(tx.stabOcc), bench: pct(bench('S06')), diff: `${((tx.stabOcc - bench('S06')) * 100).toFixed(1)} pts`, refs: 'S06' },
    { label: 'Katy stabilized occupancy vs national senior housing', model: pct(katy.stabOcc), bench: pct(bench('S05')), diff: `${((katy.stabOcc - bench('S05')) * 100).toFixed(1)} pts`, refs: 'S05' },
    { label: 'Modeled rent growth (North Texas) vs NIC MAP national rent growth', model: pct(tx.rentGrowth), bench: pct(bench('S08')), diff: `${((tx.rentGrowth - bench('S08')) * 100).toFixed(1)} pts`, refs: 'S08' },
  ];
  return (
    <>
      <PageHeader eyebrow="Module 9" title="Investment Research and Evidence">
        Sourced facts are kept separate from analyst assumptions. Sources are as recorded in the workbook Sources sheet (research date 2 November 2026). <strong>This application has no live market data feeds</strong> and has not re-verified these pages; follow the links to confirm.
      </PageHeader>
      <Card title="Source register" subtitle="Fact = public announcement; Benchmark / Survey = third-party market research">
        <Table caption="Source register" head={['Ref', 'Date', 'Source', 'Statement', 'Value', 'Class', 'Link']}>
          {SOURCES.map((s) => (
            <tr key={s.ref} className="border-b border-line align-top text-sm">
              <td className="px-3 py-2 text-left font-semibold">{s.ref}</td><td className="num whitespace-nowrap px-3 py-2 text-left">{s.date}</td><td className="px-3 py-2 text-left">{s.source}</td>
              <td className="min-w-64 px-3 py-2 text-left">{s.statement}</td>
              <td className="num px-3 py-2 text-left">{s.value === null ? 'n/a' : s.value < 1 ? pct(s.value) : s.value}</td>
              <td className="px-3 py-2 text-left"><Chip tone={s.cls === 'Fact' ? 'pos' : 'brass'}>{s.cls}</Chip></td>
              <td className="px-3 py-2 text-left"><a className="font-medium underline" href={s.url} target="_blank" rel="noopener noreferrer">Open source<span className="sr-only"> {s.ref} (new tab)</span></a></td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card className="mt-6" title="Model assumptions against public benchmarks" subtitle="Computed from your current assumptions and the benchmark values above">
        <Table caption="Assumption versus benchmark" head={['Comparison', 'Model', 'Benchmark', 'Difference', 'Source']}>
          {comps.map((c) => (<Tr key={c.label}><Td left bold>{c.label}</Td><Td>{c.model}</Td><Td>{c.bench}</Td><Td>{c.diff}</Td><Td>{c.refs}</Td></Tr>))}
        </Table>
        <p className="mt-3 text-xs text-muted">Benchmarks are market-wide aggregates, not property-level evidence. S09 (CBRE) reports an average cap rate decline of {bench('S09')} basis points over six months; the model&apos;s exit cap rates are analyst assumptions, not drawn from that survey.</p>
      </Card>

      <Card className="mt-6" title="Analyst assumptions register" subtitle="Everything below is an assumption, not a fact. Values shown are the current (possibly edited) inputs.">
        <Table caption="Assumptions register" head={['Assumption', 'Ref', ...CASES.map((c) => CASE_META[c].short), 'Rationale (workbook)']}>
          {ROW_KEYS.map(([row, key]) => {
            const meta = INPUT_META[row];
            const f = FIELD_BY_KEY[key];
            const show = (v: number) => (f ? toDisplay(v, f.unit) + (f.unit === 'pct' ? '%' : '') : String(v));
            return (<Tr key={row}><Td left bold>{meta.label}</Td><Td left>{meta.ref}</Td><Td>{show(tx[key])}</Td><Td>{show(katy[key])}</Td><Td left>{meta.rationale}</Td></Tr>);
          })}
        </Table>
      </Card>

      <div className="mt-6"><Callout title="Not disclosed publicly">Neither announcement nor credible primary sources disclose purchase prices, rent rolls, NOI, leverage, debt terms, actual occupancy, fund waterfall or realized exit proceeds. They are intentionally hypothetical throughout.</Callout></div>
    </>
  );
}
