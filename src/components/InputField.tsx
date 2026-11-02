'use client';
import { useEffect, useId, useState } from 'react';
import { ORIGINAL_INPUTS } from '@/data/inputs';
import { validateField, type CaseId } from '@/engine';
import { useModel } from '@/store/model';
import { FIELD_BY_KEY, fromDisplay, toDisplay, type FieldDef } from './fieldDefs';

export function InputField({ caseId, def }: { caseId: CaseId; def: FieldDef }) {
  const m = useModel();
  const id = useId();
  const cur = m.inputs(caseId)[def.key];
  const orig = ORIGINAL_INPUTS[caseId][def.key];
  const [text, setText] = useState(toDisplay(cur, def.unit));
  const [err, setErr] = useState<string | null>(null);
  const modified = cur !== orig;

  // Re-sync when the store changes from elsewhere (reset, case switch).
  useEffect(() => {
    if (fromDisplay(text, def.unit) !== cur) { setText(toDisplay(cur, def.unit)); setErr(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur, caseId]);

  const onChange = (t: string) => {
    setText(t);
    const v = fromDisplay(t, def.unit);
    const msg = validateField(def.key, v);
    setErr(msg ? msg.replace(/between (-?[\d.]+) and (-?[\d.]+)/, (_s, a, b) => def.unit === 'pct' ? `between ${(+a * 100).toFixed(0)}% and ${(+b * 100).toFixed(0)}%` : `between ${a} and ${b}`) : null);
    if (!msg) m.setInput(caseId, def.key, v);
  };

  return (
    <div className={`rounded border px-3 py-2 ${err ? 'border-neg bg-red-50' : modified ? 'border-amber-400 bg-amber-50' : 'border-line bg-white'}`}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-navy-900">{def.label}</label>
        {modified && (
          <button type="button" className="text-xs font-medium text-warn underline" onClick={() => m.resetField(caseId, def.key)} aria-label={`Reset ${def.label} to original ${toDisplay(orig, def.unit)}`}>Reset</button>
        )}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <input id={id} type="number" inputMode="decimal" step={def.step} value={text} onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!err} aria-describedby={`${id}-d`} className="num w-full min-w-0 rounded border border-line bg-white px-2 py-1.5 text-sm" />
        <span className="shrink-0 text-xs text-muted">{def.suffix}</span>
      </div>
      <p id={`${id}-d`} className={`mt-1 text-xs ${err ? 'font-medium text-neg' : 'text-muted'}`} role={err ? 'alert' : undefined}>
        {err ?? `Original: ${toDisplay(orig, def.unit)}${def.hint ? `. ${def.hint}` : ''}`}
      </p>
    </div>
  );
}
export { FIELD_BY_KEY };
