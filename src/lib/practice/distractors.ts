import type { WordEntry } from '../../types/content';
import { shuffle } from '../random';
import { normalise } from '../text';

/** Phrase-like parts of speech are interchangeable in a sentence slot. */
const PHRASE_LIKE = new Set(['phrase', 'idiom', 'phrasal verb', 'collocation']);

function sameSlot(a: WordEntry, b: WordEntry): boolean {
  if (a.partOfSpeech === b.partOfSpeech) return true;
  return PHRASE_LIKE.has(a.partOfSpeech) && PHRASE_LIKE.has(b.partOfSpeech);
}

/** True if either word lists the other as a synonym, so it might also fit the answer. */
function related(a: WordEntry, b: WordEntry): boolean {
  const aTerm = normalise(a.term);
  const bTerm = normalise(b.term);
  return (
    a.synonyms.some((s) => normalise(s.term) === bTerm) ||
    b.synonyms.some((s) => normalise(s.term) === aTerm)
  );
}

/**
 * Picks `n` wrong answers for `target`. Plausible ones come first: same part of speech and
 * category, then same part of speech, then same category. Synonyms are never used, as they might
 * also be right.
 */
export function wordDistractors(
  target: WordEntry,
  words: readonly WordEntry[],
  n: number,
  random: () => number,
  {
    sameSlotOnly = false,
    avoidSharedTopics = false,
  }: {
    /** Only words that fit the same grammatical slot (for sentences). */
    sameSlotOnly?: boolean;
    /** Skip words sharing a topic with the target: they're likelier to fit a sentence too. */
    avoidSharedTopics?: boolean;
  } = {},
): WordEntry[] {
  const candidates = words.filter(
    (w) =>
      w.id !== target.id &&
      normalise(w.term) !== normalise(target.term) &&
      w.definition !== target.definition &&
      !related(target, w),
  );
  const distinct = candidates.filter((w) => !w.topics.some((t) => target.topics.includes(t)));
  const ok = avoidSharedTopics && distinct.length >= n * 3 ? distinct : candidates;
  const tiers: WordEntry[][] = [[], [], [], []];
  for (const w of shuffle(ok, random)) {
    const slot = sameSlot(target, w);
    const category = w.category === target.category;
    if (slot && category) tiers[0]!.push(w);
    else if (slot) tiers[1]!.push(w);
    else if (category) tiers[2]!.push(w);
    else tiers[3]!.push(w);
  }
  const ranked = sameSlotOnly ? [...tiers[0]!, ...tiers[1]!] : tiers.flat();
  return ranked.slice(0, n);
}
