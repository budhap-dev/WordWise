import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';

import { cardClasses } from '../../components/ui/styles';
import { CATEGORY_LABELS, WORDS } from '../../data';
import {
  FAMILIAR_INTERVAL,
  MASTERED_INTERVAL,
  type MasteryStage,
  type ProgressStats,
} from '../../lib/achievements/stats';
import type { Category } from '../../types/content';

/** Mastery is ordered, so it's one hue stepping from light to dark, not three unrelated colours. */
const STAGES: { stage: MasteryStage; label: string; hint: string; mix: number }[] = [
  { stage: 'learning', label: 'Learning', hint: `back within a week`, mix: 35 },
  {
    stage: 'familiar',
    label: 'Familiar',
    hint: `${FAMILIAR_INTERVAL}–${MASTERED_INTERVAL - 1} days apart`,
    mix: 65,
  },
  { stage: 'mastered', label: 'Mastered', hint: `${MASTERED_INTERVAL}+ days apart`, mix: 100 },
];

const swatch = (mix: number) => ({
  background: `color-mix(in oklab, var(--brand) ${mix}%, var(--surface))`,
});

const TOTAL_BY_CATEGORY = WORDS.reduce(
  (acc, w) => ({ ...acc, [w.category]: (acc[w.category] ?? 0) + 1 }),
  {} as Partial<Record<Category, number>>,
);

export function WordsCard({
  stats,
  categories,
}: {
  stats: ProgressStats;
  categories: readonly Category[];
}) {
  const { wordsLearnt, mastery } = stats;
  return (
    <section aria-labelledby="words-heading" className={`${cardClasses} p-5`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="words-heading" className="text-lg font-semibold">
          Your words
        </h2>
        <p className="text-sm text-ink-muted">
          {wordsLearnt} of {WORDS.length} learnt
        </p>
      </div>

      {wordsLearnt === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">
          Learn today’s words and they’ll show up here, growing from learning to mastered as you
          review them.
        </p>
      ) : (
        <>
          {/* Segments with a 2px gap between them; the legend below carries the numbers. */}
          <div className="mt-4 flex h-4 gap-0.5" aria-hidden="true">
            {STAGES.filter((s) => mastery[s.stage] > 0).map((s) => (
              <span
                key={s.stage}
                className="h-full rounded-[4px] transition-[flex-grow] duration-500"
                style={{ ...swatch(s.mix), flexGrow: mastery[s.stage] }}
              />
            ))}
          </div>
          <ul className="mt-3 grid grid-cols-3 gap-2" aria-label="Words by how well you know them">
            {STAGES.map((s) => (
              <li key={s.stage} className="text-sm">
                <span className="flex items-center gap-1.5 text-ink-muted">
                  <span className="size-2.5 shrink-0 rounded-[3px]" style={swatch(s.mix)} />
                  {s.label}
                </span>
                <span className="block text-xl font-semibold">{mastery[s.stage]}</span>
                <span className="block text-xs text-ink-muted">{s.hint}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3 className="mt-6 text-sm font-semibold text-ink-muted">By topic</h3>
      <ul className="mt-2 divide-y divide-line">
        {categories.map((c) => {
          const learnt = stats.byCategory[c];
          const total = TOTAL_BY_CATEGORY[c] ?? 0;
          const pct = total > 0 ? Math.round((learnt / total) * 100) : 0;
          return (
            <li key={c}>
              <Link
                to={`/browse?cat=${c}${learnt > 0 ? '&status=learnt' : ''}`}
                className="flex min-h-12 items-center gap-3 py-2 active:opacity-70"
              >
                <span className="flex-1">
                  <span className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium">{CATEGORY_LABELS[c]}</span>{' '}
                    <span className="text-ink-muted">
                      {learnt} / {total}
                    </span>
                  </span>
                  <span
                    className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-surface-2"
                    aria-hidden="true"
                  >
                    <span
                      className="block h-full rounded-full bg-brand transition-[width] duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
