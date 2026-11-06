import {
  ArrowRight,
  Heart,
  Lightbulb,
  MessageSquareQuote,
  Play,
  RotateCcw,
  Snail,
  TrendingUp,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useEffect, useReducer, useRef, useState } from 'react';
import { Link } from 'react-router';

import { StickyActionBar } from '../../components/layout/StickyActionBar';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Confetti } from '../../components/ui/Confetti';
import { cardClasses } from '../../components/ui/styles';
import { getWord, WORDS } from '../../data';
import { recordGameScore } from '../../db/progress';
import { useBeeStats, useEligibleWords } from '../../hooks/usePractice';
import { useCards } from '../../hooks/useProgress';
import { type SpeechState, useSpeech } from '../../hooks/useSpeech';
import { toDateKey } from '../../lib/date';
import { HAPTIC, haptic } from '../../lib/haptics';
import {
  BEE_LIVES,
  BEE_ROUNDS,
  type BeeAction,
  beeQueue,
  type BeeMode,
  beeReducer,
  type BeeResult,
  beeStart,
  type BeeState,
  beeTitle,
  type DiffLetter,
  maskWord,
  maxReveals,
  REVEAL_PENALTY,
  spellingDiff,
  trickyQueue,
} from '../../lib/practice/bee';
import { blankedExample } from '../../lib/practice/generators';
import { practicePool } from '../../lib/practice/session';
import { hashString, seededRandom } from '../../lib/random';
import { useRequiredSettings } from '../../state/settingsContext';
import { SentenceWithGap } from '../practice/ChoiceQuestionView';
import { BeeKeyboard } from './BeeKeyboard';
import { keepFocus } from './keepFocus';

/** Ignore "next" for a moment after checking, so a double tap can't skip the feedback. */
const NEXT_LOCK_MS = 400;
/** A slow, clear reading: the speech API's default is about 1. */
const SLOW_RATE = 0.55;

const PRAISE = ['Spot on!', 'Cracking!', 'Bang on!', 'Top marks!', 'Smashing!', 'Nailed it!'];
const COMMISERATIONS = ['Not quite.', 'Oh, crumbs.', 'So near.', 'Bit of a howler.', 'Oh, bother.'];

interface BeeStats {
  best: number;
  played: number;
  tricky: string[];
}

/** `/play/bee` and `/play/bee/tricky`: waits for progress and history, then sets up a round. */
export function SpellingBee({ mode }: { mode: BeeMode }) {
  const cards = useCards();
  const stats = useBeeStats();
  // Snapshot "games so far" once, so a new round's words don't change mid-game.
  const [round, setRound] = useState<number>();
  if (stats && round === undefined) setRound(stats.played);
  if (!cards || !stats || round === undefined) return <p className="sr-only">Loading…</p>;
  return (
    <Game
      key={`${mode}:${round}`}
      mode={mode}
      seed={`${toDateKey()}:bee:${mode}:${round}`}
      cards={cards}
      stats={stats}
      onAgain={() => setRound((r) => (r ?? 0) + 1)}
    />
  );
}

function Game({
  mode,
  seed,
  cards,
  stats,
  onAgain,
}: {
  mode: BeeMode;
  seed: string;
  cards: { wordId: string; ease: number; lapses: number }[];
  stats: BeeStats;
  onAgain: () => void;
}) {
  const settings = useRequiredSettings();
  const eligible = useEligibleWords(settings);
  const speech = useSpeech();
  const [state, dispatch] = useReducer(beeReducer, undefined, () => {
    const random = seededRandom(hashString(seed));
    if (mode === 'tricky') {
      const words = stats.tricky.flatMap((id) => getWord(id) ?? []);
      return beeStart(mode, trickyQueue(words, random));
    }
    const pool = practicePool(cards, eligible, WORDS, WORDS.length, random).words;
    return beeStart(mode, beeQueue(pool, new Set(cards.map((c) => c.wordId)), random));
  });
  // The personal best before this game, so "new best" doesn't flicker as the score saves.
  const [previousBest] = useState(stats.best);

  if (state.status === 'ready') {
    return (
      <Ready
        mode={mode}
        best={previousBest}
        tricky={stats.tricky.length}
        speechSupported={speech.supported}
        canStart={state.queue.length > 0}
        onStart={() => {
          // Speak from inside the tap: iPhones won't start speech without one.
          const first = state.queue[0];
          if (first) speech.say(first.term);
          dispatch({ type: 'start' });
        }}
      />
    );
  }
  if (state.status === 'over') {
    return <Results state={state} previousBest={previousBest} onAgain={onAgain} />;
  }
  return <Round state={state} speech={speech} dispatch={dispatch} />;
}

function Ready({
  mode,
  best,
  tricky,
  speechSupported,
  canStart,
  onStart,
}: {
  mode: BeeMode;
  best: number;
  tricky: number;
  speechSupported: boolean;
  canStart: boolean;
  onStart: () => void;
}) {
  const isTricky = mode === 'tricky';
  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="text-left">
        <Link
          to={isTricky ? '/play/bee' : '/practice'}
          aria-label={isTricky ? 'Back to the Spelling Bee' : 'Back to Practice'}
          className="-ml-2 inline-flex size-11 items-center justify-center rounded-full text-ink-muted active:bg-surface-2"
        >
          <X className="size-6" aria-hidden="true" />
        </Link>
      </div>
      <span className="block animate-pop text-7xl" aria-hidden="true">
        {isTricky ? '🧐' : '🐝'}
      </span>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">
        {isTricky ? 'Tricky Words' : 'Spelling Bee'}
      </h1>
      <p className="mt-2 text-lg text-ink-muted">
        {isTricky
          ? canStart
            ? 'The ones that got away. No lives to lose: spell one right and it’s off the list.'
            : 'Nothing on the list. Misspell a word in the Bee and it’ll wait for you here.'
          : 'Listen carefully and spell it right. No autocorrect to save you now.'}
      </p>

      {!isTricky && (
        <ul className={`${cardClasses} mt-6 space-y-3 p-5 text-left`}>
          <li className="flex gap-3">
            <Volume2 className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
            <span>
              <strong>Listen.</strong> Hear the word as often as you like, slowly if need be.
            </span>
          </li>
          <li className="flex gap-3">
            <Lightbulb className="mt-0.5 size-5 shrink-0 text-spark" aria-hidden="true" />
            <span>
              <strong>Clues.</strong> The meaning and a sentence are free. A letter costs a quarter
              of the word’s points.
            </span>
          </li>
          <li className="flex gap-3">
            <TrendingUp className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
            <span>
              <strong>Three rounds.</strong> {BEE_ROUNDS[1]}, {BEE_ROUNDS[2]}, then {BEE_ROUNDS[3]},
              which lasts as long as you do.
            </span>
          </li>
          <li className="flex gap-3">
            <Heart className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
            <span>
              <strong>Three lives.</strong> A misspelling costs one, and shows you where it went
              wrong.
            </span>
          </li>
        </ul>
      )}

      {!speechSupported && <NoSpeechNote className="mt-4" />}

      {!isTricky && best > 0 && (
        <p className="mt-5 text-ink-muted">
          Your best: <strong className="text-ink tabular-nums">{best}</strong>{' '}
          <span aria-hidden="true">{beeTitle(best).emoji}</span>
        </p>
      )}

      {!isTricky && tricky > 0 && (
        <ButtonLink to="/play/bee/tricky" variant="soft" className="mt-4">
          {tricky} tricky {tricky === 1 ? 'word' : 'words'} to go back to{' '}
          <ArrowRight className="size-4" aria-hidden="true" />
        </ButtonLink>
      )}

      <StickyActionBar>
        {canStart ? (
          <Button size="lg" className="w-full" onClick={onStart}>
            <Play className="size-5" aria-hidden="true" />{' '}
            {isTricky ? 'Have another go' : 'Start the Bee'}
          </Button>
        ) : (
          <ButtonLink to="/play/bee" size="lg" className="w-full">
            To the Bee
          </ButtonLink>
        )}
      </StickyActionBar>
    </div>
  );
}

function NoSpeechNote({ className = '' }: { className?: string }) {
  return (
    <p
      className={`flex items-start gap-2 rounded-2xl bg-surface-2 p-3 text-left text-sm ${className}`}
    >
      <VolumeX className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>
        This browser can’t read words aloud, so you’ll get the meaning, a sentence and the number of
        letters instead. Tougher, but doable.
      </span>
    </p>
  );
}

function Round({
  state,
  speech,
  dispatch,
}: {
  state: BeeState;
  speech: SpeechState;
  dispatch: (action: BeeAction) => void;
}) {
  const settings = useRequiredSettings();
  const word = state.queue[state.index]!;
  const entry = getWord(word.wordId)!;
  const [sentenceFor, setSentenceFor] = useState<string>();
  const lockedUntil = useRef(0);
  const checked = state.status === 'checked';
  const isBee = state.mode === 'bee';

  const clue = maskWord(entry.definition, entry);
  const example = blankedExample(entry, settings.roles);
  const showSentence = !speech.supported || sentenceFor === word.wordId;
  const revealsLeft = maxReveals(word.term) - state.reveals;
  const canReveal = revealsLeft > 0 && state.typed !== word.term;

  const check = () => {
    if (!state.typed) return;
    lockedUntil.current = performance.now() + NEXT_LOCK_MS;
    dispatch({ type: 'check' });
  };

  const next = () => {
    if (performance.now() < lockedUntil.current) return;
    // Speak from inside the tap: iPhones won't start speech without one.
    const upcoming = state.lives > 0 ? state.queue[state.index + 1] : undefined;
    if (upcoming) speech.say(upcoming.term);
    dispatch({ type: 'next' });
  };

  // Buzz for the result as soon as it's in.
  const answered = state.results.length;
  const lastResult = state.results.at(-1);
  useEffect(() => {
    if (lastResult) haptic(lastResult.correct ? HAPTIC.success : HAPTIC.error);
  }, [answered, lastResult]);

  // A physical keyboard, for anyone playing at a desk.
  const latest = useRef({ check, next });
  useEffect(() => {
    latest.current = { check, next };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // Let a button the learner has tabbed to answer to Enter, as usual.
      const onControl = e.target instanceof Element && e.target.closest('a, button');
      if (e.key === 'Enter') {
        if (e.repeat || onControl) return;
        e.preventDefault();
        if (checked) latest.current.next();
        else latest.current.check();
      } else if (!checked && e.key === 'Backspace') {
        dispatch({ type: 'backspace' });
      } else if (!checked && /^[a-z]$/i.test(e.key)) {
        dispatch({ type: 'letter', letter: e.key });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [checked, dispatch]);

  return (
    <div className="mx-auto max-w-xl pb-40">
      <h1 className="sr-only">{isBee ? 'Spelling Bee' : 'Tricky Words'}</h1>
      <div className="flex items-center gap-3">
        <Link
          to={isBee ? '/practice' : '/play/bee'}
          aria-label={isBee ? 'Stop and return to Practice' : 'Stop and return to the Spelling Bee'}
          className="-ml-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-muted active:bg-surface-2"
        >
          <X className="size-6" aria-hidden="true" />
        </Link>
        {isBee && (
          <p className="flex gap-0.5" aria-label={`${state.lives} of ${BEE_LIVES} lives left`}>
            {Array.from({ length: BEE_LIVES }, (_, i) => (
              <Heart
                key={i}
                className={`size-6 transition ${i < state.lives ? 'fill-danger text-danger' : 'text-line'}`}
                aria-hidden="true"
              />
            ))}
          </p>
        )}
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

      <p className="mt-1 flex min-h-7 items-center justify-between text-sm font-semibold text-ink-muted">
        {isBee ? (
          <span key={word.tier} className="animate-pop">
            Round {word.tier}: {BEE_ROUNDS[word.tier]}
          </span>
        ) : (
          <span>
            Word {state.index + 1} of {state.queue.length}
          </span>
        )}
        {state.run >= 3 && (
          <span className="rounded-full bg-spark/20 px-3 py-0.5">🔥 {state.run} in a row</span>
        )}
      </p>

      {checked && lastResult ? (
        <Feedback
          result={lastResult}
          index={state.index}
          outOfLives={isBee && state.lives <= 0}
          isLast={state.index >= state.queue.length - 1}
          speech={speech}
          onNext={next}
        />
      ) : (
        <>
          <section className={`${cardClasses} mt-2 animate-rise p-5`} key={word.wordId}>
            {speech.supported ? (
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onMouseDown={keepFocus}
                  onClick={() => speech.say(word.term)}
                  className="flex h-16 flex-1 touch-manipulation items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-semibold text-brand-ink transition active:scale-[0.97]"
                >
                  <Volume2 className="size-6" aria-hidden="true" /> Hear the word
                </button>
                <button
                  type="button"
                  aria-label="Hear it slowly"
                  title="Hear it slowly"
                  onMouseDown={keepFocus}
                  onClick={() => speech.say(word.term, { rate: SLOW_RATE })}
                  className="flex size-16 shrink-0 touch-manipulation items-center justify-center rounded-2xl bg-brand-soft text-brand transition active:scale-[0.97]"
                >
                  <Snail className="size-6" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <p className="font-display text-xl font-semibold">{word.term.length} letters</p>
            )}

            <h2
              className={`text-xs font-bold tracking-widest text-ink-muted uppercase ${speech.supported ? 'mt-4' : 'mt-3'}`}
            >
              It means
            </h2>
            <p className="mt-1 text-pretty">{clue}</p>

            {example && showSentence && (
              <>
                <h2 className="mt-3 text-xs font-bold tracking-widest text-ink-muted uppercase">
                  In a sentence
                </h2>
                <p className="mt-1 animate-rise text-pretty">
                  <SentenceWithGap text={maskWord(example.sentence, entry)} />
                </p>
              </>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {example && !showSentence && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="touch-manipulation"
                  onMouseDown={keepFocus}
                  onClick={() => {
                    setSentenceFor(word.wordId);
                    // Read out in full, as a bee's pronouncer would.
                    speech.say(example.solution);
                  }}
                >
                  <MessageSquareQuote className="size-4" aria-hidden="true" /> Use it in a sentence
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="touch-manipulation"
                disabled={!canReveal}
                onMouseDown={keepFocus}
                onClick={() => dispatch({ type: 'reveal' })}
              >
                <Lightbulb className="size-4" aria-hidden="true" /> Give me a letter (−
                {REVEAL_PENALTY * 100}%)
              </Button>
            </div>
          </section>

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-bg/95 px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md">
            <div className="mx-auto max-w-xl">
              <Answer typed={state.typed} american={state.american} />
              <BeeKeyboard
                canCheck={state.typed.length > 0}
                onLetter={(letter) => dispatch({ type: 'letter', letter })}
                onBackspace={() => dispatch({ type: 'backspace' })}
                onCheck={check}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Answer({ typed, american }: { typed: string; american: boolean }) {
  return (
    <div className="px-3 pb-2 text-center">
      <div role="status" className="flex min-h-11 items-center justify-center">
        <span className="sr-only">
          {typed ? `Your spelling: ${[...typed].join(' ')}` : 'Nothing typed yet'}
        </span>
        <span
          aria-hidden="true"
          className={`font-display font-semibold tracking-wide break-all ${typed.length > 14 ? 'text-2xl' : 'text-3xl'}`}
        >
          {typed || <span className="text-xl font-normal text-ink-muted">Spell it here</span>}
          <span className="ml-0.5 inline-block h-[0.9em] w-0.5 translate-y-[0.1em] animate-pulse bg-brand" />
        </span>
      </div>
      {american && (
        <p role="status" className="animate-pop text-sm font-semibold text-brand">
          That’s the American spelling. No harm done: try it the British way.
        </p>
      )}
    </div>
  );
}

function Letters({ letters, label }: { letters: DiffLetter[]; label: string }) {
  return (
    <span aria-label={label} className="break-all">
      {letters.map(({ letter, ok }, i) => (
        <span
          key={i}
          className={ok ? '' : 'rounded bg-danger/15 font-bold text-danger underline'}
          aria-hidden="true"
        >
          {letter}
        </span>
      ))}
    </span>
  );
}

function Feedback({
  result,
  index,
  outOfLives,
  isLast,
  speech,
  onNext,
}: {
  result: BeeResult;
  index: number;
  outOfLives: boolean;
  isLast: boolean;
  speech: SpeechState;
  onNext: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const entry = getWord(result.wordId)!;
  const diff = spellingDiff(result.typed, result.term);
  const lines = result.correct ? PRAISE : COMMISERATIONS;

  useEffect(() => headingRef.current?.focus(), []);

  return (
    <>
      <section
        className={`${cardClasses} mt-2 p-5 ${result.correct ? 'animate-pop' : 'animate-shake'}`}
      >
        <h2
          ref={headingRef}
          tabIndex={-1}
          className={`text-lg font-bold outline-none ${result.correct ? 'text-success' : 'text-danger'}`}
        >
          {lines[index % lines.length]}
          {result.correct && ` +${result.points}`}
        </h2>

        {!result.correct && (
          <p className="mt-2 text-ink-muted">
            You wrote{' '}
            <span className="font-display text-lg font-semibold text-ink">
              <Letters letters={diff.typed} label={result.typed} />
            </span>
          </p>
        )}

        <div className="mt-2 flex items-center gap-3">
          <p className="min-w-0 flex-1 font-display text-3xl font-semibold tracking-wide">
            {result.correct ? result.term : <Letters letters={diff.term} label={result.term} />}
          </p>
          {speech.supported && (
            <button
              type="button"
              aria-label={`Hear “${result.term}” again`}
              onMouseDown={keepFocus}
              onClick={() => speech.say(result.term)}
              className="inline-flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-full bg-brand-soft text-brand active:scale-95"
            >
              <Volume2 className="size-5" aria-hidden="true" />
            </button>
          )}
        </div>
        <p className="text-sm text-ink-muted">{entry.ipa}</p>
        <p className="mt-3 text-pretty">{entry.definition}</p>
        {entry.origin && <p className="mt-2 text-sm text-pretty text-ink-muted">{entry.origin}</p>}
      </section>
      {/* Outside the card: its animation's transform would trap a fixed bar inside it. */}
      <StickyActionBar>
        <Button
          size="lg"
          className="w-full touch-manipulation"
          onMouseDown={keepFocus}
          onClick={onNext}
        >
          {outOfLives || isLast ? 'See how you did' : 'Next word'}{' '}
          <ArrowRight className="size-5" aria-hidden="true" />
        </Button>
      </StickyActionBar>
    </>
  );
}

function Results({
  state,
  previousBest,
  onAgain,
}: {
  state: BeeState;
  previousBest: number;
  onAgain: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const saved = useRef(false);
  const isBee = state.mode === 'bee';
  const correct = state.results.filter((r) => r.correct).length;
  const missed = state.results.filter((r) => !r.correct);
  const newBest = isBee && state.score > previousBest && state.score > 0;
  const { title, emoji } = isBee
    ? beeTitle(state.score)
    : missed.length === 0
      ? { title: 'All sorted', emoji: '🎉' }
      : { title: 'Getting there', emoji: '🧐' };

  useEffect(() => {
    headingRef.current?.focus();
    if (saved.current) return;
    saved.current = true;
    haptic(HAPTIC.success);
    recordGameScore({
      game: isBee ? 'bee' : 'bee-tricky',
      score: state.score,
      correct,
      answered: state.results.length,
      bestCombo: state.bestRun,
      words: state.results.map(({ wordId, correct: right }) => ({ wordId, correct: right })),
    }).catch((error: unknown) => console.error('Could not save score', error));
  }, [state, correct, isBee]);

  const message = !isBee
    ? missed.length === 0
      ? 'Every one spelt right, and off the list.'
      : `${correct} off the list. The rest will keep.`
    : newBest
      ? previousBest > 0
        ? `New personal best! (was ${previousBest})`
        : 'Your first score. Now beat it!'
      : state.lives <= 0
        ? 'Out of lives. One more go?'
        : 'You’ve spelt every word we’ve got. Blimey.';

  return (
    <div className="mx-auto max-w-xl pt-6 text-center">
      {(newBest || (!isBee && missed.length === 0)) && <Confetti seed={state.score} />}
      <span className="block animate-pop text-6xl" aria-hidden="true">
        {emoji}
      </span>
      <p className="mt-3 text-sm font-bold tracking-widest text-ink-muted uppercase">{title}</p>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-1 font-display text-6xl font-semibold tracking-tight tabular-nums outline-none"
      >
        {isBee ? state.score : `${correct}/${state.results.length}`}
        <span className="sr-only">{isBee ? ' points' : ' spelt right'}</span>
      </h1>
      <p className="mt-2 text-lg text-ink-muted">{message}</p>

      {isBee && (
        <dl className="mt-6 grid grid-cols-3 gap-2">
          {[
            ['Spelt right', `${correct}/${state.results.length}`],
            ['Best run', String(state.bestRun)],
            ['Personal best', String(Math.max(previousBest, state.score))],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-surface-2 p-3">
              <dt className="text-xs font-medium text-ink-muted">{label}</dt>
              <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {missed.length > 0 && (
        <section
          aria-labelledby="bee-missed"
          className={`${cardClasses} mt-6 animate-rise p-5 text-left`}
        >
          <h2 id="bee-missed" className="font-semibold">
            Words to remember
          </h2>
          <ul className="mt-3 space-y-2">
            {missed.map(({ wordId, term, typed }) => {
              const diff = spellingDiff(typed, term);
              return (
                <li key={wordId} className="rounded-2xl bg-surface-2 p-3 text-sm">
                  <span className="font-display text-lg font-semibold">
                    <Letters letters={diff.term} label={term} />
                  </span>
                  <span className="block text-ink-muted">
                    You wrote <Letters letters={diff.typed} label={typed} />
                  </span>
                </li>
              );
            })}
          </ul>
          {isBee && (
            <ButtonLink to="/play/bee/tricky" variant="soft" size="sm" className="mt-3">
              Have another go at these <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          )}
        </section>
      )}

      <ButtonLink to={isBee ? '/practice' : '/play/bee'} variant="ghost" className="mt-6">
        {isBee ? 'Back to Practice' : 'Back to the Bee'}{' '}
        <ArrowRight className="size-4" aria-hidden="true" />
      </ButtonLink>

      <StickyActionBar>
        <Button size="lg" className="w-full" onClick={onAgain}>
          <RotateCcw className="size-5" aria-hidden="true" />{' '}
          {isBee ? 'Play again' : missed.length > 0 ? 'Have another go' : 'Back to the list'}
        </Button>
      </StickyActionBar>
    </div>
  );
}
