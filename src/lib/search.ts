/**
 * Word search for the Browse screen: ranked, forgiving and fast enough to run on every keystroke.
 *
 * A word matches when the whole query appears in one of its fields (the term scores highest,
 * then its forms, synonyms and opposites, and so on down to example sentences). Failing that,
 * every word of the query must appear somewhere in the entry, so "take on board" finds
 * "take something on board". Matching ignores case, accents, apostrophes and hyphens.
 */
import { LEVELS } from '../data';
import type { Category, Level, Register, WordEntry } from '../types/content';

/** Where a match was found, so results can say why they're there. */
export type MatchField =
  | 'term'
  | 'form'
  | 'synonym'
  | 'antonym'
  | 'collocation'
  | 'topic'
  | 'definition'
  | 'otherMeaning'
  | 'example'
  | 'origin';

export interface MatchReason {
  field: MatchField;
  /** The matching synonym, collocation, sentence etc., as written in the entry. */
  text: string;
}

export interface SearchResult {
  word: WordEntry;
  score: number;
  /** Set when the match wasn't in the term itself. */
  reason?: MatchReason;
}

/** Lower-case, no accents, no apostrophes, hyphens and punctuation as spaces. */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/['’‘]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

interface IndexedField {
  field: MatchField;
  /** The original text, for showing back to the learner. */
  text: string;
  folded: string;
}

/** Base score for a whole-query match in each field. Term and forms get bonuses for exactness. */
const WEIGHT: Record<MatchField, number> = {
  term: 70,
  form: 60,
  synonym: 50,
  antonym: 48,
  collocation: 40,
  topic: 38,
  definition: 30,
  otherMeaning: 25,
  example: 15,
  origin: 10,
};

function indexWord(w: WordEntry): IndexedField[] {
  const fields: [MatchField, string][] = [
    ['term', w.term],
    ...(w.forms ?? []).map((f): [MatchField, string] => ['form', f]),
    ...w.synonyms.map((s): [MatchField, string] => ['synonym', s.term]),
    ...(w.antonyms ?? []).map((a): [MatchField, string] => ['antonym', a.term]),
    ...w.collocations.map((c): [MatchField, string] => ['collocation', c]),
    ...w.topics.map((t): [MatchField, string] => ['topic', t.replace(/-/g, ' ')]),
    ['definition', w.definition],
    ...(w.otherMeanings ?? []).map((m): [MatchField, string] => ['otherMeaning', m.meaning]),
    ...w.examples.map((e): [MatchField, string] => ['example', e.text]),
    ...(w.origin ? [['origin', w.origin] as [MatchField, string]] : []),
  ];
  return fields.map(([field, text]) => ({ field, text, folded: fold(text) }));
}

const INDEX = new WeakMap<WordEntry, IndexedField[]>();

function indexed(w: WordEntry): IndexedField[] {
  let fields = INDEX.get(w);
  if (!fields) {
    fields = indexWord(w);
    INDEX.set(w, fields);
  }
  return fields;
}

/** True if `query` starts a word in `text` (both folded). Ignores spaces for compounds. */
function startsAWord(text: string, query: string): boolean {
  if (text.startsWith(query) || text.includes(` ${query}`)) return true;
  // "wellbeing" should find "well-being", and "well being" should find "wellbeing", but only
  // from the start of a word.
  const compactQuery = query.replace(/ /g, '');
  if (compactQuery.length < 4 || !(text.includes(' ') || query.includes(' '))) return false;
  for (let i = 0; i < text.length; i = text.indexOf(' ', i) + 1 || text.length) {
    if (text.slice(i).replace(/ /g, '').startsWith(compactQuery)) return true;
  }
  return false;
}

/** Score for the whole query against one field, or 0. */
function fieldScore(f: IndexedField, query: string): number {
  const { field, folded } = f;
  if (field === 'term' || field === 'form') {
    const base = WEIGHT[field];
    if (folded === query) return base + 30;
    if (folded.startsWith(query)) return base + 20;
    if (startsAWord(folded, query)) return base + 10;
    // Inside a word ("tribut" in "contribute") only counts for the headword itself, and only
    // when the query is long enough not to be noise ("latin" is not in "escalating").
    if (field === 'term' && query.length >= 4 && folded.includes(query)) return base;
    return 0;
  }
  if (field === 'synonym' || field === 'antonym' || field === 'topic') {
    if (folded === query) return WEIGHT[field] + 5;
  }
  return startsAWord(folded, query) ? WEIGHT[field] : 0;
}

function bestField(fields: readonly IndexedField[], query: string) {
  let best: { f: IndexedField; score: number } | undefined;
  for (const f of fields) {
    const score = fieldScore(f, query);
    if (score > (best?.score ?? 0)) best = { f, score };
  }
  return best;
}

/** Scores one word for a folded, non-empty query. */
function scoreWord(w: WordEntry, query: string): SearchResult | null {
  const fields = indexed(w);

  // A one-letter query only matches the start of the term, or everything would match.
  if (query.length < 2) {
    return fields[0]!.folded.startsWith(query) ? { word: w, score: 90 } : null;
  }

  const whole = bestField(fields, query);
  if (whole) {
    const { f, score } = whole;
    return f.field === 'term'
      ? { word: w, score }
      : { word: w, score, reason: { field: f.field, text: f.text } };
  }

  // Every word of the query must appear somewhere, e.g. "take on board". Little words ("on",
  // "up") and long free text (examples, origins) would match almost anything, so they're skipped.
  const tokens = query.split(' ').filter((t) => t.length > 2);
  if (tokens.length === 0 || (tokens.length === 1 && !query.includes(' '))) return null;
  const core = fields.filter((f) => f.field !== 'example' && f.field !== 'origin');
  const bests = tokens.map((t) => bestField(core, t));
  if (bests.some((b) => !b)) return null;
  const hits = bests as { f: IndexedField; score: number }[];
  // Half marks: a scattered match is weaker than the whole phrase in one place.
  const score = Math.round(hits.reduce((sum, b) => sum + b.score, 0) / hits.length / 2);
  const allInTerm = hits.every((b) => b.f.field === 'term');
  const weakest = hits.reduce((a, b) => (b.score < a.score ? b : a));
  return allInTerm
    ? { word: w, score: score + 20 }
    : { word: w, score, reason: { field: weakest.f.field, text: weakest.f.text } };
}

export type StatusFilter = 'all' | 'new' | 'learnt' | 'due';

export interface SearchFilters {
  category: Category | 'all';
  status: StatusFilter;
  /** Empty means any level. */
  levels: readonly Level[];
  /** Empty means any register. */
  registers: readonly Register[];
}

export const NO_FILTERS: SearchFilters = {
  category: 'all',
  status: 'all',
  levels: [],
  registers: [],
};

/** How the learner stands with each word: learnt words, and those due for review today. */
export interface WordStatus {
  learnt: ReadonlySet<string>;
  due: ReadonlySet<string>;
}

function passesFilters(w: WordEntry, filters: SearchFilters, status: WordStatus): boolean {
  if (filters.category !== 'all' && w.category !== filters.category) return false;
  if (filters.levels.length > 0 && !filters.levels.includes(w.level)) return false;
  if (filters.registers.length > 0 && !filters.registers.includes(w.register)) return false;
  switch (filters.status) {
    case 'new':
      return !status.learnt.has(w.id);
    case 'learnt':
      return status.learnt.has(w.id);
    case 'due':
      return status.due.has(w.id);
    default:
      return true;
  }
}

const collator = new Intl.Collator('en-GB', { sensitivity: 'base', ignorePunctuation: true });

/** Sort key for a term: "a steep learning curve" files under S, like a dictionary. */
export function sortKey(term: string): string {
  return term.replace(/^(?:a|an|the|to)\s+/i, '');
}

export function compareTerms(a: WordEntry, b: WordEntry): number {
  return collator.compare(sortKey(a.term), sortKey(b.term));
}

/** "opposite of lazy", "another word for happy": a question about related words. */
export interface RelationQuery {
  relation: 'synonym' | 'antonym';
  /** The folded word being asked about. */
  target: string;
}

const ANTONYM_ASK = /^(?:the )?(?:opposites? of|opposite|antonyms? (?:of|for)|antonym)\s+(.+)$/;
const SYNONYM_ASK =
  /^(?:(?:another|other|a) words? for|synonyms? (?:of|for)|synonym|similar to|same as)\s+(.+)$/;

export function parseRelation(foldedQuery: string): RelationQuery | null {
  const antonym = ANTONYM_ASK.exec(foldedQuery);
  if (antonym) return { relation: 'antonym', target: antonym[1]! };
  const synonym = SYNONYM_ASK.exec(foldedQuery);
  if (synonym) return { relation: 'synonym', target: synonym[1]! };
  return null;
}

/**
 * Words related to `target`: those listing it as a synonym (or antonym), plus, when `target` is
 * itself a headword, the headwords it lists.
 */
function relatedWords(
  words: readonly WordEntry[],
  all: readonly WordEntry[],
  { relation, target }: RelationQuery,
) {
  const results = new Map<WordEntry, SearchResult>();
  for (const w of words) {
    for (const f of indexed(w)) {
      if (f.field !== relation) continue;
      const score = fieldScore(f, target);
      if (score > (results.get(w)?.score ?? 0)) {
        results.set(w, { word: w, score, reason: { field: relation, text: f.text } });
      }
    }
  }
  const head = all.find((w) => fold(w.term) === target);
  if (head) {
    const listed = relation === 'synonym' ? head.synonyms : (head.antonyms ?? []);
    const listedTerms = new Map(listed.map((t) => [fold(t.term), t.term]));
    for (const w of words) {
      const term = listedTerms.get(fold(w.term));
      if (term && !results.has(w)) {
        results.set(w, { word: w, score: 60, reason: { field: relation, text: head.term } });
      }
    }
  }
  return [...results.values()];
}

function byScore(a: SearchResult, b: SearchResult): number {
  return (
    b.score - a.score ||
    LEVELS.indexOf(a.word.level) - LEVELS.indexOf(b.word.level) ||
    compareTerms(a.word, b.word)
  );
}

/**
 * Searches and filters `words`. With an empty query, returns every word that passes the
 * filters, A to Z; otherwise the best matches first. "opposite of X" and "another word for X"
 * look for related words. If none are listed, "another word for X" searches for X itself (its
 * meaning often says it: "knackered" is "extremely tired"); otherwise the query is searched as
 * typed.
 */
export function searchWords(
  words: readonly WordEntry[],
  query: string,
  filters: SearchFilters = NO_FILTERS,
  status: WordStatus = { learnt: new Set(), due: new Set() },
): SearchResult[] {
  const q = fold(query);
  const eligible = words.filter((w) => passesFilters(w, filters, status));
  if (!q) {
    return eligible
      .map((word) => ({ word, score: 0 }))
      .sort((a, b) => compareTerms(a.word, b.word));
  }

  const plain = (text: string) =>
    eligible
      .map((w) => scoreWord(w, text))
      .filter((r): r is SearchResult => r !== null)
      .sort(byScore);

  const relation = parseRelation(q);
  if (relation) {
    const related = relatedWords(eligible, words, relation);
    if (related.length > 0) return related.sort(byScore);
    if (relation.relation === 'synonym') {
      const target = plain(relation.target).filter((r) => fold(r.word.term) !== relation.target);
      if (target.length > 0) return target;
    }
  }
  return plain(q);
}

/** How many filters (besides the category chips) are switched on, for the Filters button. */
export function activeFilterCount(filters: SearchFilters): number {
  return (
    (filters.status === 'all' ? 0 : 1) +
    (filters.levels.length > 0 ? 1 : 0) +
    (filters.registers.length > 0 ? 1 : 0)
  );
}

/** A short extract of `text` around the first occurrence of `query`, for long fields. */
export function snippet(text: string, query: string, radius = 40): string {
  if (text.length <= radius * 2 + 10) return text;
  const words = fold(query).split(' ').filter(Boolean);
  const lower = text.toLowerCase();
  const at = words.length > 0 ? lower.indexOf(words[0]!) : -1;
  if (at < 0) return `${text.slice(0, radius * 2).trimEnd()}…`;
  const start = Math.max(0, text.lastIndexOf(' ', Math.max(0, at - radius)) + 1);
  const endSpace = text.indexOf(' ', at + radius);
  const end = endSpace < 0 ? text.length : endSpace;
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}
