import { Check, X } from 'lucide-react';
import { Fragment, useEffect, useRef, useState } from 'react';

import { cardClasses } from '../../components/ui/styles';
import { SpeakButton } from '../../components/word/SpeakButton';
import type { ChoiceQuestion } from '../../lib/practice/types';

const RIGHT = ['Spot on!', 'Nailed it.', 'Lovely.', 'Exactly right.', 'Top marks.'];
const WRONG = ['Not quite.', 'Close, but no.', 'Good try.', 'Not this time.'];

/** Renders "___" as a visible blank (or the filled-in answer once revealed). */
export function SentenceWithGap({ text, fill }: { text: string; fill?: string }) {
  const parts = text.split('___');
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < parts.length - 1 &&
            (fill ? (
              <mark className="rounded-md bg-success-soft px-1 font-semibold text-ink">{fill}</mark>
            ) : (
              <span className="mx-0.5 inline-block w-20 border-b-2 border-ink-muted align-baseline">
                <span className="sr-only">blank</span>
              </span>
            ))}
        </Fragment>
      ))}
    </>
  );
}

export function ChoiceQuestionView({
  question: q,
  onAnswer,
}: {
  question: ChoiceQuestion;
  onAnswer: (correct: boolean) => void;
}) {
  const [chosen, setChosen] = useState<number>();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const answered = chosen !== undefined;
  const correct = chosen === q.answer;
  // Stable per question, so the message doesn't change on re-render.
  const message = (correct ? RIGHT : WRONG)[q.id.length % (correct ? RIGHT.length : WRONG.length)];

  useEffect(() => headingRef.current?.focus({ preventScroll: true }), []);

  const choose = (i: number) => {
    if (answered) return;
    setChosen(i);
    onAnswer(i === q.answer);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (!answered && Number.isInteger(n) && n >= 1 && n <= q.options.length) choose(n - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="animate-rise">
      <section className={`${cardClasses} p-5 sm:p-8`} aria-labelledby={`${q.id}-instruction`}>
        <h2
          id={`${q.id}-instruction`}
          ref={headingRef}
          tabIndex={-1}
          className="text-xs font-bold tracking-widest text-ink-muted uppercase outline-none"
        >
          {q.instruction}
        </h2>
        {q.context && (
          <p className="mt-3 inline-block rounded-full bg-surface-2 px-3 py-1 text-sm font-medium">
            {q.context}
          </p>
        )}
        {q.promptStyle === 'term' ? (
          <div className="mt-3 flex items-center justify-between gap-4">
            <p className="font-display text-4xl font-semibold tracking-tight text-balance">
              {q.prompt}
            </p>
            <SpeakButton text={q.prompt} />
          </div>
        ) : (
          <p className="mt-3 font-display text-2xl leading-snug text-pretty">
            {q.mode === 'register' ? (
              <>“{q.prompt}”</>
            ) : (
              <SentenceWithGap text={q.prompt} fill={answered ? q.options[q.answer] : undefined} />
            )}
          </p>
        )}
        {q.mode === 'gap-fill' && !answered && (
          <p className="mt-3 text-sm text-ink-muted">
            The word may change form to fit, e.g. “corroborate” → “corroborated”.
          </p>
        )}
      </section>

      <ul className="mt-4 space-y-2.5" aria-label="Answers">
        {q.options.map((option, i) => {
          const isAnswer = i === q.answer;
          const isChosen = i === chosen;
          const state = !answered
            ? 'border-line bg-surface active:scale-[0.98] active:bg-surface-2'
            : isAnswer
              ? 'border-success bg-success-soft'
              : isChosen
                ? 'border-danger bg-danger-soft'
                : 'border-line bg-surface opacity-60';
          return (
            <li key={option}>
              <button
                type="button"
                onClick={() => choose(i)}
                disabled={answered}
                aria-pressed={isChosen}
                className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition disabled:cursor-default ${state}`}
              >
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold text-ink-muted"
                  aria-hidden="true"
                >
                  {answered && isAnswer ? (
                    <Check className="size-4 text-success" />
                  ) : answered && isChosen ? (
                    <X className="size-4 text-danger" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="leading-snug">{option}</span>
                {answered && isAnswer && <span className="sr-only">(correct answer)</span>}
                {answered && isChosen && !isAnswer && (
                  <span className="sr-only">(your answer)</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {answered && (
        <div
          aria-live="polite"
          className={`mt-4 animate-pop rounded-2xl p-4 ${correct ? 'bg-success-soft' : 'bg-surface-2'}`}
        >
          <p className="font-semibold">
            <span aria-hidden="true">{correct ? '🎉 ' : '🤔 '}</span>
            {message}
          </p>
          {!correct && q.why?.[chosen] && (
            <p className="mt-1 text-sm">
              <span className="font-semibold">Your pick: </span>
              {q.why[chosen]}
            </p>
          )}
          <p className="mt-1 text-sm leading-relaxed">
            {q.mode === 'meaning' ? (
              <>
                <span className="font-semibold">In use: </span>
                <span className="italic">{q.explanation}</span>
              </>
            ) : (
              q.explanation
            )}
          </p>
        </div>
      )}
    </div>
  );
}
