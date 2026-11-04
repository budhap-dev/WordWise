import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';

import { db } from '../db/db';
import { achievements } from '../lib/achievements';
import { type DateKey, toDateKey } from '../lib/date';

/** XP, level, stats and badges, kept live. `undefined` while IndexedDB is loading. */
export function useAchievements(date: DateKey = toDateKey()) {
  const log = useLiveQuery(async () => {
    const [cards, reviews, attempts, games] = await Promise.all([
      db.cards.toArray(),
      db.reviews.toArray(),
      db.attempts.toArray(),
      db.gameScores.toArray(),
    ]);
    return { cards, reviews, attempts, games };
  }, []);
  return useMemo(() => (log ? achievements(log, date) : undefined), [log, date]);
}
