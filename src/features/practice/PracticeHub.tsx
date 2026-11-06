import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { cardClasses } from '../../components/ui/styles';
import { lastScores, useAttempts, useBeeStats, useRushStats } from '../../hooks/usePractice';
import { useCards } from '../../hooks/useProgress';
import { toDateKey } from '../../lib/date';
import { MODES } from './modes';

function minutes(size: number, mode: string) {
  const perQuestion = mode === 'upgrade' ? 0.8 : 0.3;
  return Math.max(2, Math.round(size * perQuestion));
}

function PracticeCard({
  to,
  emoji,
  title,
  blurb,
  stripe,
  delay = 0,
  children,
}: {
  to: string;
  emoji: string;
  title: string;
  blurb: string;
  stripe: string;
  delay?: number;
  children: ReactNode;
}) {
  return (
    <li className="animate-rise" style={{ animationDelay: `${delay}ms` }}>
      <Link
        to={to}
        className={`${cardClasses} flex h-full min-h-24 items-center gap-4 border-l-[6px] p-5 transition active:scale-[0.98] ${stripe}`}
      >
        <span
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-3xl"
          aria-hidden="true"
        >
          {emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-semibold">{title}</span>
          <span className="block text-sm text-ink-muted">{blurb}</span>
          <span className="mt-1 block text-xs font-medium text-ink-muted">{children}</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-ink-muted" aria-hidden="true" />
      </Link>
    </li>
  );
}

export function PracticeHub() {
  const cards = useCards();
  const attempts = useAttempts();
  const rush = useRushStats();
  const bee = useBeeStats();
  if (!cards || !attempts || !rush || !bee) return <p className="sr-only">Loading…</p>;
  const scores = lastScores(attempts);
  const today = toDateKey();

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Practice</h1>
        <p className="mt-1 text-ink-muted">
          {cards.length >= 5
            ? `Quick games using the ${cards.length} words you’ve learnt, shakiest first.`
            : 'Quick games with words for your roles. Once you’ve learnt a few, they’ll star here.'}
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        <PracticeCard
          to="/play/rush"
          emoji="⚡"
          title="Word Rush"
          blurb="60 seconds, combos and three lives. How far can you get?"
          stripe="border-l-violet-500"
        >
          {rush.best > 0 ? (
            <>
              Your best: <span className="text-ink">{rush.best}</span>
            </>
          ) : (
            'New: arcade mode'
          )}
        </PracticeCard>
        <PracticeCard
          to="/play/bee"
          emoji="🐝"
          title="Spelling Bee"
          blurb="Hear the word, spell it, and see how long you last as they get harder."
          stripe="border-l-amber-500"
          delay={50}
        >
          {bee.best > 0 ? (
            <>
              Your best: <span className="text-ink">{bee.best}</span>
            </>
          ) : (
            'New: sound on for this one'
          )}
          {bee.tricky.length > 0 && ` · ${bee.tricky.length} tricky to go back to`}
        </PracticeCard>
        {MODES.map(({ mode, emoji, title, blurb, stripe, size }, i) => {
          const score = scores.get(mode);
          return (
            <PracticeCard
              key={mode}
              to={`/practice/${mode}`}
              emoji={emoji}
              title={title}
              blurb={blurb}
              stripe={stripe}
              delay={(i + 2) * 50}
            >
              {size} questions · about {minutes(size, mode)} min
              {score && (
                <>
                  {' · '}
                  <span className="text-ink">
                    {score.date === today ? 'Today' : 'Last time'}: {score.correct}/{score.total}
                  </span>
                </>
              )}
            </PracticeCard>
          );
        })}
      </ul>

      <p className="text-center text-sm text-ink-muted">
        Practice won’t change your review schedule, but it does count towards your streak 🔥
      </p>
    </div>
  );
}
