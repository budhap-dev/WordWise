import type { DateKey } from '../date';
import { type BadgeStatus, badgeStatuses } from './badges';
import { type ActivityLog, progressStats, type ProgressStats } from './stats';
import { type LevelInfo, levelFor, totalXp } from './xp';

export interface Achievements {
  stats: ProgressStats;
  level: LevelInfo;
  /** XP earned on `today`. */
  xpToday: number;
  badges: BadgeStatus[];
}

function onDay(log: ActivityLog, date: DateKey): ActivityLog {
  return {
    cards: log.cards.filter((c) => c.introducedOn === date),
    reviews: log.reviews.filter((r) => r.date === date),
    attempts: log.attempts.filter((a) => a.date === date),
    games: log.games.filter((g) => g.date === date),
  };
}

export function achievements(log: ActivityLog, today: DateKey): Achievements {
  const stats = progressStats(log, today);
  return {
    stats,
    level: levelFor(totalXp(log)),
    xpToday: totalXp(onDay(log, today)),
    badges: badgeStatuses(stats),
  };
}
