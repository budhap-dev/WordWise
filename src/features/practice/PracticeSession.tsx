import { ArrowRight, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router';

import { StickyActionBar } from '../../components/layout/StickyActionBar';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { CONFUSABLES, REGISTER_PAIRS, WORDS } from '../../data';
import { recordAttempt } from '../../db/progress';
import { sessionsToday, useAttempts, useEligibleWords } from '../../hooks/usePractice';
import { useCards } from '../../hooks/useProgress';
import { toDateKey } from '../../lib/date';
import { HAPTIC, haptic } from '../../lib/haptics';
import { buildSession, practicePool } from '../../lib/practice/session';
import type { Question, SessionMode } from '../../lib/practice/types';
import { hashString, seededRandom } from '../../lib/random';
import { useRequiredSettings } from '../../state/settingsContext';
import { ChoiceQuestionView } from './ChoiceQuestionView';
import { type ModeInfo, modeInfo } from './modes';
import { PracticeResults } from './PracticeResults';
import { WriteQuestionView } from './WriteQuestionView';

/** Enough words for any session, including the mixed bag (which uses each word once). */
const MIN_POOL = 24;

export interface Answer {
  question: Question;
  correct: boolean;
}

/** `/practice/:mode`: waits for saved progress, then starts a session. */
export function PracticeSession() {
  const { mode = '' } = useParams();
  const info = modeInfo(mode);
  const cards = useCards();
  const attempts = useAttempts();
  const [round, setRound] = useState(0);
  // Snapshot "sessions so far today" once, so the questions don't change as answers are saved.
  const [started, setStarted] = useState<number>();
  if (attempts && info && started === undefined) setStarted(sessionsToday(attempts, info.mode));

  if (!info) return <Navigate to="/practice" replace />;
  if (!cards || started === undefined) return <p className="sr-only">Loading…</p>;

  const sessionId = `${toDateKey()}:${info.mode}:${started}:${round}`;
  return (
    <Runner
      key={sessionId}
      sessionId={sessionId}
      info={info}
      cards={cards}
      onAgain={() => setRound((r) => r + 1)}
    />
  );
}

function Runner({
  sessionId,
  info,
  cards,
  onAgain,
}: {
  sessionId: string;
  info: ModeInfo;
  cards: { wordId: string; ease: number; lapses: number }[];
  onAgain: () => void;
}) {
  const settings = useRequiredSettings();
  const eligible = useEligibleWords(settings);
  const [questions] = useState(() => {
    const random = seededRandom(hashString(sessionId));
    const pool = practicePool(cards, eligible, WORDS, MIN_POOL, random).words;
    return buildSession({
      mode: info.mode,
      pool,
      allWords: WORDS,
      confusables: CONFUSABLES,
      registerPairs: REGISTER_PAIRS,
      roles: settings.roles,
      random,
    });
  });
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const question = questions[index];
  const answered = answers.length > index;
  const finished = index >= questions.length;

  const inARow = useMemo(() => {
    let n = 0;
    for (let i = answers.length - 1; i >= 0 && answers[i]!.correct; i--) n++;
    return n;
  }, [answers]);

  const onAnswer = useCallback(
    (correct: boolean) => {
      if (!question || answers.length > index) return;
      haptic(correct ? HAPTIC.success : HAPTIC.error);
      setAnswers((a) => [...a, { question, correct }]);
      recordAttempt({
        sessionId,
        sessionMode: info.mode as SessionMode,
        mode: question.mode,
        itemId: question.itemId,
        wordId: question.wordId,
        correct,
      }).catch((error: unknown) => console.error('Could not save attempt', error));
    },
    [question, answers.length, index, sessionId, info.mode],
  );

  const next = useCallback(() => {
    haptic(HAPTIC.tap);
    setIndex((i) => i + 1);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLTextAreaElement;
      if (answered && !typing && (e.key === 'Enter' || e.key === 'ArrowRight')) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answered, next]);

  if (finished) {
    return <PracticeResults info={info} answers={answers} onAgain={onAgain} />;
  }
  if (!question) return null;

  return (
    <>
      <div className="sticky top-0 z-30 -mx-4 mb-4 flex items-center gap-3 bg-bg/90 px-4 py-2 backdrop-blur">
        <Link
          to="/practice"
          aria-label="Close and return to Practice"
          className="-ml-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-muted active:bg-surface-2"
        >
          <X className="size-6" aria-hidden="true" />
        </Link>
        <ProgressBar
          value={answers.length}
          max={questions.length}
          label="Practice progress"
          className="flex-1"
        />
        <span className="min-w-12 text-right text-sm font-semibold text-ink-muted tabular-nums">
          {index + 1}/{questions.length}
        </span>
      </div>

      <h1 className="sr-only">{info.title}</h1>
      {inARow >= 3 && (
        <p
          key={inARow}
          className="mb-3 flex animate-pop justify-center text-sm font-semibold"
          aria-live="polite"
        >
          <span className="rounded-full bg-spark/20 px-3 py-1">🔥 {inARow} in a row!</span>
        </p>
      )}

      {question.kind === 'choice' ? (
        <ChoiceQuestionView key={question.id} question={question} onAnswer={onAnswer} />
      ) : (
        <WriteQuestionView key={question.id} question={question} onAnswer={onAnswer} />
      )}

      {answered && (
        <StickyActionBar>
          <Button size="lg" className="w-full" onClick={next}>
            {index + 1 < questions.length ? 'Next' : 'See how you did'}
            <ArrowRight className="size-5" aria-hidden="true" />
          </Button>
        </StickyActionBar>
      )}
    </>
  );
}
