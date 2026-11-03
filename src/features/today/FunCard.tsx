import { ChevronDown, Laugh, MessageSquareQuote } from 'lucide-react';
import { useId, useState } from 'react';

import { cardClasses } from '../../components/ui/styles';
import { OtherMeanings } from '../../components/word/OtherMeanings';
import { HAPTIC, haptic } from '../../lib/haptics';
import type { DailyFun } from '../../lib/fun';
import type { BritishSaying, Joke } from '../../types/content';

function RevealButton({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        haptic(HAPTIC.tap);
        onClick();
      }}
      className="mt-4 flex min-h-12 w-full items-center justify-center rounded-2xl border-2 border-dashed border-line px-4 py-3 font-semibold text-ink-muted transition active:scale-[0.98] active:bg-surface-2"
    >
      {children}
    </button>
  );
}

export function JokeBody({ joke }: { joke: Joke }) {
  const [revealed, setRevealed] = useState(false);
  const [explained, setExplained] = useState(false);
  const explainId = useId();

  return (
    <>
      <p className="font-display text-xl leading-snug font-medium text-balance">{joke.setup}</p>
      {revealed ? (
        <div aria-live="polite">
          <p className="mt-3 animate-pop font-display text-xl leading-snug font-semibold text-brand">
            {joke.punchline}
          </p>
          <button
            type="button"
            aria-expanded={explained}
            aria-controls={explainId}
            onClick={() => setExplained((e) => !e)}
            className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink-muted"
          >
            Why is that funny?
            <ChevronDown
              className={`size-4 transition ${explained ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
          <p id={explainId} hidden={!explained} className="animate-rise text-sm text-ink-muted">
            {joke.explanation}
          </p>
        </div>
      ) : (
        <RevealButton onClick={() => setRevealed(true)}>Go on then… 🥁</RevealButton>
      )}
    </>
  );
}

function SayingBody({ saying }: { saying: BritishSaying }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <>
      <p className="text-xs font-bold tracking-widest text-ink-muted uppercase">What they say</p>
      <p className="mt-1 font-display text-2xl leading-snug font-medium">“{saying.say}”</p>
      {revealed ? (
        <div aria-live="polite" className="mt-4 animate-pop rounded-2xl bg-accent/20 p-4">
          <p className="text-xs font-bold tracking-widest text-ink-muted uppercase">
            What they mean
          </p>
          <p className="mt-1 text-lg font-semibold">{saying.mean}</p>
          {saying.note && <p className="mt-2 text-sm text-ink-muted">{saying.note}</p>}
        </div>
      ) : (
        <RevealButton onClick={() => setRevealed(true)}>What do they really mean? 🕵️</RevealButton>
      )}
      {revealed && saying.otherMeanings && saying.otherMeanings.length > 0 && (
        <div className="mt-4 animate-rise">
          <p className="mb-2 text-xs font-bold tracking-widest text-ink-muted uppercase">
            But sometimes it means…
          </p>
          <OtherMeanings meanings={saying.otherMeanings} />
        </div>
      )}
    </>
  );
}

export function FunCard({ fun }: { fun: DailyFun }) {
  const isJoke = fun.kind === 'joke';
  return (
    <section aria-labelledby="fun-heading" className={`${cardClasses} p-6`}>
      <h2
        id="fun-heading"
        className="mb-4 flex items-center gap-2 text-xs font-bold tracking-widest text-ink-muted uppercase"
      >
        {isJoke ? (
          <Laugh className="size-4 text-spark" aria-hidden="true" />
        ) : (
          <MessageSquareQuote className="size-4 text-brand" aria-hidden="true" />
        )}
        {isJoke ? 'A bit of fun' : 'British, decoded'}
      </h2>
      {fun.kind === 'joke' ? <JokeBody joke={fun.joke} /> : <SayingBody saying={fun.saying} />}
      {!isJoke && (
        <p className="mt-4 text-xs text-ink-muted">Tongue in cheek, but there’s truth in it.</p>
      )}
    </section>
  );
}
