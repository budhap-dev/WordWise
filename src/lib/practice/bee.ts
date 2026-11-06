/**
 * The Spelling Bee: hear a word, spell it, and survive as the words get harder. There's also a
 * "tricky words" round for going back over the ones you've misspelt, with no lives to lose.
 *
 * The game is a pure reducer so it can be tested without speech or a browser.
 */
import type { WordEntry } from '../../types/content';
import { shuffle } from '../random';
import { candidatePhrases } from '../text';

export type BeeMode = 'bee' | 'tricky';
export type BeeTier = 1 | 2 | 3;

export const BEE_LIVES = 3;
/** How many words each of the first two rounds lasts. The last round runs until you're out. */
export const BEE_ROUND_LENGTH = 5;
/** A tricky-words round is short enough to do in a spare moment. */
export const TRICKY_ROUND_LENGTH = 10;
/** Each letter revealed takes this share off the word's points. */
export const REVEAL_PENALTY = 0.25;

export const BEE_ROUNDS: Record<BeeTier, string> = {
  1: 'A Doddle',
  2: 'Bit Tricky',
  3: 'Fiendish',
};

/** Multi-word phrases and hyphens are no fun to spell on a keypad, so: single words only. */
export function isSpellable(word: Pick<WordEntry, 'term'>): boolean {
  return /^[a-z]+$/.test(word.term);
}

const TRICKY_PATTERNS = [
  /(.)\1/, // double letters
  /ie|ei/,
  /gh|ph/,
  /^(kn|gn|wr|ps)|mb$|bt/, // silent letters
  /[aeiou]{3}/,
  /c[ei]|sc/,
  /(ous|ence|ance|ible|able|ise|yse|our|ary|ery)$/, // endings that are easy to mix up
];

/** A rough score for how hard a word is to spell: longer, rarer and less phonetic is harder. */
export function spellingDifficulty(word: Pick<WordEntry, 'term' | 'level'>): number {
  const levelBonus = { 'upper-intermediate': 0, advanced: 1.5, proficient: 3 }[word.level];
  const tricks = TRICKY_PATTERNS.filter((p) => p.test(word.term)).length;
  return word.term.length + levelBonus + tricks * 2;
}

export interface BeeWord {
  wordId: string;
  term: string;
  tier: BeeTier;
}

function toBeeWord(word: WordEntry, tier: BeeTier): BeeWord {
  return { wordId: word.id, term: word.term, tier };
}

/**
 * The order of play: five easy words, five middling, then every hard word there is. Within each
 * band the learner's own words come first.
 */
export function beeQueue(
  pool: readonly WordEntry[],
  learntIds: ReadonlySet<string>,
  random: () => number,
): BeeWord[] {
  const words = pool.filter(isSpellable);
  const sorted = [...words].sort((a, b) => spellingDifficulty(a) - spellingDifficulty(b));
  const third = Math.ceil(sorted.length / 3);
  const band = (from: number, to?: number) => {
    const slice = sorted.slice(from, to);
    return [
      ...shuffle(
        slice.filter((w) => learntIds.has(w.id)),
        random,
      ),
      ...shuffle(
        slice.filter((w) => !learntIds.has(w.id)),
        random,
      ),
    ];
  };
  return [
    ...band(0, third)
      .slice(0, BEE_ROUND_LENGTH)
      .map((w) => toBeeWord(w, 1)),
    ...band(third, third * 2)
      .slice(0, BEE_ROUND_LENGTH)
      .map((w) => toBeeWord(w, 2)),
    ...band(third * 2).map((w) => toBeeWord(w, 3)),
  ];
}

export function trickyQueue(words: readonly WordEntry[], random: () => number): BeeWord[] {
  return shuffle(words.filter(isSpellable), random)
    .slice(0, TRICKY_ROUND_LENGTH)
    .map((w) => toBeeWord(w, 1));
}

/**
 * A clue with the word itself (and its forms) blanked out. Stricter than the matching used for
 * gap-fill, which skips quoted words: a definition's "the plural is also 'quid'" must go too.
 */
export function maskWord(text: string, word: Pick<WordEntry, 'term' | 'forms'>): string {
  const phrases = candidatePhrases(word).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return text.replace(new RegExp(`\\b(?:${phrases.join('|')})\\b`, 'gi'), '___');
}

/** The US spelling of a British word, if it has one: not wrong, just not how we do it here. */
export function americanSpelling(term: string): string {
  return term
    .replace(/ise$/, 'ize')
    .replace(/our$/, 'or')
    .replace(/gre$/, 'ger')
    .replace(/^scep/, 'skep');
}

/** Two points a letter, scaled by the round, less a quarter for each letter revealed. */
export function beePoints(word: Pick<BeeWord, 'term' | 'tier'>, reveals: number): number {
  const full = word.term.length * 2 * word.tier;
  return Math.round(full * (1 - REVEAL_PENALTY * reveals));
}

/** How many letters can be revealed: a third of the word, so there's still some spelling to do. */
export function maxReveals(term: string): number {
  return Math.floor(term.length / 3);
}

export interface BeeResult {
  wordId: string;
  term: string;
  typed: string;
  correct: boolean;
  points: number;
}

export interface BeeState {
  status: 'ready' | 'spelling' | 'checked' | 'over';
  mode: BeeMode;
  queue: readonly BeeWord[];
  index: number;
  typed: string;
  /** Letters revealed for the current word. */
  reveals: number;
  /** They've just typed the American spelling of the current word. */
  american: boolean;
  score: number;
  lives: number;
  /** Words spelt right in a row. */
  run: number;
  bestRun: number;
  results: BeeResult[];
}

export type BeeAction =
  | { type: 'start' }
  | { type: 'letter'; letter: string }
  | { type: 'backspace' }
  | { type: 'reveal' }
  | { type: 'check' }
  | { type: 'next' };

export function beeStart(mode: BeeMode, queue: readonly BeeWord[]): BeeState {
  return {
    status: 'ready',
    mode,
    queue,
    index: 0,
    typed: '',
    reveals: 0,
    american: false,
    score: 0,
    lives: BEE_LIVES,
    run: 0,
    bestRun: 0,
    results: [],
  };
}

/** Longer than any word, but stops the answer running off the screen. */
const MAX_TYPED = 24;

function commonPrefix(a: string, b: string): string {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return a.slice(0, i);
}

export function beeReducer(state: BeeState, action: BeeAction): BeeState {
  const word = state.queue[state.index];
  switch (action.type) {
    case 'start':
      return { ...state, status: word ? 'spelling' : 'over' };

    case 'letter':
      if (state.status !== 'spelling' || state.typed.length >= MAX_TYPED) return state;
      return { ...state, typed: state.typed + action.letter.toLowerCase(), american: false };

    case 'backspace':
      if (state.status !== 'spelling') return state;
      return { ...state, typed: state.typed.slice(0, -1), american: false };

    case 'reveal': {
      if (state.status !== 'spelling' || !word || state.reveals >= maxReveals(word.term)) {
        return state;
      }
      // Keep what's right so far, drop what isn't, and add the next letter.
      const prefix = commonPrefix(state.typed, word.term);
      if (prefix.length >= word.term.length) return state;
      return {
        ...state,
        typed: word.term.slice(0, prefix.length + 1),
        reveals: state.reveals + 1,
        american: false,
      };
    }

    case 'check': {
      if (state.status !== 'spelling' || !word || !state.typed) return state;
      const { typed } = state;
      // Not a mistake as such, so it doesn't cost a life: just ask for the British spelling.
      if (typed !== word.term && typed === americanSpelling(word.term)) {
        return { ...state, american: true };
      }
      const correct = typed === word.term;
      const points = correct ? beePoints(word, state.reveals) : 0;
      const run = correct ? state.run + 1 : 0;
      return {
        ...state,
        status: 'checked',
        score: state.score + points,
        lives: correct || state.mode === 'tricky' ? state.lives : state.lives - 1,
        run,
        bestRun: Math.max(state.bestRun, run),
        results: [
          ...state.results,
          { wordId: word.wordId, term: word.term, typed, correct, points },
        ],
      };
    }

    case 'next': {
      if (state.status !== 'checked') return state;
      const index = state.index + 1;
      if (state.lives <= 0 || index >= state.queue.length) return { ...state, status: 'over' };
      return { ...state, status: 'spelling', index, typed: '', reveals: 0, american: false };
    }
  }
}

/** A playful title for a score. */
export function beeTitle(score: number): { title: string; emoji: string } {
  if (score >= 800) return { title: 'Queen Bee', emoji: '👑' };
  if (score >= 400) return { title: 'The Bee’s Knees', emoji: '🏆' };
  if (score >= 200) return { title: 'Buzzing', emoji: '🍯' };
  if (score >= 50) return { title: 'Busy Bee', emoji: '🐝' };
  return { title: 'Bumbling Along', emoji: '🌼' };
}

export interface DiffLetter {
  letter: string;
  /** Is this letter in the right place, relative to the other spelling? */
  ok: boolean;
}

/**
 * Lines up a misspelling with the right spelling and marks the letters that don't match, using
 * the longest common subsequence, so a swapped pair shows up rather than a whole wrong tail.
 */
export function spellingDiff(
  typed: string,
  term: string,
): { typed: DiffLetter[]; term: DiffLetter[] } {
  const rows = typed.length + 1;
  const columns = term.length + 1;
  const lengths = Array.from({ length: rows }, () => new Array<number>(columns).fill(0));
  const at = (i: number, j: number) => lengths[i]![j]!;
  for (let i = typed.length - 1; i >= 0; i--) {
    for (let j = term.length - 1; j >= 0; j--) {
      lengths[i]![j] =
        typed[i] === term[j] ? at(i + 1, j + 1) + 1 : Math.max(at(i + 1, j), at(i, j + 1));
    }
  }
  const typedOk = new Set<number>();
  const termOk = new Set<number>();
  for (let i = 0, j = 0; i < typed.length && j < term.length;) {
    if (typed[i] === term[j]) {
      typedOk.add(i++);
      termOk.add(j++);
    } else if (at(i + 1, j) >= at(i, j + 1)) {
      i++;
    } else {
      j++;
    }
  }
  return {
    typed: [...typed].map((letter, i) => ({ letter, ok: typedOk.has(i) })),
    term: [...term].map((letter, i) => ({ letter, ok: termOk.has(i) })),
  };
}

interface BeeGameRecord {
  game: string;
  playedAt: string;
  words?: readonly { wordId: string; correct: boolean }[];
}

/** Words whose most recent attempt was wrong. Spelling one right takes it off the list. */
export function trickyWordIds(games: readonly BeeGameRecord[]): string[] {
  const latest = new Map<string, boolean>();
  const inOrder = [...games].sort((a, b) => a.playedAt.localeCompare(b.playedAt));
  for (const game of inOrder) {
    for (const { wordId, correct } of game.words ?? []) latest.set(wordId, correct);
  }
  return [...latest].filter(([, correct]) => !correct).map(([wordId]) => wordId);
}
