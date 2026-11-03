import type { OtherMeaning } from '../../types/content';

/** A list of alternative senses, each with an optional example and a "how to tell" cue. */
export function OtherMeanings({ meanings }: { meanings: readonly OtherMeaning[] }) {
  return (
    <ul className="space-y-3">
      {meanings.map((m) => (
        <li key={m.meaning} className="rounded-2xl border border-line bg-surface p-4">
          <p className="leading-snug font-semibold text-pretty">{m.meaning}</p>
          {m.example && (
            <p className="mt-1.5 leading-relaxed text-pretty text-ink-muted italic">
              “{m.example}”
            </p>
          )}
          {m.cue && (
            <p className="mt-2 text-sm leading-relaxed text-pretty">
              <span className="font-semibold text-brand">How to tell: </span>
              {m.cue}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
