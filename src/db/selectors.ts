/** Pure helpers that derive what the learner should see from their cards. */
import type { DateKey } from '../lib/date';
import type { CardRecord } from './db';

/** Words learnt before `date`: these never reappear in a new daily set. */
export function introducedBefore(cards: readonly CardRecord[], date: DateKey): Set<string> {
  return new Set(cards.filter((c) => c.introducedOn < date).map((c) => c.wordId));
}

/** Words learnt on `date`, i.e. today's progress through the daily set. */
export function introducedOn(cards: readonly CardRecord[], date: DateKey): Set<string> {
  return new Set(cards.filter((c) => c.introducedOn === date).map((c) => c.wordId));
}

/**
 * Cards due for review on `date` (including overdue ones), most overdue first. Words that no
 * longer exist in the dataset are skipped.
 */
export function dueCards(
  cards: readonly CardRecord[],
  date: DateKey,
  knownIds?: ReadonlySet<string>,
): CardRecord[] {
  return cards
    .filter((c) => c.due <= date && (!knownIds || knownIds.has(c.wordId)))
    .sort((a, b) => a.due.localeCompare(b.due) || a.wordId.localeCompare(b.wordId));
}
