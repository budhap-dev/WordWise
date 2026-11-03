import { Lightbulb } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { Button } from '../../components/ui/Button';
import { cardClasses } from '../../components/ui/styles';
import { HighlightedText } from '../../components/word/HighlightedText';
import { getWord } from '../../data';
import type { WriteQuestion } from '../../lib/practice/types';
import { containsTerm } from '../../lib/text';

type Result = 'used' | 'missing' | 'skipped';

export function WriteQuestionView({
  question: q,
  onAnswer,
}: {
  question: WriteQuestion;
  onAnswer: (correct: boolean) => void;
}) {
  const word = getWord(q.wordId);
  const [text, setText] = useState('');
  const [result, setResult] = useState<Result>();
  const [showHint, setShowHint] = useState(false);
  const inputId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => headingRef.current?.focus({ preventScroll: true }), []);

  if (!word) return null;
  const done = result !== undefined;

  const check = () => {
    if (!text.trim() || done) return;
    const used = containsTerm(text, word);
    setResult(used ? 'used' : 'missing');
    onAnswer(used);
  };

  const skip = () => {
    if (done) return;
    setResult('skipped');
    onAnswer(false);
  };

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
        <p className="mt-3 font-display text-2xl leading-snug text-pretty">“{q.plain}”</p>
        <p className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          Use
          <span className="rounded-full bg-accent/25 px-3 py-1 font-semibold">{q.term}</span>
          {!showHint && (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="inline-flex min-h-11 items-center gap-1 px-1 font-semibold text-ink-muted"
            >
              <Lightbulb className="size-4" aria-hidden="true" /> What does it mean?
            </button>
          )}
        </p>
        {showHint && (
          <p className="mt-1 animate-rise text-sm text-ink-muted" aria-live="polite">
            {q.hint}
          </p>
        )}
      </section>

      <label htmlFor={inputId} className="mt-4 block text-sm font-semibold">
        Your version
      </label>
      <textarea
        id={inputId}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) check();
        }}
        readOnly={done}
        rows={3}
        placeholder={`Rewrite it using “${q.term}”…`}
        className="mt-1.5 w-full rounded-2xl border-2 border-line bg-surface p-4 leading-relaxed outline-none read-only:opacity-80 focus:border-brand"
      />

      {!done ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={check} disabled={!text.trim()}>
            Check
          </Button>
          <Button variant="ghost" onClick={skip}>
            Show me an example
          </Button>
        </div>
      ) : (
        <div
          aria-live="polite"
          className={`mt-4 animate-pop rounded-2xl p-4 ${result === 'used' ? 'bg-success-soft' : 'bg-surface-2'}`}
        >
          <p className="font-semibold">
            {result === 'used' && (
              <>
                <span aria-hidden="true">🎉 </span>Lovely: you used “{q.term}”.
              </>
            )}
            {result === 'missing' && (
              <>
                <span aria-hidden="true">🤔 </span>Nearly. Try to include “{q.term}” (any form).
              </>
            )}
            {result === 'skipped' && (
              <>
                <span aria-hidden="true">💡 </span>Here’s one way to do it.
              </>
            )}
          </p>
          <p className="mt-2 text-sm">
            <span className="font-semibold">Our version: </span>
            <HighlightedText text={q.model} entry={word} />
          </p>
          {result === 'used' && (
            <p className="mt-2 text-sm text-ink-muted">
              Does yours keep the original meaning? There’s no single right answer.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
