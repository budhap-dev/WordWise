import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';

import { WORDS } from '../data';
import { db } from '../db/db';
import { dueCards, introducedBefore, introducedOn } from '../db/selectors';
import { selectDailyWords } from '../lib/daily';
import { addDays, type DateKey, toDateKey } from '../lib/date';
import { currentStreak } from '../lib/streak';
import type { Settings } from '../types/user';

/** All of the learner's cards, kept live. `undefined` while IndexedDB is loading. */
export function useCards() {
  return useLiveQuery(() => db.cards.toArray(), []);
}

/**
 * Today's set of new words and which of them have been learnt.
 *
 * Words learnt on earlier days are excluded, while those learnt today stay in the set, so it
 * remains stable all day. `undefined` while loading.
 */
export function useTodaySet(settings: Settings, date: DateKey = toDateKey()) {
  const cards = useCards();
  const { roles, level, dailyGoal } = settings;
  return useMemo(() => {
    if (!cards) return undefined;
    const words = selectDailyWords({
      words: WORDS,
      roles,
      level,
      size: dailyGoal,
      date,
      excludeIds: introducedBefore(cards, date),
    });
    return { words, seenIds: introducedOn(cards, date), cards };
  }, [cards, roles, level, dailyGoal, date]);
}

const KNOWN_IDS: ReadonlySet<string> = new Set(WORDS.map((w) => w.id));

/** Cards due today (and overdue), plus how many fall due tomorrow. `undefined` while loading. */
export function useReviews(date: DateKey = toDateKey()) {
  const cards = useCards();
  return useMemo(() => {
    if (!cards) return undefined;
    const due = dueCards(cards, date, KNOWN_IDS);
    const tomorrow = addDays(date, 1);
    const dueTomorrow = cards.filter((c) => c.due === tomorrow && KNOWN_IDS.has(c.wordId)).length;
    return { due, dueTomorrow, total: cards.length };
  }, [cards, date]);
}

/** The learner's current streak, from days with learning, reviews, practice or games. `undefined` while loading. */
export function useStreak(date: DateKey = toDateKey()) {
  const dates = useLiveQuery(async () => {
    const days = await Promise.all([
      db.cards.orderBy('introducedOn').uniqueKeys(),
      db.reviews.orderBy('date').uniqueKeys(),
      db.attempts.orderBy('date').uniqueKeys(),
      db.gameScores.orderBy('date').uniqueKeys(),
    ]);
    return new Set(days.flat().map(String));
  }, []);
  return useMemo(() => (dates ? currentStreak(dates, date) : undefined), [dates, date]);
}
