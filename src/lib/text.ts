/**
 * Text helpers for recognising a word or phrase inside a sentence.
 *
 * Used by gap-fill (to blank the term out), "upgrade this sentence" (to check the
 * learner used the target term) and the seed-data tests.
 */

/** Minimal shape needed for matching, so user-added words work too. */
export interface Matchable {
  term: string;
  forms?: string[];
}

/** Words in a term that stand for "any short phrase", e.g. "take something on board". */
const PLACEHOLDERS = new Set(['something', 'someone', "someone's", 'sb', 'sth']);
const LEADING_ARTICLE = /^(?:a|an|the)\s+/i;

/** One to four words, e.g. "your comments", "the idea", "Sam's". */
const PLACEHOLDER_PATTERN = '[^\\s.,;:!?()"]+(?:\\s+[^\\s.,;:!?()"]+){0,3}?';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function tokenPattern(token: string): string {
  if (PLACEHOLDERS.has(token.toLowerCase().replace('’', "'"))) return PLACEHOLDER_PATTERN;
  // Treat straight and curly apostrophes, and hyphen vs space, as equivalent.
  return token
    .split('')
    .map((ch) => {
      if (ch === "'" || ch === '’') return "['’]";
      if (ch === '-') return '[-\\s]?';
      return escapeRegExp(ch);
    })
    .join('');
}

function phrasePattern(phrase: string): string {
  return phrase.trim().split(/\s+/).map(tokenPattern).join('\\s+');
}

/** All the phrasings we'll accept for an entry, longest first. */
export function candidatePhrases(entry: Matchable): string[] {
  const phrases = new Set<string>();
  for (const p of [entry.term, ...(entry.forms ?? [])]) {
    const trimmed = p.trim();
    if (!trimmed) continue;
    phrases.add(trimmed);
    // "a steep learning curve" should also match "the steep learning curve" / "steep learning curve".
    if (LEADING_ARTICLE.test(trimmed)) phrases.add(trimmed.replace(LEADING_ARTICLE, ''));
  }
  return [...phrases].sort((a, b) => b.length - a.length);
}

export function buildTermRegExp(entry: Matchable): RegExp {
  const alternatives = candidatePhrases(entry).map(phrasePattern).join('|');
  // Unicode-aware word boundaries so "infer" doesn't match inside "inference".
  return new RegExp(`(?<![\\p{L}\\p{N}'’-])(?:${alternatives})(?![\\p{L}\\p{N}-])`, 'iu');
}

export interface TermMatch {
  start: number;
  end: number;
  text: string;
}

/** Finds the first occurrence of the term (or one of its forms) in `text`. */
export function findTerm(text: string, entry: Matchable): TermMatch | null {
  const m = buildTermRegExp(entry).exec(text);
  if (!m) return null;
  return { start: m.index, end: m.index + m[0].length, text: m[0] };
}

export function containsTerm(text: string, entry: Matchable): boolean {
  return findTerm(text, entry) !== null;
}

/** Lower-cases, unifies apostrophes and collapses whitespace and punctuation for loose comparison. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^\p{L}\p{N}'\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
