import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';

import { cardClasses } from '../../components/ui/styles';
import { lastScores, useAttempts } from '../../hooks/usePractice';
import { useCards } from '../../hooks/useProgress';
import { toDateKey } from '../../lib/date';
import { MODES } from './modes';

function minutes(size: number, mode: string) {
  const perQuestion = mode === 'upgrade' ? 0.8 : 0.3;
  return Math.max(2, Math.round(size * perQuestion));
}

export function PracticeHub() {
  const cards = useCards();
  const attempts = useAttempts();
  if (!cards || !attempts) return <p className="sr-only">Loading…</p>;
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
        {MODES.map(({ mode, emoji, title, blurb, size }, i) => {
          const score = scores.get(mode);
          const featured = mode === 'mixed';
          return (
            <li
              key={mode}
              className={`animate-rise ${featured ? 'sm:col-span-2' : ''}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <Link
                to={`/practice/${mode}`}
                className={`${cardClasses} flex min-h-24 items-center gap-4 p-5 transition active:scale-[0.98] ${
                  featured ? 'border-brand/40 bg-brand-soft/50' : 'hover:border-ink-muted/40'
                }`}
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
                  <span className="mt-1 block text-xs font-medium text-ink-muted">
                    {size} questions · about {minutes(size, mode)} min
                    {score && (
                      <>
                        {' · '}
                        <span className="text-ink">
                          {score.date === today ? 'Today' : 'Last time'}: {score.correct}/
                          {score.total}
                        </span>
                      </>
                    )}
                  </span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-ink-muted" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="text-center text-sm text-ink-muted">
        Practice won’t change your review schedule, but it does count towards your streak 🔥
      </p>
    </div>
  );
}
