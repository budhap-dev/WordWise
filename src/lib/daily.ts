/**
 * Chooses the daily set of new words.
 *
 * - Only categories unlocked by the learner's roles (plus everyday words and idioms).
 * - Words at or below the learner's level come first; harder ones follow once those run out.
 * - Categories are interleaved so a set feels varied rather than ten idioms in a row.
 * - Deterministic for a given date, so the set is stable all day and across reloads.
 */
import { categoriesForRoles, LEVELS } from '../data';
import type { Category, Level, Role, WordEntry } from '../types/content';
import type { DateKey } from './date';
import { hashString, seededRandom, shuffle } from './random';

export interface DailySetOptions {
  words: readonly WordEntry[];
  roles: readonly Role[];
  level: Level;
  size: number;
  date: DateKey;
  /** Words already introduced to the learner; these are skipped. */
  excludeIds?: ReadonlySet<string>;
}

function interleaveByCategory(words: WordEntry[], categories: Category[]): WordEntry[] {
  const buckets = new Map<Category, WordEntry[]>(categories.map((c) => [c, []]));
  for (const w of words) buckets.get(w.category)?.push(w);
  const out: WordEntry[] = [];
  let added = true;
  while (added) {
    added = false;
    for (const c of categories) {
      const next = buckets.get(c)?.shift();
      if (next) {
        out.push(next);
        added = true;
      }
    }
  }
  return out;
}

export function selectDailyWords({
  words,
  roles,
  level,
  size,
  date,
  excludeIds = new Set(),
}: DailySetOptions): WordEntry[] {
  const random = seededRandom(hashString(`wordwise:${date}`));
  const categories = shuffle(categoriesForRoles(roles), random);
  const levelRank = LEVELS.indexOf(level);

  const eligible = words.filter((w) => categories.includes(w.category) && !excludeIds.has(w.id));
  const atLevel = eligible.filter((w) => LEVELS.indexOf(w.level) <= levelRank);
  const above = eligible.filter((w) => LEVELS.indexOf(w.level) > levelRank);

  const ordered = [
    ...interleaveByCategory(shuffle(atLevel, random), categories),
    ...interleaveByCategory(shuffle(above, random), categories),
  ];
  return ordered.slice(0, size);
}

/** Roughly how long a set takes, for the "about 6 minutes" hint. */
export function estimateMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount * 0.6));
}
