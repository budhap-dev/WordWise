import { ArrowRight, ScrollText, Sparkles } from 'lucide-react';

import { ButtonLink } from '../../components/ui/Button';
import { ShareButton } from '../../components/ui/ShareButton';
import { cardClasses } from '../../components/ui/styles';
import { HighlightedText } from '../../components/word/HighlightedText';
import { WordHeader } from '../../components/word/WordHeader';
import { examplesForRoles } from '../../lib/examples';
import { wordOfTheDayShare } from '../../lib/share';
import type { Role, WordEntry } from '../../types/content';

/** A compact row of related words, e.g. "Similar: concise · terse". Hidden when empty. */
function TermChips({ label, terms }: { label: string; terms: readonly { term: string }[] }) {
  if (terms.length === 0) return null;
  return (
    <p className="mt-3 flex flex-wrap items-center gap-1.5 text-sm">
      <span className="font-semibold text-ink">{label}:</span>
      {terms.slice(0, 3).map((t) => (
        <span key={t.term} className="rounded-full border border-line bg-surface px-2.5 py-0.5">
          {t.term}
        </span>
      ))}
    </p>
  );
}

export function WordOfTheDay({ word, roles }: { word: WordEntry; roles: readonly Role[] }) {
  const examples = examplesForRoles(word, roles, { min: 2, max: 2 });

  return (
    <section
      aria-labelledby="wotd-heading"
      className={`${cardClasses} relative isolate overflow-hidden p-6 sm:p-8`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-16 -right-10 size-56 animate-float rounded-full bg-brand/15 blur-2xl" />
        <div className="absolute -bottom-20 -left-10 size-56 animate-float rounded-full bg-accent/20 blur-2xl [animation-delay:-3.5s]" />
      </div>

      <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1 text-xs font-bold tracking-widest text-ink uppercase">
        <Sparkles className="size-3.5" aria-hidden="true" />
        Word of the day
      </p>

      <WordHeader word={word} as="h2" headingId="wotd-heading" />

      <p className="mt-5 text-lg leading-relaxed text-pretty">{word.definition}</p>

      {examples.length > 0 && (
        <ul aria-label="Example sentences" className="mt-4 space-y-2">
          {examples.map((e) => (
            <li key={e.text} className="border-l-4 border-brand/40 pl-4 text-ink-muted italic">
              <HighlightedText text={e.text} entry={word} />
            </li>
          ))}
        </ul>
      )}

      <TermChips label="Similar" terms={word.synonyms} />
      <TermChips label="Opposite" terms={word.antonyms ?? []} />

      {word.origin && (
        <p className="mt-5 flex gap-2 text-sm text-ink-muted">
          <ScrollText className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
          <span>
            <span className="font-semibold text-ink">Origin: </span>
            {word.origin}
          </span>
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <ButtonLink to="/learn" variant="soft">
          Explore it fully <ArrowRight className="size-4" aria-hidden="true" />
        </ButtonLink>
        <ShareButton content={wordOfTheDayShare(word)} />
      </div>
    </section>
  );
}
