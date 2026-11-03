import { ArrowRight, CalendarCheck, PartyPopper, RotateCcw, Target } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { StickyActionBar } from '../../components/layout/StickyActionBar';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Confetti } from '../../components/ui/Confetti';
import { ShareButton } from '../../components/ui/ShareButton';
import { cardClasses } from '../../components/ui/styles';
import { toDateKey } from '../../lib/date';
import { hashString, seededRandom } from '../../lib/random';
import { rewardJoke } from '../../lib/fun';
import { progressShare } from '../../lib/share';
import { useStreak } from '../../hooks/useProgress';
import type { Role, WordEntry } from '../../types/content';
import { JokeBody } from './FunCard';
import { CHALLENGES, DONE_MESSAGES, randomFrom } from './messages';

export function DoneForToday({
  words,
  roles,
  onAgain,
}: {
  words: WordEntry[];
  roles: readonly Role[];
  onAgain: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const streak = useStreak();
  const random = seededRandom(hashString(`done:${toDateKey()}`));
  const message = randomFrom(DONE_MESSAGES, random);
  const challenge = randomFrom(CHALLENGES, random);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="mx-auto max-w-xl pt-6 text-center">
      <Confetti />
      <div className="mx-auto flex size-24 animate-pop items-center justify-center rounded-full bg-accent/25">
        <PartyPopper className="size-11 text-spark" aria-hidden="true" />
      </div>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-6 animate-rise font-display text-4xl font-semibold tracking-tight outline-none"
      >
        Done for today!
      </h1>
      <p className="mt-3 animate-rise text-lg text-ink-muted [animation-delay:120ms]">{message}</p>

      <section
        aria-labelledby="learnt-heading"
        className={`${cardClasses} mt-8 animate-rise p-6 text-left [animation-delay:200ms]`}
      >
        <h2 id="learnt-heading" className="font-semibold">
          {words.length} words explored
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {words.map((w, i) => (
            <li
              key={w.id}
              className="animate-pop rounded-full bg-success-soft px-3 py-1 text-sm font-medium"
              style={{ animationDelay: `${300 + i * 60}ms` }}
            >
              {w.term}
            </li>
          ))}
        </ul>
        <p className="mt-5 flex gap-2 rounded-2xl bg-surface-2 p-4 text-sm">
          <CalendarCheck className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
          <span>They’ll come back for a quick review tomorrow, then less and less often.</span>
        </p>
        <p className="mt-3 flex gap-2 rounded-2xl bg-brand-soft p-4 text-sm">
          <Target className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
          <span>
            <span className="font-semibold">Today's challenge: </span>
            {challenge}
          </span>
        </p>
      </section>

      <section
        aria-labelledby="reward-heading"
        className={`${cardClasses} mt-4 animate-rise p-6 text-left [animation-delay:300ms]`}
      >
        <h2
          id="reward-heading"
          className="mb-3 text-xs font-bold tracking-widest text-ink-muted uppercase"
        >
          Your reward: a terrible joke 🥁
        </h2>
        <JokeBody joke={rewardJoke(toDateKey(), roles)} />
      </section>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <ShareButton
          variant="soft"
          label="Share my progress"
          content={progressShare(
            words.map((w) => w.term),
            streak?.days ?? 0,
          )}
        />
        <Button variant="ghost" onClick={onAgain}>
          <RotateCcw className="size-4" aria-hidden="true" /> Go through them again
        </Button>
      </div>

      <StickyActionBar>
        <ButtonLink to="/" size="lg" className="w-full">
          Back to Today <ArrowRight className="size-5" aria-hidden="true" />
        </ButtonLink>
      </StickyActionBar>
    </div>
  );
}
