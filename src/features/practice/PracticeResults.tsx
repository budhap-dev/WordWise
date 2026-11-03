import { ArrowRight, RotateCcw } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { StickyActionBar } from '../../components/layout/StickyActionBar';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Confetti } from '../../components/ui/Confetti';
import { cardClasses } from '../../components/ui/styles';
import type { Question } from '../../lib/practice/types';
import type { ModeInfo } from './modes';
import type { Answer } from './PracticeSession';

function verdict(ratio: number) {
  if (ratio === 1) return { emoji: '🏆', text: 'A perfect score. Absolutely top drawer.' };
  if (ratio >= 0.8) return { emoji: '🌟', text: 'Cracking work. Nearly flawless.' };
  if (ratio >= 0.5)
    return { emoji: '👍', text: 'Not bad at all, and that’s high praise round here.' };
  return { emoji: '🌱', text: 'A tricky one. Every miss now is a word you’ll remember later.' };
}

/** What the learner should have picked, for the "to look at again" list. */
function correctAnswer(q: Question): string {
  if (q.kind === 'write') return q.model;
  if (q.solution) return q.solution;
  return q.options[q.answer]!;
}

function promptText(q: Question): string {
  if (q.kind === 'write') return q.plain;
  return q.prompt;
}

export function PracticeResults({
  info,
  answers,
  onAgain,
}: {
  info: ModeInfo;
  answers: Answer[];
  onAgain: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const correct = answers.filter((a) => a.correct).length;
  const ratio = answers.length ? correct / answers.length : 0;
  const { emoji, text } = verdict(ratio);
  const missed = answers.filter((a) => !a.correct);

  useEffect(() => headingRef.current?.focus(), []);

  return (
    <div className="mx-auto max-w-xl pt-6 text-center">
      {ratio >= 0.8 && <Confetti seed={correct + 3} />}
      <span className="block animate-pop text-6xl" aria-hidden="true">
        {emoji}
      </span>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-4 font-display text-4xl font-semibold tracking-tight outline-none"
      >
        {correct} out of {answers.length}
      </h1>
      <p className="mt-2 text-lg text-ink-muted">{text}</p>
      <p className="mt-1 text-sm text-ink-muted">{info.title}</p>

      {missed.length > 0 && (
        <section
          aria-labelledby="missed-heading"
          className={`${cardClasses} mt-8 animate-rise p-6 text-left`}
        >
          <h2 id="missed-heading" className="font-semibold">
            Worth another look
          </h2>
          <ul className="mt-3 space-y-3">
            {missed.map(({ question: q }) => (
              <li key={q.id} className="rounded-2xl bg-surface-2 p-4 text-sm">
                <p className="text-ink-muted">{promptText(q).replace('___', '…')}</p>
                <p className="mt-1 font-semibold">{correctAnswer(q)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Button variant="secondary" className="mt-6" onClick={onAgain}>
        <RotateCcw className="size-4" aria-hidden="true" /> Another round
      </Button>

      <StickyActionBar>
        <ButtonLink to="/practice" size="lg" className="w-full">
          Back to Practice <ArrowRight className="size-5" aria-hidden="true" />
        </ButtonLink>
      </StickyActionBar>
    </div>
  );
}
