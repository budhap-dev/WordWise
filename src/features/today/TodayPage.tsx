import { ArrowRight, Check, RotateCcw, Sparkles } from 'lucide-react';

import { Button, ButtonLink } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { cardClasses } from '../../components/ui/styles';
import { useDailySet } from '../../hooks/useDailySet';
import { estimateMinutes } from '../../lib/daily';
import { formatLongDate, greeting } from '../../lib/date';
import { useRequiredSettings } from '../../state/settingsContext';
import { useTodayProgress } from '../../state/todayProgress';
import { WordOfTheDay } from './WordOfTheDay';

export function TodayPage() {
  const settings = useRequiredSettings();
  const words = useDailySet(settings);
  const { seenIds, reset } = useTodayProgress();
  const seen = words.filter((w) => seenIds.includes(w.id)).length;
  const done = words.length > 0 && seen >= words.length;
  const wordOfTheDay = words[0];

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <p className="text-sm font-medium text-ink-muted">{formatLongDate()}</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{greeting()}</h1>
      </header>

      {wordOfTheDay && <WordOfTheDay word={wordOfTheDay} roles={settings.roles} />}

      <section aria-labelledby="set-heading" className={`${cardClasses} p-6`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="set-heading" className="text-xl font-semibold">
            Today's set
          </h2>
          <p className="text-sm text-ink-muted">
            {words.length} words · about {estimateMinutes(words.length)} min
          </p>
        </div>

        <ProgressBar value={seen} max={words.length} label="Today's progress" className="mt-4" />

        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Words in today's set">
          {words.map((w, i) => {
            const isSeen = seenIds.includes(w.id);
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

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {done ? (
            <>
              <p className="flex items-center gap-2 font-semibold text-success">
                <Check className="size-5" aria-hidden="true" /> Done for today
              </p>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="size-4" aria-hidden="true" /> Go through them again
              </Button>
            </>
          ) : (
            <ButtonLink to="/learn" size="lg">
              {seen === 0 ? "Start today's set" : `Continue (${seen}/${words.length})`}
              <ArrowRight className="size-5" aria-hidden="true" />
            </ButtonLink>
          )}
        </div>
      </section>
    </div>
  );
}
