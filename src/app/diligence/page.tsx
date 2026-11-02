'use client';
import { DILIGENCE, DILIGENCE_TOPICS } from '@/data/content';
import { Callout, Card, Chip, Kpi, PageHeader } from '@/components/ui';

const tone = (p: string) => (p === 'Critical' ? 'neg' : 'warn') as 'neg' | 'warn';

export default function Diligence() {
  const open = DILIGENCE.filter((d) => d.status !== 'Cleared');
  const critical = DILIGENCE.filter((d) => d.priority === 'Critical');
  return (
    <>
      <PageHeader eyebrow="Module 7" title="Investment Diligence">
        The request list from the workbook: the data an independent reviewer would need to replace modeled assumptions with actual results, now that the acquisition has closed. These are outstanding requests, not claims about the underlying communities, and <strong>no confidential documents have been reviewed</strong>.
      </PageHeader>
      <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Open requests" value={String(open.length)} tone="neg" sub={`of ${DILIGENCE.length} total`} />
        <Kpi label="Critical" value={String(critical.length)} tone="neg" sub="needed to replace modeled inputs" />
        <Kpi label="High" value={String(DILIGENCE.filter((d) => d.priority === 'High').length)} tone="warn" />
        <Kpi label="Received" value={String(DILIGENCE.filter((d) => d.status === 'Received').length)} sub="none; status per workbook" />
      </dl>
      <Callout tone="neg" title="Unresolved: every item below is Not received">Workflow state is the workbook&apos;s own. The memo&apos;s conclusion is a conditional value creation thesis; these items would be needed to validate it with actual data.</Callout>

      <div className="mt-6 space-y-6">
        {DILIGENCE_TOPICS.map((t) => {
          const items = DILIGENCE.filter((d) => t.areas.includes(d.area));
          return (
            <Card key={t.topic} title={t.topic} subtitle={`Workbook area: ${t.areas.join(', ')}`}>
              <ul className="divide-y divide-line">
                {items.map((d) => (
                  <li key={d.request} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[110px_1fr_auto] sm:gap-4">
                    <div><Chip tone={tone(d.priority)}>{d.priority}</Chip></div>
                    <div>
                      <p className="text-sm font-medium text-navy-900">{d.request}</p>
                      <p className="mt-0.5 text-xs text-muted">Why it matters: {d.rationale}. Owner: {d.owner}.</p>
                    </div>
                    <div><Chip>{d.status}</Chip></div>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </>
  );
}
