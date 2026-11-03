import { ArrowRight, ChevronsLeft, Eye, X } from 'lucide-react';
import { type MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';

import { StickyActionBar } from '../../components/layout/StickyActionBar';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { cardClasses } from '../../components/ui/styles';
import { WordDetails } from '../../components/word/WordDetails';
import { WordHeader } from '../../components/word/WordHeader';
import { useDailySet } from '../../hooks/useDailySet';
import { useSpeech } from '../../hooks/useSpeech';
import { useSwipe } from '../../hooks/useSwipe';
import { HAPTIC, haptic } from '../../lib/haptics';
import { useRequiredSettings } from '../../state/settingsContext';
import { useTodayProgress } from '../../state/todayProgress';
import { DoneForToday } from './DoneForToday';

function isInteractive(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.closest('input, textarea, select, button, a, [role="button"]') !== null)
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
  const cardRef = useRef<HTMLDivElement>(null);

  const word = words[index];
  const finished = index >= words.length;
  const isLast = index + 1 >= words.length;

  const reveal = useCallback(() => {
    if (!word) return;
    haptic(HAPTIC.tap);
    setRevealed(true);
    markSeen(word.id);
  }, [word, markSeen]);

  const next = useCallback(() => {
    haptic(isLast ? HAPTIC.success : HAPTIC.tap);
    setRevealed(false);
    setIndex((i) => i + 1);
    window.scrollTo({ top: 0 });
  }, [isLast]);

  const swipe = useSwipe({ onSwipeLeft: next, enabled: revealed });

  // Move focus to the new card's heading for keyboard and screen-reader users.
  useEffect(() => {
    cardRef.current?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }, [revealed, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isInteractive(e.target) || !word) return;
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

  // Tapping anywhere on the front of the card reveals it (keyboard users have Space and the button).
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

      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- convenience tap target; Space key and the Reveal button cover keyboard use */}
      <div
        key={`${revealed ? 'back' : 'front'}-${word.id}`}
        ref={cardRef}
        onClick={onCardClick}
        {...swipe.handlers}
        className={`${cardClasses} touch-pan-y p-5 select-none sm:p-8 ${
          revealed ? 'animate-flip-in' : 'animate-rise cursor-pointer'
        } ${swipe.dx === 0 ? 'transition-transform' : ''}`}
        style={
          swipe.dx
            ? {
                transform: `translateX(${swipe.dx}px) rotate(${swipe.dx / 25}deg)`,
                opacity: Math.max(0.5, 1 - Math.abs(swipe.dx) / 400),
              }
            : undefined
        }
      >
        <WordHeader word={word} />
        {revealed ? (
          <div className="mt-5 select-text" aria-live="polite">
            <WordDetails word={word} roles={settings.roles} />
          </div>
        ) : (
          <div className="mt-8 flex min-h-48 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line p-6 text-center">
            <span className="text-4xl" aria-hidden="true">
              🤔
            </span>
            <p className="mt-3 font-medium">Do you know it?</p>
            <p className="mt-1 text-sm text-ink-muted">
              Have a guess at the meaning, then tap to reveal.
            </p>
          </div>
        )}
      </div>

      {revealed && (
        <p className="mt-4 hidden items-center justify-center gap-1 text-sm text-ink-muted pointer-coarse:flex">
          <ChevronsLeft className="size-4" aria-hidden="true" />
          Swipe left for the next word
        </p>
      )}
      <p className="mt-4 hidden text-center text-xs text-ink-muted pointer-fine:sm:block">
        <kbd className="rounded border border-line px-1.5 py-0.5 font-sans">Space</kbd> reveal ·{' '}
        <kbd className="rounded border border-line px-1.5 py-0.5 font-sans">→</kbd> next ·{' '}
        <kbd className="rounded border border-line px-1.5 py-0.5 font-sans">S</kbd> hear it
      </p>

      <StickyActionBar>
        {revealed ? (
          <Button size="lg" className="w-full" onClick={next}>
            {isLast ? 'Finish' : 'Next word'}
            <ArrowRight className="size-5" aria-hidden="true" />
          </Button>
        ) : (
          <Button size="lg" className="w-full" onClick={reveal}>
            <Eye className="size-5" aria-hidden="true" /> Reveal
          </Button>
        )}
      </StickyActionBar>
    </>
  );
}
