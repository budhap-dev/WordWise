import { ArrowRight, Heart, Play, RotateCcw, Timer, X, Zap } from 'lucide-react';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Link } from 'react-router';

import { StickyActionBar } from '../../components/layout/StickyActionBar';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Confetti } from '../../components/ui/Confetti';
import { cardClasses } from '../../components/ui/styles';
import { getWord, WORDS } from '../../data';
import { recordGameScore } from '../../db/progress';
import { useEligibleWords, useRushStats } from '../../hooks/usePractice';
import { useCards } from '../../hooks/useProgress';
import { toDateKey } from '../../lib/date';
import { HAPTIC, haptic } from '../../lib/haptics';
import {
  multiplier,
  RUSH_DURATION_MS,
  RUSH_LIVES,
  RUSH_START,
  type RushQuestion,
  rushQuestions,
  rushReducer,
  type RushState,
  rushTitle,
} from '../../lib/practice/rush';
import { practicePool } from '../../lib/practice/session';
import { hashString, seededRandom } from '../../lib/random';
import { useRequiredSettings } from '../../state/settingsContext';
import { SentenceWithGap } from '../practice/ChoiceQuestionView';

/** Ignore taps for a moment after answering, so a double tap can't answer the next question. */
const INPUT_LOCK_MS = 250;
const TICK_MS = 100;

/** `/play/rush`: waits for progress and history, then sets up a round. */
export function WordRush() {
  const cards = useCards();
  const stats = useRushStats();
  // Snapshot "games so far" once, so a new round's questions don't change mid-game.
  const [round, setRound] = useState<number>();
  if (stats && round === undefined) setRound(stats.played);
  if (!cards || !stats || round === undefined) return <p className="sr-only">Loading…</p>;
  return (
    <Game
      key={round}
      seed={`${toDateKey()}:rush:${round}`}
      cards={cards}
      best={stats.best}
      onAgain={() => setRound((r) => (r ?? 0) + 1)}
    />
  );
}

function Game({
  seed,
  cards,
  best,
  onAgain,
}: {
  seed: string;
  cards: { wordId: string; ease: number; lapses: number }[];
  best: number;
  onAgain: () => void;
}) {
  const settings = useRequiredSettings();
  const eligible = useEligibleWords(settings);
  const [questions] = useState(() => {
    const random = seededRandom(hashString(seed));
    const pool = practicePool(cards, eligible, WORDS, 100, random).words;
    return rushQuestions(pool, WORDS, settings.roles, random);
  });
  const [state, dispatch] = useReducer(rushReducer, RUSH_START);
  // The personal best before this game, so "new best" doesn't flicker as the score saves.
  const [previousBest] = useState(best);

  if (state.status === 'ready') {
    return <Ready best={previousBest} onStart={() => dispatch({ type: 'start' })} />;
  }
  if (state.status === 'over') {
    return <Results state={state} previousBest={previousBest} onAgain={onAgain} />;
  }
  return <Round state={state} questions={questions} dispatch={dispatch} />;
}

function Ready({ best, onStart }: { best: number; onStart: () => void }) {
  return (
    <div className="mx-auto max-w-xl pt-6 text-center">
      <span className="block animate-pop text-7xl" aria-hidden="true">
        ⚡
      </span>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">Word Rush</h1>
      <p className="mt-2 text-lg text-ink-muted">How many words can you nail in a minute?</p>

      <ul className={`${cardClasses} mt-8 space-y-3 p-6 text-left`}>
        <li className="flex gap-3">
          <Timer className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
          <span>
            <strong>60 seconds.</strong> Each right answer adds a second and a half.
          </span>
        </li>
        <li className="flex gap-3">
          <Zap className="mt-0.5 size-5 shrink-0 text-spark" aria-hidden="true" />
          <span>
            <strong>Combos.</strong> Three in a row doubles your points; ten in a row, ×4.
          </span>
        </li>
        <li className="flex gap-3">
          <Heart className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
          <span>
            <strong>Three lives.</strong> A wrong answer costs one, and shows you the right word.
          </span>
        </li>
      </ul>

      {best > 0 && (
        <p className="mt-6 text-ink-muted">
          Your best: <strong className="text-ink tabular-nums">{best}</strong>{' '}
          <span aria-hidden="true">{rushTitle(best).emoji}</span>
        </p>
      )}

      <StickyActionBar>
        <Button size="lg" className="w-full" onClick={onStart}>
          <Play className="size-5" aria-hidden="true" /> Play
        </Button>
      </StickyActionBar>
    </div>
  );
}

function Round({
  state,
  questions,
  dispatch,
}: {
  state: RushState;
  questions: readonly RushQuestion[];
  dispatch: (action: Parameters<typeof rushReducer>[1]) => void;
}) {
  const question = questions[state.index];
  const lockedUntil = useRef(0);

  // The clock: measured in real elapsed time, and paused while the app is in the background.
  useEffect(() => {
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      if (!document.hidden) dispatch({ type: 'tick', elapsedMs: now - last });
      last = now;
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [dispatch]);

  const answer = useCallback(
    (choice: number) => {
      const now = performance.now();
      if (!question || now < lockedUntil.current) return;
      lockedUntil.current = now + INPUT_LOCK_MS;
      haptic(choice === question.answer ? HAPTIC.tap : HAPTIC.error);
      dispatch({ type: 'answer', choice, questions });
    },
    [question, questions, dispatch],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= 4) answer(n - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answer]);

  if (!question) return null;
  const seconds = Math.ceil(state.timeLeftMs / 1000);
  const hurry = state.timeLeftMs <= 10_000;
  const x = multiplier(state.combo);

  return (
    <div className="mx-auto max-w-xl">
      <div className="sticky top-0 z-30 -mx-4 bg-bg/90 px-4 pt-2 pb-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            to="/practice"
            aria-label="Stop and return to Practice"
            className="-ml-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-muted active:bg-surface-2"
          >
            <X className="size-6" aria-hidden="true" />
          </Link>
          <p className="flex gap-0.5" aria-label={`${state.lives} of ${RUSH_LIVES} lives left`}>
            {Array.from({ length: RUSH_LIVES }, (_, i) => (
              <Heart
                key={i}
                className={`size-6 transition ${i < state.lives ? 'fill-danger text-danger' : 'text-line'}`}
                aria-hidden="true"
              />
            ))}
          </p>
          <p className="ml-auto text-right">
            <span className="sr-only">Score: </span>
            <span
              key={state.score}
              className="inline-block animate-pop font-display text-3xl font-semibold tabular-nums"
            >
              {state.score}
            </span>
          </p>
        </div>
        <div
          className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-2"
          role="timer"
          aria-label={`${seconds} seconds left`}
        >
          <div
            className={`h-full rounded-full transition-[width] duration-100 ease-linear ${hurry ? 'bg-danger' : 'bg-brand'}`}
            style={{ width: `${(state.timeLeftMs / RUSH_DURATION_MS) * 100}%` }}
          />
        </div>
        <div className="mt-2 flex min-h-7 items-center justify-between text-sm font-semibold">
          <span className={`tabular-nums ${hurry ? 'text-danger' : 'text-ink-muted'}`}>
            {seconds}s
          </span>
          {x > 1 && (
            <span key={x} className="animate-pop rounded-full bg-spark/20 px-3 py-0.5">
              🔥 {state.combo} in a row · ×{x}
            </span>
          )}
        </div>
      </div>

      {state.last && (
        <p
          key={state.answers.length}
          aria-live="polite"
          className={`mt-1 text-center text-sm font-semibold ${
            state.last.correct ? 'animate-pop text-success' : 'animate-shake text-danger'
          }`}
        >
          {state.last.correct
            ? `+${state.last.points}${state.last.points > 10 ? ` (×${state.last.points / 10})` : ''}`
            : `✗ It was “${state.last.question.options[state.last.question.answer]}”`}
        </p>
      )}

      <h1 className="sr-only">Word Rush</h1>
      <section
        key={question.id}
        className={`${cardClasses} mt-3 animate-rise p-6`}
        aria-labelledby="rush-prompt-label"
      >
        <h2
          id="rush-prompt-label"
          className="text-xs font-bold tracking-widest text-ink-muted uppercase"
        >
          {question.kind === 'definition' ? 'Which word means…' : 'Fill the gap'}
        </h2>
        <p className="mt-3 font-display text-2xl leading-snug text-pretty">
          {question.kind === 'sentence' ? (
            <SentenceWithGap text={question.prompt} />
          ) : (
            question.prompt
          )}
        </p>
      </section>

      <ul className="mt-4 grid grid-cols-2 gap-2.5" aria-label="Answers">
        {question.options.map((option, i) => (
          <li key={`${question.id}-${option}`}>
            <button
              type="button"
              onClick={() => answer(i)}
              className="flex min-h-20 w-full items-center justify-center rounded-2xl border-2 border-line bg-surface p-3 text-center text-lg leading-tight font-semibold transition active:scale-[0.96] active:border-brand active:bg-brand-soft"
            >
              {option}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Results({
  state,
  previousBest,
  onAgain,
}: {
  state: RushState;
  previousBest: number;
  onAgain: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const saved = useRef(false);
  const correct = state.answers.filter((a) => a.correct).length;
  const newBest = state.score > previousBest && state.score > 0;
  const { title, emoji } = rushTitle(state.score);
  const missed = state.answers.filter((a) => !a.correct);

  useEffect(() => {
    headingRef.current?.focus();
    if (saved.current) return;
    saved.current = true;
    haptic(HAPTIC.success);
    recordGameScore({
      game: 'rush',
      score: state.score,
      correct,
      answered: state.answers.length,
      bestCombo: state.bestCombo,
    }).catch((error: unknown) => console.error('Could not save score', error));
  }, [state, correct]);

  return (
    <div className="mx-auto max-w-xl pt-6 text-center">
      {newBest && <Confetti seed={state.score} />}
      <span className="block animate-pop text-6xl" aria-hidden="true">
        {emoji}
      </span>
      <p className="mt-3 text-sm font-bold tracking-widest text-ink-muted uppercase">{title}</p>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-1 font-display text-6xl font-semibold tracking-tight tabular-nums outline-none"
      >
        {state.score}
        <span className="sr-only"> points</span>
      </h1>
      <p className="mt-2 text-lg text-ink-muted">
        {newBest
          ? previousBest > 0
            ? `New personal best! (was ${previousBest})`
            : 'Your first score. Now beat it!'
          : state.lives <= 0
            ? 'Out of lives. One more go?'
            : 'Time’s up!'}
      </p>

      <dl className="mt-6 grid grid-cols-3 gap-2">
        {[
          ['Right', `${correct}/${state.answers.length}`],
          ['Best combo', String(state.bestCombo)],
          ['Personal best', String(Math.max(previousBest, state.score))],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-surface-2 p-3">
            <dt className="text-xs font-medium text-ink-muted">{label}</dt>
            <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      {missed.length > 0 && (
        <section
          aria-labelledby="rush-missed"
          className={`${cardClasses} mt-6 animate-rise p-6 text-left`}
        >
          <h2 id="rush-missed" className="font-semibold">
            Words to remember
          </h2>
          <ul className="mt-3 space-y-2">
            {missed.map(({ wordId, questionId }) => {
              const word = getWord(wordId);
              if (!word) return null;
              return (
                <li key={questionId} className="rounded-2xl bg-surface-2 p-3 text-sm">
                  <span className="font-semibold">{word.term}</span>
                  <span className="text-ink-muted">: {word.definition}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <ButtonLink to="/practice" variant="ghost" className="mt-6">
        Back to Practice <ArrowRight className="size-4" aria-hidden="true" />
      </ButtonLink>

      <StickyActionBar>
        <Button size="lg" className="w-full" onClick={onAgain}>
          <RotateCcw className="size-5" aria-hidden="true" /> Play again
        </Button>
      </StickyActionBar>
    </div>
  );
}
