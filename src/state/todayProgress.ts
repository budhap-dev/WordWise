/**
 * Which of today's words the learner has explored.
 *
 * Phase 1 keeps this in localStorage; Phase 2 moves it into IndexedDB with the review queue.
 */
import { useCallback, useState } from 'react';

import { type DateKey, toDateKey } from '../lib/date';

const KEY = 'wordwise:today';

interface TodayProgress {
  date: DateKey;
  seen: string[];
}

function load(date: DateKey): TodayProgress {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as TodayProgress) : null;
    if (parsed?.date === date && Array.isArray(parsed.seen)) return parsed;
  } catch {
    // fall through
  }
  return { date, seen: [] };
}

function save(progress: TodayProgress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // ignore: progress just won't survive a reload
  }
}

export function useTodayProgress(date: DateKey = toDateKey()) {
  const [progress, setProgress] = useState(() => load(date));
  // If the date rolls over while the app is open, start afresh.
  const current = progress.date === date ? progress : { date, seen: [] };

  const markSeen = useCallback(
    (id: string) => {
      setProgress((prev) => {
        const base = prev.date === date ? prev : { date, seen: [] };
        if (base.seen.includes(id)) return base;
        const next = { date, seen: [...base.seen, id] };
        save(next);
        return next;
      });
    },
    [date],
  );

  const reset = useCallback(() => {
    const next = { date, seen: [] };
    save(next);
    setProgress(next);
  }, [date]);

  return { seenIds: current.seen, markSeen, reset };
}
