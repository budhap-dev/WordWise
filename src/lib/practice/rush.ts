/**
 * Word Rush: a 60-second arcade round. See a definition (or a sentence with a gap), tap the
 * right word. Combos multiply points, right answers add time, wrong ones cost a life.
 *
 * The game is a pure reducer so it can be tested without timers or a browser.
 */
import type { Role, WordEntry } from '../../types/content';
import { shuffle } from '../random';
import { wordDistractors } from './distractors';
import { blankedExample, displayTerm } from './generators';

export const RUSH_DURATION_MS = 60_000;
export const RUSH_LIVES = 3;
export const RUSH_BASE_POINTS = 10;
/** Each right answer buys a little more time, up to the starting minute. */
export const RUSH_TIME_BONUS_MS = 1_500;

export interface RushQuestion {
  id: string;
  wordId: string;
  kind: 'definition' | 'sentence';
  /** A definition, or a sentence with "___". */
  prompt: string;
  options: string[];
  answer: number;
}

/** Points multiplier for a run of right answers: ×2 from 3, ×3 from 6, ×4 from 10. */
export function multiplier(combo: number): number {
  if (combo >= 10) return 4;
  if (combo >= 6) return 3;
  if (combo >= 3) return 2;
  return 1;
}

/** Alternates definitions and gap sentences, so the round doesn't feel samey. */
export function rushQuestions(
  pool: readonly WordEntry[],
  allWords: readonly WordEntry[],
  roles: readonly Role[],
  random: () => number,
  count = 80,
): RushQuestion[] {
  const out: RushQuestion[] = [];
  const words = shuffle(pool, random);
  for (let i = 0; i < words.length && out.length < count; i++) {
    const word = words[i]!;
    const wantSentence = out.length % 2 === 1;
    const blanked = wantSentence ? blankedExample(word, roles) : null;
    const wrong = wordDistractors(word, allWords, 3, random, {
      sameSlotOnly: true,
      avoidSharedTopics: Boolean(blanked),
    }).map((w) => displayTerm(w.term));
    if (wrong.length < 3) continue;
    const options = shuffle([displayTerm(word.term), ...wrong], random);
    out.push({
      id: `rush:${word.id}`,
      wordId: word.id,
      kind: blanked ? 'sentence' : 'definition',
      prompt: blanked ? blanked.sentence : word.definition,
      options,
      answer: options.indexOf(displayTerm(word.term)),
    });
  }
  return out;
}

export interface RushAnswer {
  questionId: string;
  wordId: string;
  correct: boolean;
}

export interface RushState {
  status: 'ready' | 'playing' | 'over';
  index: number;
  score: number;
  lives: number;
  combo: number;
  bestCombo: number;
  timeLeftMs: number;
  answers: RushAnswer[];
  /** The most recent answer, for the "+20 ×2" or "It was…" flash. */
  last?: { correct: boolean; points: number; question: RushQuestion };
}

export type RushAction =
  | { type: 'start' }
  | { type: 'answer'; choice: number; questions: readonly RushQuestion[] }
  | { type: 'tick'; elapsedMs: number };

export const RUSH_START: RushState = {
  status: 'ready',
  index: 0,
  score: 0,
  lives: RUSH_LIVES,
  combo: 0,
  bestCombo: 0,
  timeLeftMs: RUSH_DURATION_MS,
  answers: [],
};

export function rushReducer(state: RushState, action: RushAction): RushState {
  switch (action.type) {
    case 'start':
      return { ...RUSH_START, status: 'playing' };

    case 'tick': {
      if (state.status !== 'playing') return state;
      const timeLeftMs = Math.max(0, state.timeLeftMs - action.elapsedMs);
      return { ...state, timeLeftMs, status: timeLeftMs === 0 ? 'over' : 'playing' };
    }

    case 'answer': {
      if (state.status !== 'playing') return state;
      const question = action.questions[state.index];
      if (!question) return { ...state, status: 'over' };
      const correct = action.choice === question.answer;
      const combo = correct ? state.combo + 1 : 0;
      const points = correct ? RUSH_BASE_POINTS * multiplier(combo) : 0;
      const lives = correct ? state.lives : state.lives - 1;
      const index = state.index + 1;
      const outOfQuestions = index >= action.questions.length;
      return {
        ...state,
        index,
        score: state.score + points,
        lives,
        combo,
        bestCombo: Math.max(state.bestCombo, combo),
        timeLeftMs: correct
          ? Math.min(RUSH_DURATION_MS, state.timeLeftMs + RUSH_TIME_BONUS_MS)
          : state.timeLeftMs,
        answers: [...state.answers, { questionId: question.id, wordId: question.wordId, correct }],
        last: { correct, points, question },
        status: lives <= 0 || outOfQuestions ? 'over' : 'playing',
      };
    }
  }
}

/** A playful title for a score. */
export function rushTitle(score: number): { title: string; emoji: string } {
  if (score >= 600) return { title: 'Lexicographer Royal', emoji: '👑' };
  if (score >= 400) return { title: 'Walking Thesaurus', emoji: '📚' };
  if (score >= 250) return { title: 'Crossword Champion', emoji: '🏆' };
  if (score >= 120) return { title: 'Word Nerd', emoji: '🤓' };
  if (score >= 50) return { title: 'Spelling Bee', emoji: '🐝' };
  return { title: 'Warming Up', emoji: '☕' };
}
