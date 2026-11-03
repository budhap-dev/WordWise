import { CONFUSABLES, getWord, REGISTER_PAIRS, WORDS } from '../../data';
import type { WordEntry } from '../../types/content';
import { hashString, seededRandom } from '../random';
import { containsTerm, normalise } from '../text';
import { wordDistractors } from './distractors';
import {
  betterWordQuestions,
  blankedExample,
  displayTerm,
  gapFillQuestions,
  meaningQuestions,
  registerQuestions,
  upgradeQuestions,
} from './generators';
import { buildSession, practicePool, SESSION_SIZE, type SessionInput } from './session';
import type { ChoiceQuestion, PracticeMode, Question } from './types';

const rng = (seed = 'test') => seededRandom(hashString(seed));
const word = (id: string) => getWord(id)!;

function expectValidChoice(q: ChoiceQuestion) {
  expect(q.options.length, q.id).toBeGreaterThanOrEqual(2);
  expect(new Set(q.options).size, `${q.id}: duplicate options`).toBe(q.options.length);
  expect(q.answer, q.id).toBeGreaterThanOrEqual(0);
  expect(q.answer, q.id).toBeLessThan(q.options.length);
  expect(q.explanation.trim(), q.id).not.toBe('');
}

describe('wordDistractors', () => {
  it('never offers the word itself or one of its synonyms', () => {
    for (const target of WORDS) {
      const picks = wordDistractors(target, WORDS, 3, rng(target.id));
      expect(picks).toHaveLength(3);
      const synonyms = new Set(target.synonyms.map((s) => normalise(s.term)));
      for (const p of picks) {
        expect(p.id).not.toBe(target.id);
        expect(synonyms.has(normalise(p.term)), `${target.id} ↔ ${p.id}`).toBe(false);
        expect(p.synonyms.some((s) => normalise(s.term) === normalise(target.term))).toBe(false);
      }
    }
  });

  it('prefers the same part of speech', () => {
    const picks = wordDistractors(word('mitigate'), WORDS, 3, rng());
    for (const p of picks) expect(p.partOfSpeech).toBe('verb');
  });
});

describe('meaning questions', () => {
  it('asks for the definition, with three other definitions as distractors', () => {
    const pool = WORDS.slice(0, 12);
    const qs = meaningQuestions(pool, WORDS, ['teacher'], rng(), 10);
    expect(qs).toHaveLength(10);
    for (const [i, q] of qs.entries()) {
      expectValidChoice(q);
      expect(q.options).toHaveLength(4);
      expect(q.prompt).toBe(pool[i]!.term);
      expect(q.options[q.answer]).toBe(pool[i]!.definition);
    }
  });
});

describe('gap fill', () => {
  it('blanks the term out of an example, once', () => {
    const blanked = blankedExample(word('mitigate'), ['software'])!;
    expect(blanked.sentence.split('___')).toHaveLength(2);
    expect(containsTerm(blanked.sentence, word('mitigate'))).toBe(false);
    expect(containsTerm(blanked.solution, word('mitigate'))).toBe(true);
  });

  it('keeps a leading article outside the gap', () => {
    const blanked = blankedExample(word('steep-learning-curve'), ['software'])!;
    expect(blanked.sentence).toMatch(/\ba ___/);
  });

  it('avoids distractors that share a topic with the answer', () => {
    const qs = gapFillQuestions([word('pragmatic')], WORDS, ['everyday'], rng(), 1);
    const topics = word('pragmatic').topics;
    for (const [i, o] of qs[0]!.options.entries()) {
      if (i === qs[0]!.answer) continue;
      const w = WORDS.find((x) => displayTerm(x.term) === o)!;
      expect(
        w.topics.some((t) => topics.includes(t)),
        o,
      ).toBe(false);
    }
  });

  it('skips phrases with a variable part', () => {
    expect(blankedExample(word('take-on-board'), ['teacher'])).toBeNull();
  });

  it('works for every eligible word, for every role', () => {
    for (const role of ['student', 'teacher', 'software', 'everyday'] as const) {
      const qs = gapFillQuestions(WORDS, WORDS, [role], rng(role), WORDS.length);
      expect(qs.length).toBeGreaterThan(WORDS.length - 10);
      for (const q of qs) {
        expectValidChoice(q);
        const target = word(q.wordId!);
        expect(q.options[q.answer]).toBe(displayTerm(target.term));
        for (const o of q.options) expect(o, q.id).not.toMatch(/^(a|an|the) /i);
        expect(q.prompt, q.id).not.toMatch(/(^|[.?!]\s)___[.!?]*$/);
        expect(q.prompt.split('___'), q.id).toHaveLength(2);
        expect(containsTerm(q.prompt, target), q.id).toBe(false);
      }
    }
  });
});

describe('choose the better word', () => {
  it('uses one item per confusable set, with the right answer marked', () => {
    const qs = betterWordQuestions(CONFUSABLES, rng(), 10);
    expect(qs).toHaveLength(10);
    const sets = qs.map((q) => q.itemId.split('#')[0]);
    expect(new Set(sets).size).toBe(10);
    for (const q of qs) {
      expectValidChoice(q);
      expect(q.solution).toBe(q.prompt.replace('___', q.options[q.answer]!));
    }
  });
});

describe('register switch', () => {
  it('mixes the answer in with the distractors, each explained', () => {
    const qs = registerQuestions(REGISTER_PAIRS, rng(), 8);
    expect(qs).toHaveLength(8);
    for (const q of qs) {
      expectValidChoice(q);
      const pair = REGISTER_PAIRS.find((p) => p.id === q.itemId)!;
      expect(q.options[q.answer]).toBe(pair.answer);
      expect(q.context).toBe(pair.context);
      q.options.forEach((_, i) => {
        if (i === q.answer) expect(q.why![i]).toBeUndefined();
        else expect(q.why![i]?.trim()).toBeTruthy();
      });
    }
  });
});

describe('upgrade questions', () => {
  it('only uses words with an upgrade prompt', () => {
    const pool = [word('quite'), word('nuance'), word('succinct')];
    const qs = upgradeQuestions(pool, 5);
    expect(qs.map((q) => q.wordId)).toEqual(['nuance', 'succinct']);
    expect(qs[0]).toMatchObject({ plain: word('nuance').upgrade!.plain, term: 'nuance' });
  });
});

describe('buildSession', () => {
  const input = (mode: SessionInput['mode'], seed = 'session'): SessionInput => ({
    mode,
    pool: WORDS.slice(20, 60),
    allWords: WORDS,
    confusables: CONFUSABLES,
    registerPairs: REGISTER_PAIRS,
    roles: ['student'],
    random: rng(seed),
  });

  it.each(['meaning', 'gap-fill', 'better-word', 'register', 'upgrade'] as PracticeMode[])(
    '%s sessions have the standard length and unique questions',
    (mode) => {
      const qs = buildSession(input(mode));
      expect(qs).toHaveLength(SESSION_SIZE[mode]);
      expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
      for (const q of qs) expect(q.mode).toBe(mode);
    },
  );

  it('mixes every mode, without repeating a word', () => {
    const qs = buildSession(input('mixed'));
    expect(qs).toHaveLength(SESSION_SIZE.mixed);
    expect(new Set(qs.map((q) => q.mode))).toEqual(
      new Set(['meaning', 'gap-fill', 'better-word', 'register', 'upgrade']),
    );
    const wordIds = qs.flatMap((q: Question) => (q.wordId ? [q.wordId] : []));
    expect(new Set(wordIds).size).toBe(wordIds.length);
  });

  it('is deterministic for a seed, and varies between seeds', () => {
    const ids = (seed: string) => buildSession(input('mixed', seed)).map((q) => q.id);
    expect(ids('a')).toEqual(ids('a'));
    expect(ids('a')).not.toEqual(ids('b'));
  });
});

describe('practicePool', () => {
  const eligible: WordEntry[] = WORDS.filter((w) => w.category === 'general');

  it('puts learnt words first, shakiest first, then tops up', () => {
    const cards = [
      { wordId: 'nuance', ease: 2.5, lapses: 0 },
      { wordId: 'caveat', ease: 1.8, lapses: 0 },
      { wordId: 'candid', ease: 2.5, lapses: 2 },
    ];
    const { words, learnt } = practicePool(cards, eligible, WORDS, 10, rng());
    expect(learnt).toBe(3);
    expect(words).toHaveLength(10);
    expect(new Set(words.slice(0, 2).map((w) => w.id))).toEqual(new Set(['caveat', 'candid']));
    expect(words[2]!.id).toBe('nuance');
    expect(new Set(words.map((w) => w.id)).size).toBe(10);
  });

  it('ignores cards for words that no longer exist', () => {
    const { words, learnt } = practicePool(
      [{ wordId: 'gone', ease: 2.5, lapses: 0 }],
      eligible,
      WORDS,
      5,
      rng(),
    );
    expect(learnt).toBe(0);
    expect(words).toHaveLength(5);
  });

  it("doesn't top up when there are enough learnt words", () => {
    const cards = WORDS.slice(0, 30).map((w) => ({ wordId: w.id, ease: 2.5, lapses: 0 }));
    const { words } = practicePool(cards, eligible, WORDS, 20, rng());
    expect(words).toHaveLength(30);
  });
});
