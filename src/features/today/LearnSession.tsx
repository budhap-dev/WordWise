import { ArrowRight, Eye, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';

import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { cardClasses } from '../../components/ui/styles';
import { WordDetails } from '../../components/word/WordDetails';
import { WordHeader } from '../../components/word/WordHeader';
import { useDailySet } from '../../hooks/useDailySet';
import { useSpeech } from '../../hooks/useSpeech';
import { useRequiredSettings } from '../../state/settingsContext';
import { useTodayProgress } from '../../state/todayProgress';
import { DoneForToday } from './DoneForToday';

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName))
  );
}

export function LearnSession() {
  const settings = useRequiredSettings();
  const words = useDailySet(settings);
  const { seenIds, markSeen, reset } = useTodayProgress();
  const { say } = useSpeech();

  // Resume at the first word not yet explored today.
  const [index, setIndex] = useState(() => {
    const firstUnseen = words.findIndex((w) => !seenIds.includes(w.id));
    return firstUnseen === -1 ? words.length : firstUnseen;
  });
  const [revealed, setRevealed] = useState(false);
  const backHeadingRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);

  const word = words[index];
  const finished = index >= words.length;

  const reveal = useCallback(() => {
    if (!word) return;
    setRevealed(true);
    markSeen(word.id);
  }, [word, markSeen]);

  const next = useCallback(() => {
    setRevealed(false);
    setIndex((i) => i + 1);
  }, []);

  // Move focus sensibly as the card changes, for keyboard and screen-reader users.
  useEffect(() => {
    if (revealed) backHeadingRef.current?.querySelector<HTMLElement>('h2')?.focus();
    else frontRef.current?.querySelector<HTMLElement>('h2')?.focus();
  }, [revealed, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target) || !word) return;
      if ((e.key === ' ' || e.key === 'Enter') && !revealed) {
        e.preventDefault();
        reveal();
      } else if ((e.key === 'ArrowRight' || e.key === 'Enter') && revealed) {
        e.preventDefault();
        next();
      } else if (e.key.toLowerCase() === 's') {
        say(word.term);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [word, revealed, reveal, next, say]);

  if (finished) {
    return (
      <DoneForToday
        words={words}
        onAgain={() => {
          reset();
          setIndex(0);
        }}
      />
    );
  }
  if (!word) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center gap-3">
        <Link
          to="/"
          aria-label="Close and return to Today"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-2 hover:text-ink"
        >
          <X className="size-5" aria-hidden="true" />
        </Link>
        <ProgressBar
          value={index + (revealed ? 1 : 0)}
          max={words.length}
          label="Session progress"
          className="flex-1"
        />
        <span className="w-12 text-right text-sm font-semibold text-ink-muted tabular-nums">
          {index + 1}/{words.length}
        </span>
      </div>

      <h1 className="sr-only">Today's words</h1>

      {!revealed ? (
        <div
          key={`front-${word.id}`}
          ref={frontRef}
          className={`${cardClasses} animate-rise p-6 sm:p-8`}
        >
          <WordHeader word={word} />
          <div className="mt-10 rounded-2xl border border-dashed border-line p-6 text-center">
            <p className="text-ink-muted">
              Do you know it? Have a guess at the meaning, then reveal.
            </p>
            <Button className="mt-4" size="lg" onClick={reveal}>
              <Eye className="size-5" aria-hidden="true" /> Reveal
            </Button>
          </div>
        </div>
      ) : (
        <div
          key={`back-${word.id}`}
          ref={backHeadingRef}
          className={`${cardClasses} animate-flip-in p-6 sm:p-8`}
          aria-live="polite"
        >
          <WordHeader word={word} />
          <div className="mt-5">
            <WordDetails word={word} roles={settings.roles} />
          </div>
          <div className="mt-8 flex justify-end">
            <Button size="lg" onClick={next}>
              {index + 1 < words.length ? 'Next word' : 'Finish'}
              <ArrowRight className="size-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      <p className="mt-4 hidden text-center text-xs text-ink-muted sm:block">
        <kbd className="rounded border border-line px-1.5 py-0.5 font-sans">Space</kbd> reveal ·{' '}
        <kbd className="rounded border border-line px-1.5 py-0.5 font-sans">→</kbd> next ·{' '}
        <kbd className="rounded border border-line px-1.5 py-0.5 font-sans">S</kbd> hear it
      </p>
    </div>
  );
}
