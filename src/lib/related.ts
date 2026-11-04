/** Links between entries: synonyms and opposites that are WordWise headwords themselves. */
import { WORDS } from '../data';
import type { WordEntry } from '../types/content';
import { compareTerms, fold } from './search';

/**
 * Other WordWise entries linked to this one: synonyms and opposites that are headwords
 * themselves, and entries that list this word as one of theirs.
 */
export function relatedEntries(
  word: WordEntry,
  words: readonly WordEntry[] = WORDS,
): { similar: WordEntry[]; opposite: WordEntry[] } {
  const self = fold(word.term);
  const headwords = new Map(words.map((w) => [fold(w.term), w]));
  const collect = (own: readonly { term: string }[], key: 'synonyms' | 'antonyms') => {
    const found = new Map<string, WordEntry>();
    for (const t of own) {
      const hit = headwords.get(fold(t.term));
      if (hit && hit.id !== word.id) found.set(hit.id, hit);
    }
    for (const other of words) {
      if (other.id === word.id) continue;
      if ((other[key] ?? []).some((t) => fold(t.term) === self)) found.set(other.id, other);
    }
    return [...found.values()].sort(compareTerms);
  };
  return {
    similar: collect(word.synonyms, 'synonyms'),
    opposite: collect(word.antonyms ?? [], 'antonyms'),
  };
}
