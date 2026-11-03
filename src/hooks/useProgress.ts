import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';

import { WORDS } from '../data';
import { db } from '../db/db';
import { introducedBefore, introducedOn } from '../db/selectors';
import { selectDailyWords } from '../lib/daily';
import { type DateKey, toDateKey } from '../lib/date';
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
