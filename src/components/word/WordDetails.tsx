import { ScrollText, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

import { ROLE_LABELS } from '../../data';
import { examplesForRoles } from '../../lib/examples';
import type { Role, WordEntry } from '../../types/content';
import { HighlightedText } from './HighlightedText';

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-6">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-bold tracking-widest text-ink-muted uppercase">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Everything about a word except the header: the "back of the card". */
export function WordDetails({ word, roles }: { word: WordEntry; roles: readonly Role[] }) {
  const examples = examplesForRoles(word, roles);

  return (
    <div>
      <p className="text-lg leading-relaxed text-pretty">{word.definition}</p>

      <Section title="In context">
        <ul className="space-y-3">
          {examples.map((e) => (
            <li key={e.text} className="rounded-2xl bg-surface-2 p-4">
              {e.role && (
                <span className="mb-1 block text-xs font-semibold text-ink-muted">
                  <span aria-hidden="true">{ROLE_LABELS[e.role].emoji} </span>
                  {ROLE_LABELS[e.role].label}
                </span>
              )}
              <p className="leading-relaxed">
                <HighlightedText text={e.text} entry={word} />
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Goes well with">
        <ul className="flex flex-wrap gap-2">
          {word.collocations.map((c) => (
            <li
              key={c}
              className="rounded-full border border-line bg-surface px-3 py-1 text-sm font-medium"
            >
              {c}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Similar, but not the same">
        <dl className="space-y-2">
          {word.synonyms.map((s) => (
            <div key={s.term} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
              <dt className="shrink-0 font-semibold">{s.term}</dt>
              <dd className="text-ink-muted">
                <span className="sr-only">: </span>
                {s.note}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      {word.commonMistake && (
        <Section
          title="Watch out"
          icon={<TriangleAlert className="size-4 text-spark" aria-hidden="true" />}
        >
          <p className="rounded-2xl border border-spark/40 bg-spark/10 p-4 leading-relaxed">
            {word.commonMistake}
          </p>
        </Section>
      )}

      {word.origin && (
        <Section
          title="Origin story"
          icon={<ScrollText className="size-4 text-accent" aria-hidden="true" />}
        >
          <p className="leading-relaxed text-pretty italic">{word.origin}</p>
        </Section>
      )}
    </div>
  );
}
