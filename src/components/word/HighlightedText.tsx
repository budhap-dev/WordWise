import { findTerm, type Matchable } from '../../lib/text';

/** Renders `text` with the first occurrence of the term highlighted. */
export function HighlightedText({ text, entry }: { text: string; entry: Matchable }) {
  const match = findTerm(text, entry);
  if (!match) return <>{text}</>;
  return (
    <>
      {text.slice(0, match.start)}
      <mark className="rounded-md bg-accent/30 px-1 font-semibold text-ink">{match.text}</mark>
      {text.slice(match.end)}
    </>
  );
}
