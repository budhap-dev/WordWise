/**
 * Which badges and level the learner has already been told about, so each one is celebrated
 * once. Kept in localStorage: losing it only means a celebration is repeated.
 */
import { useCallback, useSyncExternalStore } from 'react';

export const CELEBRATIONS_KEY = 'wordwise:celebrated';

export interface Celebrated {
  /** Badge ids the learner has seen. */
  badges: string[];
  /** The highest level announced. */
  level: number;
}

const EMPTY: Celebrated = { badges: [], level: 1 };

let cache: { raw: string | null; value: Celebrated } | null = null;
const listeners = new Set<() => void>();

function read(): Celebrated {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(CELEBRATIONS_KEY);
  } catch {
    // storage unavailable: celebrate in memory only
    return cache?.value ?? EMPTY;
  }
  if (cache && cache.raw === raw) return cache.value;
  let value = EMPTY;
  try {
    const parsed = raw ? (JSON.parse(raw) as Partial<Celebrated>) : null;
    if (parsed) {
      value = {
        badges: Array.isArray(parsed.badges)
          ? parsed.badges.filter((b): b is string => typeof b === 'string')
          : [],
        level: typeof parsed.level === 'number' && parsed.level >= 1 ? parsed.level : 1,
      };
    }
  } catch {
    // corrupt: start again
  }
  cache = { raw, value };
  return value;
}

export function writeCelebrated(value: Celebrated) {
  const raw = JSON.stringify(value);
  try {
    localStorage.setItem(CELEBRATIONS_KEY, raw);
  } catch {
    // ignore
  }
  cache = { raw, value };
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === CELEBRATIONS_KEY) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

/**
 * What's new since the learner last looked: earned badges they haven't seen, and whether
 * they've gone up a level. `markSeen` records the current state as celebrated.
 */
export function useCelebrations(current: { earned: readonly string[]; level: number } | undefined) {
  const celebrated = useSyncExternalStore(subscribe, read, () => EMPTY);
  const seen = new Set(celebrated.badges);
  const newBadges = current ? current.earned.filter((id) => !seen.has(id)) : [];
  const levelUp = current && current.level > celebrated.level ? current.level : null;

  const earnedKey = current?.earned.join(',');
  const level = current?.level;
  const markSeen = useCallback(() => {
    if (earnedKey === undefined || level === undefined) return;
    // Forget badges that are no longer earned (after a reset), so they're celebrated again.
    writeCelebrated({ badges: earnedKey ? earnedKey.split(',') : [], level });
  }, [earnedKey, level]);

  return { newBadges, levelUp, markSeen, celebrated };
}
