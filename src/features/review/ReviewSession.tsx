import { ChevronDown, Eye, RotateCcw, X } from 'lucide-react';
import { type MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';

import { StickyActionBar } from '../../components/layout/StickyActionBar';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { cardClasses } from '../../components/ui/styles';
import { HighlightedText } from '../../components/word/HighlightedText';
import { WordDetails } from '../../components/word/WordDetails';
import { WordHeader } from '../../components/word/WordHeader';
import { getWord } from '../../data';
import type { CardRecord } from '../../db/db';
import { recordReview } from '../../db/progress';
import { useReviews } from '../../hooks/useProgress';
import { useSpeech } from '../../hooks/useSpeech';
import { examplesForRoles } from '../../lib/examples';
import { HAPTIC, haptic } from '../../lib/haptics';
import { formatInterval, type Grade, GRADES, needsRepeat, review } from '../../lib/sm2';
import { useRequiredSettings } from '../../state/settingsContext';
import type { Role } from '../../types/content';
import { NothingDue, ReviewDone } from './ReviewDone';
import { REVIEW_SESSION_MAX, type Tally } from './session';

const GRADE_STYLES: Record<Grade, { label: string; key: string; className: string }> = {
  again: { label: 'Again', key: '1', className: 'border-danger/50 bg-danger-soft' },
  hard: { label: 'Hard', key: '2', className: 'border-spark/60 bg-spark/15' },
  good: { label: 'Good', key: '3', className: 'border-brand/50 bg-brand-soft' },
  easy: { label: 'Easy', key: '4', className: 'border-success/50 bg-success-soft' },
};

interface QueueItem {
  card: CardRecord;
  /** A same-session repeat of a word graded Again or Hard (SM-2 step 7); doesn't reschedule. */
  repeat: boolean;
}

function isInteractive(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.closest('input, textarea, select, button, a, [role="button"]') !== null)
  );
}

/** Snapshots today's due cards when opened; "review more" starts a fresh round. */
export function ReviewSession() {
  const settings = useRequiredSettings();
  const reviews = useReviews();
  const [round, setRound] = useState(0);
  const [initial, setInitial] = useState<CardRecord[]>();

  // Take the queue once per round, so cards don't vanish mid-session as they're rescheduled.
  if (reviews && initial === undefined) setInitial(reviews.due.slice(0, REVIEW_SESSION_MAX));
  if (!reviews || !initial) return <p className="sr-only">Loading…</p>;

  if (initial.length === 0) return <NothingDue dueTomorrow={reviews.dueTomorrow} />;

  return (
    <Session
      key={round}
      initial={initial}
      roles={settings.roles}
      moreDue={reviews.due.length}
      dueTomorrow={reviews.dueTomorrow}
      onMore={() => {
        setInitial(undefined);
        setRound((r) => r + 1);
      }}
    />
  );
}

function Session({
  initial,
  roles,
  moreDue,
  dueTomorrow,
  onMore,
}: {
  initial: CardRecord[];
  roles: readonly Role[];
  moreDue: number;
  dueTomorrow: number;
  onMore: () => void;
}) {
  const { say } = useSpeech();
  const [queue, setQueue] = useState<QueueItem[]>(() =>
    initial.map((card) => ({ card, repeat: false })),
  );
  const [finished, setFinished] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [tally, setTally] = useState<Tally>({ again: 0, hard: 0, good: 0, easy: 0 });
  const busy = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const current = queue[0];
  const word = current ? getWord(current.card.wordId) : undefined;

  const reveal = useCallback(() => {
    haptic(HAPTIC.tap);
    setRevealed(true);
  }, []);

  const grade = useCallback(
    async (g: Grade) => {
      if (!current || busy.current) return;
      busy.current = true;
      try {
        if (!current.repeat) {
          await recordReview(current.card.wordId, g);
          setTally((t) => ({ ...t, [g]: t[g] + 1 }));
        }
      } catch (error) {
        console.error('Could not save review', error);
      } finally {
        busy.current = false;
      }
      const again = current.repeat ? g === 'again' : needsRepeat(g);
      haptic(again ? HAPTIC.tap : HAPTIC.success);
      setQueue(([head, ...rest]) => (again && head ? [...rest, { ...head, repeat: true }] : rest));
      if (!again) setFinished((n) => n + 1);
      setRevealed(false);
      setExpanded(false);
      window.scrollTo({ top: 0 });
    },
    [current],
  );

  useEffect(() => {
    cardRef.current?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }, [revealed, current]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isInteractive(e.target) || !word || !current)
        return;
      if (!revealed && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        reveal();
      } else if (revealed && current.repeat) {
        if (e.key === '1') void grade('again');
        else if (['2', '3', '4', 'Enter'].includes(e.key)) void grade('good');
      } else if (revealed) {
        const match = GRADES.find((g) => GRADE_STYLES[g].key === e.key);
        if (match) void grade(match);
      }
      if (e.key.toLowerCase() === 's') say(word.term);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [word, current, revealed, reveal, grade, say]);

  if (!current) {
    return <ReviewDone tally={tally} moreDue={moreDue} dueTomorrow={dueTomorrow} onMore={onMore} />;
  }
  // useReviews only returns cards for words in the dataset, so this is just for the type checker.
  if (!word) return null;

  const total = finished + queue.length;
  const examples = examplesForRoles(word, roles, { min: 2, max: 2 });

  const onCardClick = (e: MouseEvent) => {
    if (!revealed && !isInteractive(e.target)) reveal();
  };

  return (
    <>
      <div className="sticky top-0 z-30 -mx-4 mb-4 flex items-center gap-3 bg-bg/90 px-4 py-2 backdrop-blur">
        <Link
          to="/"
          aria-label="Close and return to Today"
          className="-ml-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-muted active:bg-surface-2"
        >
          <X className="size-6" aria-hidden="true" />
        </Link>
        <ProgressBar value={finished} max={total} label="Review progress" className="flex-1" />
        <span className="min-w-12 text-right text-sm font-semibold text-ink-muted tabular-nums">
          {queue.length} left
        </span>
      </div>

      <h1 className="sr-only">Review</h1>

      {current.repeat && (
        <p className="mb-3 flex animate-pop items-center justify-center gap-1.5 text-sm font-semibold text-ink-muted">
          <RotateCcw className="size-4" aria-hidden="true" /> Once more, to make it stick
        </p>
      )}

      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- convenience tap target; Space key and the Reveal button cover keyboard use */}
      <div
        key={`${revealed ? 'back' : 'front'}-${word.id}-${finished}-${queue.length}`}
        ref={cardRef}
        onClick={onCardClick}
        className={`${cardClasses} p-5 sm:p-8 ${
          revealed ? 'animate-flip-in' : 'animate-rise cursor-pointer select-none'
        }`}
      >
        <WordHeader word={word} />
        {!revealed ? (
          <div className="mt-8 flex min-h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line p-6 text-center">
            <span className="text-4xl" aria-hidden="true">
              💭
            </span>
            <p className="mt-3 font-medium">What does it mean?</p>
            <p className="mt-1 text-sm text-ink-muted">
              Say it in your own words, or use it in a sentence. Then tap to check.
            </p>
          </div>
        ) : expanded ? (
          <div className="mt-5" aria-live="polite">
            <WordDetails word={word} roles={roles} />
          </div>
        ) : (
          <div className="mt-5" aria-live="polite">
            <p className="text-lg leading-relaxed text-pretty">{word.definition}</p>
            {examples.map((e, i) => (
              <p
                key={e.text}
                className={`${i === 0 ? 'mt-4' : 'mt-2'} rounded-2xl bg-surface-2 p-4 leading-relaxed`}
              >
                <HighlightedText text={e.text} entry={word} />
              </p>
            ))}
            <button
              type="button"
              aria-expanded={false}
              onClick={() => setExpanded(true)}
              className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink-muted"
            >
              More about this word <ChevronDown className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {revealed && (
        <p className="mt-4 text-center text-sm text-ink-muted">
          {current.repeat ? 'Got it this time?' : 'How well did you remember it?'}
        </p>
      )}
      <p className="mt-2 hidden text-center text-xs text-ink-muted pointer-fine:sm:block">
        <kbd className="rounded border border-line px-1.5 py-0.5 font-sans">Space</kbd> reveal ·{' '}
        <kbd className="rounded border border-line px-1.5 py-0.5 font-sans">1</kbd>–
        <kbd className="rounded border border-line px-1.5 py-0.5 font-sans">4</kbd> grade ·{' '}
        <kbd className="rounded border border-line px-1.5 py-0.5 font-sans">S</kbd> hear it
      </p>

      <StickyActionBar label="Grade your answer">
        {!revealed ? (
          <Button size="lg" className="w-full" onClick={reveal}>
            <Eye className="size-5" aria-hidden="true" /> Reveal
          </Button>
        ) : current.repeat ? (
          <div className="grid w-full grid-cols-2 gap-2">
            <GradeButton grade="again" label="Not yet" onGrade={grade} />
            <GradeButton grade="good" label="Got it" onGrade={grade} />
          </div>
        ) : (
          <div className="grid w-full grid-cols-4 gap-2">
            {GRADES.map((g) => (
              <GradeButton
                key={g}
                grade={g}
                interval={formatInterval(review(current.card, g).interval)}
                onGrade={grade}
              />
            ))}
          </div>
        )}
      </StickyActionBar>
    </>
  );
}

function GradeButton({
  grade,
  label = GRADE_STYLES[grade].label,
  interval,
  onGrade,
}: {
  grade: Grade;
  label?: string;
  interval?: string;
  onGrade: (g: Grade) => Promise<void>;
}) {
  return (
    <button
      type="button"
      onClick={() => void onGrade(grade)}
      aria-label={interval ? `${label}, next review in ${interval}` : label}
      className={`flex min-h-16 flex-col items-center justify-center rounded-2xl border-2 px-1 py-2 text-ink transition active:scale-[0.96] ${GRADE_STYLES[grade].className}`}
    >
      <span className="font-semibold">{label}</span>
      {interval && <span className="text-xs text-ink-muted tabular-nums">{interval}</span>}
    </button>
  );
}
