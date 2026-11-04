import { ShareButton } from '../../components/ui/ShareButton';
import type { LevelInfo } from '../../lib/achievements/xp';
import { levelShare } from '../../lib/share';

export function LevelCard({
  level,
  wordsLearnt,
  streakDays,
}: {
  level: LevelInfo;
  wordsLearnt: number;
  streakDays: number;
}) {
  const pct = Math.round((level.intoLevel / level.levelSize) * 100);
  return (
    <section
      aria-labelledby="level-heading"
      className="relative overflow-hidden rounded-3xl bg-brand p-6 text-brand-ink shadow-lg shadow-brand/20"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-6 -right-4 animate-float text-[7rem] leading-none opacity-20 select-none"
      >
        {level.emoji}
      </span>
      <p className="text-sm font-semibold tracking-widest uppercase opacity-90">
        Level {level.level}
      </p>
      <h2 id="level-heading" className="mt-1 font-display text-3xl font-semibold tracking-tight">
        <span aria-hidden="true">{level.emoji} </span>
        {level.title}
      </h2>
      <p className="mt-1 max-w-xs text-sm opacity-90">{level.note}</p>

      <div
        role="progressbar"
        aria-label={`Progress to level ${level.level + 1}`}
        aria-valuemin={0}
        aria-valuemax={level.levelSize}
        aria-valuenow={level.intoLevel}
        aria-valuetext={`${level.intoLevel} of ${level.levelSize} XP`}
        className="mt-5 h-3 overflow-hidden rounded-full bg-brand-ink/25"
      >
        <div
          className="h-full rounded-full bg-brand-ink transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
        <p>
          <span className="font-semibold">{level.xp.toLocaleString('en-GB')} XP</span>
          <span className="opacity-90"> in total</span>
        </p>
        <p className="opacity-90">
          {level.toNext} XP to level {level.level + 1}
        </p>
      </div>

      <ShareButton
        content={levelShare(level, wordsLearnt, streakDays)}
        label="Share"
        size="sm"
        className="mt-4 bg-brand-ink/15 text-brand-ink hover:bg-brand-ink/25 hover:text-brand-ink"
      />
    </section>
  );
}
