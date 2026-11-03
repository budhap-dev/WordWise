import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';

import { categoriesForRoles, LEVELS, WORDS } from '../data';
import { type AttemptRecord, db } from '../db/db';
import type { DateKey } from '../lib/date';
import { toDateKey } from '../lib/date';
import type { SessionMode } from '../lib/practice/types';
import type { Settings } from '../types/user';

export interface SessionScore {
  correct: number;
  total: number;
  date: DateKey;
}

/** All practice attempts, kept live. `undefined` while loading. */
export function useAttempts() {
  return useLiveQuery(() => db.attempts.toArray(), []);
}

/** The most recent score for each practice mode. */
export function lastScores(attempts: readonly AttemptRecord[]): Map<SessionMode, SessionScore> {
  const sessions = new Map<string, AttemptRecord[]>();
  for (const a of attempts) sessions.set(a.sessionId, [...(sessions.get(a.sessionId) ?? []), a]);
  const latest = new Map<SessionMode, { at: string; score: SessionScore }>();
  for (const group of sessions.values()) {
    const at = group.reduce((max, a) => (a.answeredAt > max ? a.answeredAt : max), '');
    const mode = group[0]!.sessionMode;
    const previous = latest.get(mode);
    if (previous && previous.at >= at) continue;
    latest.set(mode, {
      at,
      score: {
        correct: group.filter((a) => a.correct).length,
        total: group.length,
        date: group[0]!.date,
      },
    });
  }
  return new Map([...latest].map(([mode, { score }]) => [mode, score]));
}

/** How many sessions of `mode` were started today: used to vary each new session's questions. */
export function sessionsToday(
  attempts: readonly AttemptRecord[],
  mode: SessionMode,
  date: DateKey = toDateKey(),
): number {
  return new Set(
    attempts.filter((a) => a.date === date && a.sessionMode === mode).map((a) => a.sessionId),
  ).size;
}

/** Words for the learner's roles and level: used to top up practice before they've learnt many. */
export function useEligibleWords(settings: Settings) {
  const { roles, level } = settings;
  return useMemo(() => {
    const categories = categoriesForRoles(roles);
    const rank = LEVELS.indexOf(level);
    return WORDS.filter((w) => categories.includes(w.category) && LEVELS.indexOf(w.level) <= rank);
  }, [roles, level]);
}
