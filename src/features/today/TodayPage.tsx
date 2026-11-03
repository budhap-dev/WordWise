import { ArrowRight, BrainCircuit, Check, RotateCcw, Sparkles } from 'lucide-react';

import { ButtonLink } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { cardClasses } from '../../components/ui/styles';
import { REVIEW_SESSION_MAX } from '../review/session';
import { useReviews, useStreak, useTodaySet } from '../../hooks/useProgress';
import { estimateMinutes } from '../../lib/daily';
import { formatLongDate, greeting, toDateKey } from '../../lib/date';
import { dailyFun } from '../../lib/fun';
import type { Streak } from '../../lib/streak';
import { useRequiredSettings } from '../../state/settingsContext';
import { FunCard } from './FunCard';
import { WordOfTheDay } from './WordOfTheDay';

/**
 * On phones the main call to action floats above the tab bar, in thumb reach; inline on larger
 * screens. Its section must not be transformed (e.g. animated), or `fixed` would anchor to it.
 */
const FLOATING =
  'fixed inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 sm:static';
const FLOATING_BUTTON = 'w-full shadow-lg shadow-brand/25 sm:w-auto sm:shadow-sm';

function StreakChip({ streak }: { streak: Streak }) {
  if (streak.days === 0) return null;
  return (
    <p
      className={`inline-flex animate-pop items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
        streak.activeToday ? 'bg-spark/20 text-ink' : 'border border-dashed border-spark/60'
      }`}
    >
      <span aria-hidden="true" className={streak.activeToday ? undefined : 'grayscale'}>
        🔥
      </span>
      {streak.days}-day streak
      {!streak.activeToday && <span className="font-normal text-ink-muted"> · keep it going</span>}
    </p>
  );
}

export function TodayPage() {
  const settings = useRequiredSettings();
  const today = useTodaySet(settings);
  const reviews = useReviews();
  const streak = useStreak();
  if (!today || !reviews) return <p className="sr-only">Loading…</p>;

  const { words, seenIds } = today;
  const seen = words.filter((w) => seenIds.has(w.id)).length;
  const done = words.length === 0 || seen >= words.length;
  const wordOfTheDay = words[0];
  const due = reviews.due.length;
  const sessionSize = Math.min(due, REVIEW_SESSION_MAX);
  // One primary action at a time: reviews first (they're time-sensitive), then new words.
  const primary = due > 0 ? 'review' : done ? null : 'learn';

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-ink-muted">{formatLongDate()}</p>
          {streak && <StreakChip streak={streak} />}
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{greeting()}</h1>
      </header>

      {due > 0 && (
        <section
          aria-labelledby="review-heading"
          className={`${cardClasses} flex flex-col gap-4 border-brand/40 bg-brand-soft/40 p-6 sm:flex-row sm:items-center`}
        >
          <div className="flex flex-1 items-start gap-3">
            <BrainCircuit className="mt-1 size-6 shrink-0 text-brand" aria-hidden="true" />
            <div>
              <h2 id="review-heading" className="text-xl font-semibold">
                {due} {due === 1 ? 'word' : 'words'} to review
              </h2>
              <p className="text-sm text-ink-muted">
                Catch them just before they slip away · about{' '}
                {Math.max(1, Math.round(sessionSize / 4))} min
              </p>
            </div>
          </div>
          <div className={FLOATING}>
            <ButtonLink to="/review" size="lg" className={FLOATING_BUTTON}>
              Review {sessionSize} {sessionSize === 1 ? 'word' : 'words'}
              <ArrowRight className="size-5" aria-hidden="true" />
            </ButtonLink>
          </div>
        </section>
      )}

      {wordOfTheDay && <WordOfTheDay word={wordOfTheDay} roles={settings.roles} />}

      <section aria-labelledby="set-heading" className={`${cardClasses} p-6`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="set-heading" className="text-xl font-semibold">
            Today's new words
          </h2>
          <p className="text-sm text-ink-muted">
            {words.length} words · about {estimateMinutes(words.length)} min
          </p>
        </div>

        {words.length === 0 ? (
          <p className="mt-4 text-ink-muted">
            You’ve learnt every word for your roles. Brilliant! Keep up your reviews, or add another
            role in Settings for fresh words.
          </p>
        ) : (
          <>
            <ProgressBar
              value={seen}
              max={words.length}
              label="Today's progress"
              className="mt-4"
            />
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Words in today's set">
              {words.map((w, i) => {
                const isSeen = seenIds.has(w.id);
                // The word of the day is already on screen, so show its tile too.
                const isShown = isSeen || i === 0;
                return (
                  <li
                    key={w.id}
                    className={`animate-pop rounded-full px-3 py-1 text-sm font-medium ${
                      isSeen
                        ? 'bg-success-soft text-ink'
                        : isShown
                          ? 'bg-accent/20 text-ink'
                          : 'border border-dashed border-line text-ink-muted'
                    }`}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    {isShown ? (
                      <>
                        {isSeen ? (
                          <Check className="mr-1 inline size-3.5 text-success" aria-hidden="true" />
                        ) : (
                          <Sparkles className="mr-1 inline size-3.5" aria-hidden="true" />
                        )}
                        {w.term}
                      </>
                    ) : (
                      <>
                        <span aria-hidden="true">? ? ?</span>
                        <span className="sr-only">Not yet revealed</span>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {done ? (
            words.length > 0 && (
              <>
                <p className="flex items-center gap-2 font-semibold text-success">
                  <Check className="size-5" aria-hidden="true" /> Done for today
                </p>
                <ButtonLink to="/learn?again=1" variant="ghost" size="sm">
                  <RotateCcw className="size-4" aria-hidden="true" /> Go through them again
                </ButtonLink>
              </>
            )
          ) : (
            <div className={primary === 'learn' ? FLOATING : undefined}>
              <ButtonLink
                to="/learn"
                size="lg"
                variant={primary === 'learn' ? 'primary' : 'secondary'}
                className={primary === 'learn' ? FLOATING_BUTTON : ''}
              >
                {seen === 0 ? "Start today's words" : `Continue (${seen}/${words.length})`}
                <ArrowRight className="size-5" aria-hidden="true" />
              </ButtonLink>
            </div>
          )}
        </div>

        {due === 0 && reviews.total > 0 && (
          <p className="mt-4 text-sm text-ink-muted">
            No reviews due today
            {reviews.dueTomorrow > 0 &&
              ` · ${reviews.dueTomorrow} ${reviews.dueTomorrow === 1 ? 'word' : 'words'} tomorrow`}
            .
          </p>
        )}
      </section>
      <FunCard fun={dailyFun(toDateKey(), settings.roles)} />

      {/* Room for the floating button on phones */}
      {primary && <div className="h-16 sm:hidden" aria-hidden="true" />}
    </div>
  );
}
