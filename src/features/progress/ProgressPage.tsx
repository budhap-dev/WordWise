import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cardClasses } from '../../components/ui/styles';
import { categoriesForRoles } from '../../data';
import { useAchievements } from '../../hooks/useAchievements';
import { XP } from '../../lib/achievements/xp';
import { toDateKey } from '../../lib/date';
import { useCelebrations } from '../../state/celebrations';
import { useRequiredSettings } from '../../state/settingsContext';
import { ActivityCalendar } from './ActivityCalendar';
import { BadgeShelf } from './BadgeShelf';
import { LevelCard } from './LevelCard';
import { WordsCard } from './WordsCard';

function StatTile({
  emoji,
  label,
  value,
  detail,
}: {
  emoji: string;
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className={`${cardClasses} p-4`}>
      <dt className="flex items-center gap-1.5 text-sm text-ink-muted">
        <span aria-hidden="true">{emoji}</span>
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-semibold tracking-tight">{value}</dd>
      {detail && <dd className="text-xs text-ink-muted">{detail}</dd>}
    </div>
  );
}

const percent = (part: number, whole: number) => `${Math.round((part / whole) * 100)}%`;

const XP_RULES: [string, string][] = [
  ['Learn a new word', `${XP.learn} XP`],
  ['Review a word', `${XP.review} XP (${XP.reviewAgain} for “Again”)`],
  ['Practice: right answer', `${XP.practiceCorrect} XP`],
  ['Practice: wrong answer', `${XP.practiceWrong} XP, for having a go`],
  ['Word Rush', `1 XP per ${XP.rushPointsPerXp} points`],
];

export function ProgressPage() {
  const settings = useRequiredSettings();
  const today = toDateKey();
  const data = useAchievements(today);
  const earned = data?.badges.filter((b) => b.earned).map((b) => b.badge.id);
  const { newBadges, markSeen } = useCelebrations(
    data && earned ? { earned, level: data.level.level } : undefined,
  );

  // Highlight what's new on this visit, then count it as seen.
  const [highlight, setHighlight] = useState<ReadonlySet<string> | null>(null);
  if (data && highlight === null) setHighlight(new Set(newBadges));
  useEffect(() => {
    if (highlight !== null) markSeen();
  }, [highlight, markSeen]);

  if (!data) return <p className="sr-only">Loading…</p>;
  const { stats, level, xpToday, badges } = data;

  return (
    <div className="space-y-5">
      <header className="animate-rise">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Your progress</h1>
        <p className="text-ink-muted">
          {stats.wordsLearnt === 0
            ? 'Every word you learn, review or play earns XP. Off you pop!'
            : 'Look at you go. Every bit of it earned.'}
        </p>
      </header>

      <LevelCard level={level} wordsLearnt={stats.wordsLearnt} streakDays={stats.streak.days} />

      <dl className="grid grid-cols-2 gap-3">
        <StatTile
          emoji="🔥"
          label="Streak"
          value={`${stats.streak.days} ${stats.streak.days === 1 ? 'day' : 'days'}`}
          detail={`Best: ${stats.longestStreak}`}
        />
        <StatTile
          emoji="✨"
          label="XP today"
          value={`+${xpToday}`}
          detail={`Level ${level.level}`}
        />
        <StatTile
          emoji="📚"
          label="Words learnt"
          value={stats.wordsLearnt}
          detail={`${stats.mastery.mastered} mastered`}
        />
        <StatTile
          emoji="🔁"
          label="Reviews"
          value={stats.reviews}
          detail={
            stats.reviews > 0
              ? `${percent(stats.reviewsRecalled, stats.reviews)} remembered well`
              : 'None yet'
          }
        />
        <StatTile
          emoji="🎯"
          label="Practice"
          value={stats.practiceCorrect}
          detail={
            stats.practiceAnswered > 0
              ? `right, ${percent(stats.practiceCorrect, stats.practiceAnswered)} of answers`
              : 'None yet'
          }
        />
        <StatTile
          emoji="⚡"
          label="Word Rush best"
          value={stats.rushBest}
          detail={
            stats.rushGames > 0
              ? `${stats.rushGames} ${stats.rushGames === 1 ? 'game' : 'games'} played`
              : 'Not played yet'
          }
        />
      </dl>

      <ActivityCalendar days={stats.days} today={today} />

      <BadgeShelf badges={badges} highlight={highlight ?? new Set()} />

      <WordsCard stats={stats} categories={categoriesForRoles(settings.roles)} />

      <details className={`${cardClasses} group p-5`}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-semibold [&::-webkit-details-marker]:hidden">
          How XP works
          <ChevronDown
            className="size-5 text-ink-muted transition group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <dl className="mt-3 divide-y divide-line text-sm">
          {XP_RULES.map(([what, xp]) => (
            <div key={what} className="flex justify-between gap-4 py-2">
              <dt>{what}</dt>
              <dd className="text-right text-ink-muted">{xp}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-ink-muted">
          Each level takes a little more XP than the last. XP never goes down, so a bad day at the
          office costs you nothing.
        </p>
      </details>
    </div>
  );
}
