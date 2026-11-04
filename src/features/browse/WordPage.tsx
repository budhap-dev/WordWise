import { ArrowLeft, Check, Clock, Link2, Plus, Tag as TagIcon } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';

import { Button, ButtonLink } from '../../components/ui/Button';
import { ShareButton } from '../../components/ui/ShareButton';
import { cardClasses } from '../../components/ui/styles';
import { WordDetails } from '../../components/word/WordDetails';
import { WordHeader } from '../../components/word/WordHeader';
import { getWord } from '../../data';
import { type CardRecord, db } from '../../db/db';
import { introduceWord } from '../../db/progress';
import { addDays, type DateKey, fromDateKey, toDateKey } from '../../lib/date';
import { HAPTIC, haptic } from '../../lib/haptics';
import { relatedEntries } from '../../lib/related';
import { wordShare } from '../../lib/share';
import { useRequiredSettings } from '../../state/settingsContext';
import type { WordEntry } from '../../types/content';

function shortDate(key: DateKey): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(
    fromDateKey(key),
  );
}

function nextReview(due: DateKey, today: DateKey): string {
  if (due <= today) return 'due for review today';
  if (due === addDays(today, 1)) return 'next review tomorrow';
  const days = Math.round((fromDateKey(due).getTime() - fromDateKey(today).getTime()) / 86_400_000);
  return `next review in ${days} days`;
}

function ProgressStrip({ word, card }: { word: WordEntry; card: CardRecord | null }) {
  const today = toDateKey();
  if (card) {
    const isDue = card.due <= today;
    return (
      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-surface-2 p-4">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
            isDue ? 'bg-spark/25' : 'bg-success-soft'
          }`}
          aria-hidden="true"
        >
          {isDue ? <Clock className="size-4" /> : <Check className="size-4" />}
        </span>
        <p className="min-w-0 flex-1 text-sm">
          <span className="font-semibold">
            {card.introducedOn === today
              ? 'Learnt today'
              : `Learnt ${shortDate(card.introducedOn)}`}
          </span>
          <span className="text-ink-muted"> · {nextReview(card.due, today)}</span>
        </p>
        {isDue && (
          <ButtonLink to="/review" variant="soft" size="sm">
            Review now
          </ButtonLink>
        )}
      </div>
    );
  }
  return (
    <div className="mt-5 flex flex-col items-start gap-3 rounded-2xl border border-dashed border-line p-4 sm:flex-row sm:items-center">
      <p className="min-w-0 text-sm text-ink-muted sm:flex-1">
        Not learnt yet. Add it and it’ll come back tomorrow for its first review.
      </p>
      <Button
        variant="soft"
        size="sm"
        onClick={async () => {
          haptic(HAPTIC.tap);
          await introduceWord(word.id);
        }}
      >
        <Plus className="size-4" aria-hidden="true" />
        Add to my reviews
      </Button>
    </div>
  );
}

function WordLinks({ title, words }: { title: string; words: readonly WordEntry[] }) {
  if (words.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold">{title}:</span>
      {words.map((w) => (
        <Link
          key={w.id}
          to={`/words/${w.id}`}
          className="inline-flex min-h-9 items-center rounded-full border border-brand/40 bg-brand-soft/60 px-3 text-sm font-semibold text-brand transition active:scale-[0.97]"
        >
          {w.term}
        </Link>
      ))}
    </div>
  );
}

export function WordPage() {
  const { id = '' } = useParams();
  const word = getWord(id);
  const settings = useRequiredSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const headingRef = useRef<HTMLHeadingElement>(null);
  // `null` once loaded with no card; `undefined` while loading.
  const card = useLiveQuery(async () => (await db.cards.get(id)) ?? null, [id]);
  const related = useMemo(() => (word ? relatedEntries(word) : null), [word]);

  // Moving between related words: start at the top, and tell screen readers where we are.
  useEffect(() => {
    window.scrollTo?.({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [id]);

  // Back returns to the search as it was, or to Browse if the page was opened directly.
  const goBack = () => {
    if (location.key !== 'default') void navigate(-1);
    else void navigate('/browse');
  };

  if (!word || !related) {
    return (
      <div className="animate-rise py-12 text-center">
        <p className="text-5xl" aria-hidden="true">
          🫖
        </p>
        <h1 className="mt-4 font-display text-2xl font-semibold">Can’t find that word</h1>
        <p className="mt-1 text-ink-muted">It seems to have popped out. Try searching for it.</p>
        <ButtonLink to="/browse" variant="soft" className="mt-5">
          Browse all words
        </ButtonLink>
      </div>
    );
  }

  return (
    <article aria-labelledby="word-heading">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="-ml-3 min-h-11" onClick={goBack}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Button>
        <ShareButton content={wordShare(word)} size="sm" />
      </div>

      <div className={`${cardClasses} animate-rise p-6 sm:p-8`}>
        <WordHeader word={word} as="h1" headingId="word-heading" headingRef={headingRef} />
        {card !== undefined && <ProgressStrip word={word} card={card} />}

        <div className="mt-6">
          <WordDetails word={word} roles={settings.roles} />
        </div>

        {(related.similar.length > 0 || related.opposite.length > 0) && (
          <section className="mt-6">
            <h3 className="mb-1 flex items-center gap-2 text-xs font-bold tracking-widest text-ink-muted uppercase">
              <Link2 className="size-4 text-brand" aria-hidden="true" />
              Also in WordWise
            </h3>
            <WordLinks title="Similar" words={related.similar} />
            <WordLinks title="Opposite" words={related.opposite} />
          </section>
        )}

        {word.topics.length > 0 && (
          <section className="mt-6">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-bold tracking-widest text-ink-muted uppercase">
              <TagIcon className="size-4 text-brand" aria-hidden="true" />
              Topics
            </h3>
            <ul className="flex flex-wrap gap-2">
              {word.topics.map((t) => (
                <li key={t}>
                  <Link
                    to={`/browse?q=${encodeURIComponent(t.replace(/-/g, ' '))}`}
                    className="inline-flex min-h-9 items-center rounded-full bg-surface-2 px-3 text-sm font-medium text-ink-muted transition hover:text-ink active:scale-[0.97]"
                  >
                    {t.replace(/-/g, ' ')}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}
