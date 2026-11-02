'use client';
import type { ReactNode } from 'react';
import type { DealResult } from '@/engine';
import { useModel } from '@/store/model';
import { Callout } from './ui';

/** Renders children only when the current case/scenario has a valid result. */
export function WithResult({ children }: { children: (r: DealResult) => ReactNode }) {
  const m = useModel();
  const r = m.result();
  if (!r) return <Callout tone="neg" title="Current assumptions are outside the model's valid range">Use Reset all in the top bar, or correct the highlighted input on the Acquisition Underwriting page.</Callout>;
  return <>{children(r)}</>;
}
