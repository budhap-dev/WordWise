import { ROLES, WORDS } from '../../data';
import type { WordEntry } from '../../types/content';
import { seededRandom } from '../random';
import {
  americanSpelling,
  BEE_ROUND_LENGTH,
  beePoints,
  beeQueue,
  beeReducer,
  beeStart,
  type BeeState,
  type BeeWord,
  beeTitle,
  isSpellable,
  maskWord,
  maxReveals,
  spellingDiff,
  spellingDifficulty,
  TRICKY_ROUND_LENGTH,
  trickyQueue,
  trickyWordIds,
} from './bee';
import { blankedExample } from './generators';

const QUEUE: BeeWord[] = [
  { wordId: 'gauge', term: 'gauge', tier: 1 },
  { wordId: 'synthesise', term: 'synthesise', tier: 2 },
  { wordId: 'candid', term: 'candid', tier: 3 },
];

function play(state: BeeState, ...actions: Parameters<typeof beeReducer>[1][]) {
  return actions.reduce(beeReducer, state);
}

function spell(state: BeeState, text: string) {
  return play(state, ...[...text].map((letter) => ({ type: 'letter' as const, letter })), {
    type: 'check',
  });
}

const started = () => beeReducer(beeStart('bee', QUEUE), { type: 'start' });

describe('choosing words', () => {
  const spellable = WORDS.filter(isSpellable);

  it('only asks for single, lower-case words', () => {
    expect(isSpellable({ term: 'gauge' })).toBe(true);
    expect(isSpellable({ term: 'trade-off' })).toBe(false);
    expect(isSpellable({ term: 'the crux' })).toBe(false);
    expect(spellable.length).toBeGreaterThan(200);
  });

  it('never gives the word away in its clue', () => {
    for (const word of spellable) {
      const itself = new RegExp(`\\b${word.term}\\b`, 'i');
      expect(maskWord(word.definition, word), word.term).not.toMatch(itself);
      for (const role of ROLES) {
        const example = blankedExample(word, [role]);
        if (example) expect(maskWord(example.sentence, word), word.term).not.toMatch(itself);
      }
    }
  });

  it('blanks out quoted words and other forms, whatever their case', () => {
    const word = { term: 'quid', forms: ['quids'] };
    expect(maskWord("The plural is also 'quid'.", word)).toBe("The plural is also '___'.");
    expect(maskWord('Quid pro quo, and quids in.', word)).toBe('___ pro quo, and ___ in.');
    expect(maskWord('A liquid squid.', word)).toBe('A liquid squid.');
  });

  it('ranks words by how hard they are to spell', () => {
    const score = (term: string) =>
      spellingDifficulty(WORDS.find((w) => w.term === term) as WordEntry);
    expect(score('daft')).toBeLessThan(score('frugal'));
    expect(score('frugal')).toBeLessThan(score('conscientious'));
  });

  it('plays five easy, five middling, then all the hard words', () => {
    const queue = beeQueue(spellable, new Set(), seededRandom(1));
    const tiers = queue.map((w) => w.tier);
    expect(tiers.slice(0, BEE_ROUND_LENGTH)).toEqual(Array(BEE_ROUND_LENGTH).fill(1));
    expect(tiers.slice(BEE_ROUND_LENGTH, BEE_ROUND_LENGTH * 2)).toEqual(
      Array(BEE_ROUND_LENGTH).fill(2),
    );
    expect(tiers.slice(BEE_ROUND_LENGTH * 2).every((t) => t === 3)).toBe(true);
    expect(queue.length).toBeGreaterThan(50);
    expect(new Set(queue.map((w) => w.wordId)).size).toBe(queue.length);

    const easiest = Math.max(
      ...queue
        .slice(0, BEE_ROUND_LENGTH)
        .map((w) => spellingDifficulty(WORDS.find((x) => x.id === w.wordId)!)),
    );
    const hardest = Math.min(
      ...queue
        .slice(BEE_ROUND_LENGTH * 2)
        .map((w) => spellingDifficulty(WORDS.find((x) => x.id === w.wordId)!)),
    );
    expect(easiest).toBeLessThanOrEqual(hardest);
  });

  it('puts the learner’s own words first in each band', () => {
    const all = beeQueue(spellable, new Set(), seededRandom(1));
    const mine = all.at(-1)!.wordId;
    const queue = beeQueue(spellable, new Set([mine]), seededRandom(1));
    expect(queue[BEE_ROUND_LENGTH * 2]!.wordId).toBe(mine);
  });

  it('skips phrases, and keeps a tricky round short', () => {
    const queue = beeQueue(WORDS, new Set(), seededRandom(2));
    expect(queue.every((w) => isSpellable(w))).toBe(true);
    expect(trickyQueue(spellable, seededRandom(3))).toHaveLength(TRICKY_ROUND_LENGTH);
  });
});

describe('scoring', () => {
  it('gives two points a letter, scaled by the round', () => {
    expect(beePoints({ term: 'gauge', tier: 1 }, 0)).toBe(10);
    expect(beePoints({ term: 'gauge', tier: 3 }, 0)).toBe(30);
  });

  it('takes a quarter off for each letter revealed', () => {
    expect(beePoints({ term: 'synthesise', tier: 2 }, 0)).toBe(40);
    expect(beePoints({ term: 'synthesise', tier: 2 }, 1)).toBe(30);
    expect(beePoints({ term: 'synthesise', tier: 2 }, 3)).toBe(10);
  });

  it('gives a title for every score', () => {
    expect(beeTitle(0).title).toBe('Bumbling Along');
    expect(beeTitle(400).title).toBe('The Bee’s Knees');
    expect(beeTitle(5000).title).toBe('Queen Bee');
  });
});

describe('playing', () => {
  it('scores a right answer and moves on', () => {
    const state = spell(started(), 'gauge');
    expect(state.status).toBe('checked');
    expect(state.score).toBe(10);
    expect(state.lives).toBe(3);
    expect(state.results[0]).toMatchObject({ correct: true, typed: 'gauge', points: 10 });

    const next = beeReducer(state, { type: 'next' });
    expect(next).toMatchObject({ status: 'spelling', index: 1, typed: '', reveals: 0 });
  });

  it('costs a life for a misspelling, and breaks the run', () => {
    let state = spell(started(), 'gauge');
    expect(state.run).toBe(1);
    state = spell(beeReducer(state, { type: 'next' }), 'synthesis');
    expect(state).toMatchObject({ lives: 2, run: 0, bestRun: 1, score: 10 });
    expect(state.results[1]).toMatchObject({ correct: false, points: 0 });
  });

  it('ignores case, and ignores a check with nothing typed', () => {
    expect(spell(started(), 'GAUGE').results[0]?.correct).toBe(true);
    expect(beeReducer(started(), { type: 'check' }).status).toBe('spelling');
  });

  it('lets letters be deleted', () => {
    const state = play(
      started(),
      { type: 'letter', letter: 'g' },
      { type: 'letter', letter: 'x' },
      { type: 'backspace' },
    );
    expect(state.typed).toBe('g');
  });

  it('ignores typing once checked', () => {
    const state = spell(started(), 'gauge');
    expect(beeReducer(state, { type: 'letter', letter: 'x' }).typed).toBe('gauge');
    expect(beeReducer(state, { type: 'backspace' }).typed).toBe('gauge');
    expect(beeReducer(state, { type: 'check' })).toBe(state);
  });

  it('shows the right answer before the game ends on the last life', () => {
    const wrong = (state: BeeState) => spell(state, 'zzz');
    let state = wrong(started());
    state = wrong(beeReducer(state, { type: 'next' }));
    state = wrong(beeReducer(state, { type: 'next' }));
    expect(state).toMatchObject({ status: 'checked', lives: 0 });
    expect(beeReducer(state, { type: 'next' }).status).toBe('over');
  });

  it('ends with lives to spare when the words run out', () => {
    let state = started();
    for (const { term } of QUEUE) state = beeReducer(spell(state, term), { type: 'next' });
    expect(state).toMatchObject({ status: 'over', lives: 3, bestRun: 3 });
  });

  it('has no lives to lose in a tricky round', () => {
    const state = spell(beeReducer(beeStart('tricky', QUEUE), { type: 'start' }), 'zzz');
    expect(state.lives).toBe(3);
    expect(state.results[0]?.correct).toBe(false);
  });

  it('goes straight to the end when there are no words at all', () => {
    expect(beeReducer(beeStart('tricky', []), { type: 'start' }).status).toBe('over');
  });
});

describe('revealing letters', () => {
  it('fills in the next letter and reduces the points', () => {
    const state = play(started(), { type: 'reveal' });
    expect(state).toMatchObject({ typed: 'g', reveals: 1 });
    expect(spell(state, 'auge').score).toBe(8);
  });

  it('keeps what’s right so far and fixes the rest', () => {
    const state = play(
      started(),
      { type: 'letter', letter: 'g' },
      { type: 'letter', letter: 'u' },
      { type: 'letter', letter: 'a' },
      { type: 'reveal' },
    );
    expect(state.typed).toBe('ga');
  });

  it('stops at a third of the word', () => {
    expect(maxReveals('gauge')).toBe(1);
    expect(maxReveals('synthesise')).toBe(3);
    const state = play(started(), { type: 'reveal' }, { type: 'reveal' });
    expect(state).toMatchObject({ typed: 'g', reveals: 1 });
  });
});

describe('American spellings', () => {
  it('knows the US spelling of a British word', () => {
    expect(americanSpelling('synthesise')).toBe('synthesize');
    expect(americanSpelling('endeavour')).toBe('endeavor');
    expect(americanSpelling('meagre')).toBe('meager');
    expect(americanSpelling('sceptical')).toBe('skeptical');
    expect(americanSpelling('gauge')).toBe('gauge');
  });

  it('asks again rather than costing a life', () => {
    const second = beeReducer(spell(started(), 'gauge'), { type: 'next' });
    const state = spell(second, 'synthesize');
    expect(state).toMatchObject({ status: 'spelling', american: true, lives: 3 });
    expect(state.results).toHaveLength(1);

    expect(beeReducer(state, { type: 'backspace' }).american).toBe(false);
  });
});

describe('spellingDiff', () => {
  const wrong = (letters: { letter: string; ok: boolean }[]) =>
    letters.filter((l) => !l.ok).map((l) => l.letter);

  it('finds nothing wrong with the right spelling', () => {
    const diff = spellingDiff('gauge', 'gauge');
    expect(wrong(diff.typed)).toEqual([]);
    expect(wrong(diff.term)).toEqual([]);
  });

  it('points at a swapped pair, not the whole tail', () => {
    const diff = spellingDiff('guage', 'gauge');
    expect(wrong(diff.typed)).toHaveLength(1);
    expect(wrong(diff.term)).toHaveLength(1);
  });

  it('points at a missing letter', () => {
    const diff = spellingDiff('rubish', 'rubbish');
    expect(wrong(diff.typed)).toEqual([]);
    expect(wrong(diff.term)).toEqual(['b']);
  });

  it('points at an extra letter', () => {
    const diff = spellingDiff('wonkky', 'wonky');
    expect(wrong(diff.typed)).toEqual(['k']);
    expect(wrong(diff.term)).toEqual([]);
  });

  it('copes with nothing in common', () => {
    const diff = spellingDiff('zz', 'gauge');
    expect(wrong(diff.typed)).toEqual(['z', 'z']);
    expect(wrong(diff.term)).toHaveLength(5);
  });
});

describe('trickyWordIds', () => {
  const game = (playedAt: string, ...words: [string, boolean][]) => ({
    game: 'bee',
    playedAt,
    words: words.map(([wordId, correct]) => ({ wordId, correct })),
  });

  it('lists words whose latest attempt was wrong', () => {
    expect(trickyWordIds([game('2026-11-01', ['a', false], ['b', true])])).toEqual(['a']);
  });

  it('takes a word off the list once it’s spelt right, in order of play', () => {
    const games = [game('2026-11-02', ['a', true]), game('2026-11-01', ['a', false], ['b', false])];
    expect(trickyWordIds(games)).toEqual(['b']);
  });

  it('puts a word back if it’s misspelt again', () => {
    const games = [game('2026-11-01', ['a', true]), game('2026-11-02', ['a', false])];
    expect(trickyWordIds(games)).toEqual(['a']);
  });

  it('copes with games that have no word list', () => {
    expect(trickyWordIds([{ game: 'bee', playedAt: '2026-11-01' }])).toEqual([]);
  });
});
