import type { ReactNode } from 'react';

import type { Register } from '../../types/content';

const DOT: Record<Register, string> = {
  formal: 'bg-brand',
  neutral: 'bg-success',
  informal: 'bg-spark',
};

const HINT: Record<Register, string> = {
  formal: 'Best in essays, reports and formal emails',
  neutral: 'Fine almost anywhere',
  informal: 'Relaxed: chats, Slack, friendly emails',
};

export function RegisterBadge({ register }: { register: Register }) {
  return (
    <span
      title={HINT[register]}
      className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 text-xs font-medium text-ink-muted capitalize"
    >
      <span className={`size-2 rounded-full ${DOT[register]}`} aria-hidden="true" />
      <span className="sr-only">Register: </span>
      {register}
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-ink-muted">
      {children}
    </span>
  );
}
