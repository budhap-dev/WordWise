/** Builds practice sessions and chooses which words to practise. */
import type { ConfusableSet, RegisterPair, Role, WordEntry } from '../../types/content';
import { shuffle } from '../random';
import {
  betterWordQuestions,
  gapFillQuestions,
  meaningQuestions,
  registerQuestions,
  upgradeQuestions,
} from './generators';
import type { PracticeMode, Question, SessionMode } from './types';

/** Short sessions: about 3–5 minutes each. Writing takes longer, so upgrade has fewer. */
export const SESSION_SIZE: Record<SessionMode, number> = {
  meaning: 10,
  'gap-fill': 10,
  'better-word': 10,
  register: 8,
  upgrade: 5,
  mixed: 10,
};

/** The mixed bag: a bit of everything, with only one (slower) writing task. */
const MIXED: Record<PracticeMode, number> = {
  meaning: 3,
  'gap-fill': 2,
  'better-word': 2,
  register: 2,
  upgrade: 1,
};

export interface SessionInput {
  mode: SessionMode;
  /** Words to practise, most useful first (see practicePool). */
  pool: readonly WordEntry[];
  /** Every word, for distractors. */
  allWords: readonly WordEntry[];
  confusables: readonly ConfusableSet[];
  registerPairs: readonly RegisterPair[];
  roles: readonly Role[];
  random: () => number;
}

function questionsFor(mode: PracticeMode, count: number, input: SessionInput): Question[] {
  const { pool, allWords, roles, random } = input;
  switch (mode) {
    case 'meaning':
      return meaningQuestions(pool, allWords, roles, random, count);
    case 'gap-fill':
      return gapFillQuestions(pool, allWords, roles, random, count);
    case 'better-word':
      return betterWordQuestions(input.confusables, random, count);
    case 'upgrade':
      return upgradeQuestions(pool, count);
    case 'register':
      return registerQuestions(input.registerPairs, random, count);
  }
}

export function buildSession(input: SessionInput): Question[] {
  if (input.mode !== 'mixed') return questionsFor(input.mode, SESSION_SIZE[input.mode], input);

  // Give each word-based mode different words, so the same word isn't asked three ways.
  const questions: Question[] = [];
  const used = new Set<string>();
  for (const [mode, count] of Object.entries(MIXED) as [PracticeMode, number][]) {
    const pool = input.pool.filter((w) => !used.has(w.id));
    const made = questionsFor(mode, count, { ...input, pool });
    for (const q of made) if (q.wordId) used.add(q.wordId);
    questions.push(...made);
  }
  return shuffle(questions, input.random);
}

export interface PoolCard {
  wordId: string;
  ease: number;
  lapses: number;
}

/**
 * Words to practise: the learner's own words first (shakiest first: forgotten before, or low
 * ease), then topped up with other words for their roles so there's always enough.
 */
export function practicePool(
  cards: readonly PoolCard[],
  eligible: readonly WordEntry[],
  allWords: readonly WordEntry[],
  minSize: number,
  random: () => number,
): { words: WordEntry[]; learnt: number } {
  const byId = new Map(allWords.map((w) => [w.id, w]));
  const learntCards = shuffle(
    cards.filter((c) => byId.has(c.wordId)),
    random,
  );
  const shaky = learntCards.filter((c) => c.lapses > 0 || c.ease < 2.5);
  const solid = learntCards.filter((c) => !(c.lapses > 0 || c.ease < 2.5));
  const learnt = [...shaky, ...solid].map((c) => byId.get(c.wordId)!);

  const learntIds = new Set(learnt.map((w) => w.id));
  const topUp = shuffle(
    eligible.filter((w) => !learntIds.has(w.id)),
    random,
  );
  const words = [...learnt, ...topUp.slice(0, Math.max(0, minSize - learnt.length))];
  return { words, learnt: learnt.length };
}
