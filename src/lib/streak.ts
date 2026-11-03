import { addDays, type DateKey } from './date';

export interface Streak {
  /** Consecutive active days, ending today (or yesterday, if today isn't done yet). */
  days: number;
  /** Whether the learner has done something today. */
  activeToday: boolean;
}

/**
 * A streak is a run of consecutive days with any learning or reviewing. It stays alive until
 * the end of today, so a learner with a 5-day streak who hasn't started today still sees 5.
 */
export function currentStreak(activeDates: ReadonlySet<DateKey>, today: DateKey): Streak {
  const activeToday = activeDates.has(today);
  let day = activeToday ? today : addDays(today, -1);
  let days = 0;
  while (activeDates.has(day)) {
    days++;
    day = addDays(day, -1);
  }
  return { days, activeToday };
}
