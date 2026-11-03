import { WORDS } from '../../data';
import { hashString, seededRandom } from '../random';
import { containsTerm } from '../text';
import {
  multiplier,
  RUSH_BASE_POINTS,
  RUSH_DURATION_MS,
  RUSH_START,
  RUSH_TIME_BONUS_MS,
  type RushQuestion,
  rushQuestions,
  rushReducer,
  type RushState,
  rushTitle,
} from './rush';

const QUESTIONS = rushQuestions(
  WORDS.slice(0, 120),
  WORDS,
  ['student'],
  seededRandom(hashString('rush')),
  40,
);
const started = rushReducer(RUSH_START, { type: 'start' });

/** Answers the current question right or wrong. */
function play(state: RushState, right: boolean, questions: readonly RushQuestion[] = QUESTIONS) {
  const q = questions[state.index]!;
  const choice = right ? q.answer : (q.answer + 1) % q.options.length;
  return rushReducer(state, { type: 'answer', choice, questions });
}

describe('rushQuestions', () => {
  it('alternates definitions and gap sentences, with four distinct options', () => {
    expect(QUESTIONS).toHaveLength(40);
    expect(QUESTIONS.filter((q) => q.kind === 'sentence').length).toBeGreaterThan(10);
    expect(QUESTIONS.filter((q) => q.kind === 'definition').length).toBeGreaterThan(10);
    for (const q of QUESTIONS) {
      expect(new Set(q.options).size, q.id).toBe(4);
      const word = WORDS.find((w) => w.id === q.wordId)!;
      if (q.kind === 'definition') expect(q.prompt).toBe(word.definition);
      else expect(containsTerm(q.prompt, word), q.id).toBe(false);
    }
  });

  it('never repeats a word', () => {
    expect(new Set(QUESTIONS.map((q) => q.wordId)).size).toBe(QUESTIONS.length);
  });
});

describe('multiplier', () => {
  it.each([
    [0, 1],
    [2, 1],
    [3, 2],
    [5, 2],
    [6, 3],
    [9, 3],
    [10, 4],
    [25, 4],
  ])('a combo of %i scores ×%i', (combo, x) => expect(multiplier(combo)).toBe(x));
});

describe('rushReducer', () => {
  it('starts a fresh round', () => {
    expect(started).toMatchObject({
      status: 'playing',
      score: 0,
      lives: 3,
      timeLeftMs: RUSH_DURATION_MS,
    });
  });

  it('scores right answers with a growing multiplier and adds time', () => {
    let s = { ...started, timeLeftMs: 30_000 };
    for (let i = 0; i < 3; i++) s = play(s, true);
    // 10 + 10 + 20 (third in a row is ×2)
    expect(s.score).toBe(RUSH_BASE_POINTS * 4);
    expect(s.combo).toBe(3);
    expect(s.timeLeftMs).toBe(30_000 + 3 * RUSH_TIME_BONUS_MS);
    expect(s.last).toMatchObject({ correct: true, points: 20 });
  });

  it('never adds time beyond a minute', () => {
    expect(play(started, true).timeLeftMs).toBe(RUSH_DURATION_MS);
  });

  it('costs a life and the combo for a wrong answer, and remembers it', () => {
    let s = play(play(started, true), true);
    s = play(s, false);
    expect(s).toMatchObject({ lives: 2, combo: 0, bestCombo: 2, index: 3 });
    expect(s.answers.at(-1)).toMatchObject({ correct: false });
    expect(s.last).toMatchObject({ correct: false, points: 0 });
  });

  it('ends after three wrong answers', () => {
    let s = started;
    for (let i = 0; i < 3; i++) s = play(s, false);
    expect(s.status).toBe('over');
    // Further answers are ignored.
    expect(play(s, true)).toBe(s);
  });

  it('ends when time runs out', () => {
    const s = rushReducer(started, { type: 'tick', elapsedMs: RUSH_DURATION_MS + 500 });
    expect(s).toMatchObject({ status: 'over', timeLeftMs: 0 });
    expect(rushReducer(RUSH_START, { type: 'tick', elapsedMs: 1000 })).toBe(RUSH_START);
  });

  it('ends if it runs out of questions', () => {
    const two = QUESTIONS.slice(0, 2);
    const s = play(play(started, true, two), true, two);
    expect(s.status).toBe('over');
  });
});

describe('rushTitle', () => {
  it('gets grander as the score rises', () => {
    expect(rushTitle(0).title).toBe('Warming Up');
    expect(rushTitle(60).title).toBe('Spelling Bee');
    expect(rushTitle(700).title).toBe('Lexicographer Royal');
  });
});
