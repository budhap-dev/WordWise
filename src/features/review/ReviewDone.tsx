import { ArrowRight, BrainCircuit, CalendarCheck, RotateCcw } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { StickyActionBar } from '../../components/layout/StickyActionBar';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Confetti } from '../../components/ui/Confetti';
import { cardClasses } from '../../components/ui/styles';
import type { Grade } from '../../lib/sm2';
import type { Tally } from './session';

const TALLY_LABELS: { grade: Grade; label: string; className: string }[] = [
  { grade: 'easy', label: 'Easy', className: 'bg-success-soft' },
  { grade: 'good', label: 'Good', className: 'bg-brand-soft' },
  { grade: 'hard', label: 'Hard', className: 'bg-spark/15' },
  { grade: 'again', label: 'Again', className: 'bg-danger-soft' },
];

function tomorrowLine(dueTomorrow: number) {
  if (dueTomorrow === 0)
    return 'Nothing is due tomorrow. Learn a few new words to keep things ticking over.';
  return `${dueTomorrow} ${dueTomorrow === 1 ? 'word is' : 'words are'} due tomorrow.`;
}

function useFocusOnMount() {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return ref;
}

export function ReviewDone({
  tally,
  moreDue,
  dueTomorrow,
  onMore,
}: {
  tally: Tally;
  moreDue: number;
  dueTomorrow: number;
  onMore: () => void;
}) {
  const headingRef = useFocusOnMount();
  const reviewed = tally.again + tally.hard + tally.good + tally.easy;
  const message =
    tally.again === 0 && tally.hard === 0
      ? 'Flawless. Your memory is on top form.'
      : tally.again === 0
        ? 'All remembered. The harder ones will come round a little sooner.'
        : 'Good effort. The ones that slipped will be back tomorrow, and they’ll stick.';

  return (
    <div className="mx-auto max-w-xl pt-6 text-center">
      <Confetti seed={11} />
      <div className="mx-auto flex size-24 animate-pop items-center justify-center rounded-full bg-brand-soft">
        <BrainCircuit className="size-11 text-brand" aria-hidden="true" />
      </div>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-6 animate-rise font-display text-4xl font-semibold tracking-tight outline-none"
      >
        Reviews done!
      </h1>
      <p className="mt-3 animate-rise text-lg text-ink-muted [animation-delay:120ms]">{message}</p>

      <section
        aria-labelledby="tally-heading"
        className={`${cardClasses} mt-8 animate-rise p-6 text-left [animation-delay:200ms]`}
      >
        <h2 id="tally-heading" className="font-semibold">
          {reviewed} {reviewed === 1 ? 'word' : 'words'} reviewed
        </h2>
        <ul className="mt-3 grid grid-cols-4 gap-2">
          {TALLY_LABELS.map(({ grade, label, className }) => (
            <li key={grade} className={`rounded-2xl p-3 text-center ${className}`}>
              <span className="block text-2xl font-semibold tabular-nums">{tally[grade]}</span>
              <span className="text-xs font-medium text-ink-muted">{label}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 flex gap-2 rounded-2xl bg-surface-2 p-4 text-sm">
          <CalendarCheck className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
          <span>{tomorrowLine(dueTomorrow)}</span>
        </p>
      </section>

      {moreDue > 0 && (
        <Button variant="secondary" className="mt-6" onClick={onMore}>
          <RotateCcw className="size-4" aria-hidden="true" /> Review {moreDue} more
        </Button>
      )}

      <StickyActionBar>
        <ButtonLink to="/" size="lg" className="w-full">
          Back to Today <ArrowRight className="size-5" aria-hidden="true" />
        </ButtonLink>
      </StickyActionBar>
    </div>
  );
}

export function NothingDue({ dueTomorrow }: { dueTomorrow: number }) {
  const headingRef = useFocusOnMount();
  return (
    <div className="mx-auto max-w-xl pt-10 text-center">
      <span className="block animate-pop text-6xl" aria-hidden="true">
        🧘
      </span>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-6 font-display text-3xl font-semibold tracking-tight outline-none"
      >
        Nothing to review right now
      </h1>
      <p className="mt-3 text-ink-muted">
        Words you learn come back here just before you’d forget them. {tomorrowLine(dueTomorrow)}
      </p>
      <StickyActionBar>
        <ButtonLink to="/" size="lg" className="w-full">
          Back to Today <ArrowRight className="size-5" aria-hidden="true" />
        </ButtonLink>
      </StickyActionBar>
    </div>
  );
}
