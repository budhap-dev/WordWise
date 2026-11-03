/**
 * Guards the seed dataset. If you add words and this fails, the message tells you which entry
 * and which rule (see docs/ADDING_WORDS.md).
 */
import { containsTerm } from '../lib/text';
import type { PartOfSpeech } from '../types/content';
import { CATEGORIES, LEVELS, REGISTERS, ROLES, WORDS } from './index';

const PARTS_OF_SPEECH: PartOfSpeech[] = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'phrase',
  'idiom',
  'phrasal verb',
  'collocation',
  'conjunction',
  'preposition',
];

/** Common American spellings that shouldn't appear in user-facing copy. */
const AMERICAN_SPELLINGS =
  /\b(color|favor|behavior|endeavor|honor|organiz|realiz|prioritiz|recogniz|summariz|analyz|optimiz|center|licens(?:e|ing) to|gray|program me)\w*/i;

describe('seed words', () => {
  it('has a healthy supply in every category', () => {
    // Minimums, so adding a word never breaks this test; removing words might.
    const minimum = {
      general: 90,
      student: 30,
      teaching: 30,
      workplace: 30,
      idiom: 90,
      british: 80,
    };
    for (const c of CATEGORIES) {
      const count = WORDS.filter((w) => w.category === c).length;
      expect(count, c).toBeGreaterThanOrEqual(minimum[c]);
    }
  });

  it('has unique kebab-case ids', () => {
    const ids = WORDS.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id, id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it.each(WORDS.map((w) => [w.id, w] as const))('%s is well-formed', (_id, w) => {
    expect(w.term.trim()).not.toBe('');
    expect(w.definition.trim()).not.toBe('');
    expect(PARTS_OF_SPEECH).toContain(w.partOfSpeech);
    expect(REGISTERS).toContain(w.register);
    expect(LEVELS).toContain(w.level);
    expect(CATEGORIES).toContain(w.category);
    expect(w.ipa).toMatch(/^\/.+\/$/);
    expect(w.collocations.length).toBeGreaterThan(0);
    expect(w.synonyms.length).toBeGreaterThan(0);
    for (const s of w.synonyms) {
      expect(Object.keys(s).sort()).toEqual(['note', 'term']);
      expect(s.note.trim()).not.toBe('');
    }
    expect(w.topics.length).toBeGreaterThan(0);
  });

  it.each(WORDS.filter((w) => w.otherMeanings).map((w) => [w.id, w] as const))(
    '%s other meanings each have a meaning and an example',
    (_id, w) => {
      expect(w.otherMeanings!.length).toBeGreaterThan(0);
      const meanings = w.otherMeanings!.map((m) => m.meaning);
      expect(new Set(meanings).size, `${w.id}: duplicate meaning`).toBe(meanings.length);
      for (const m of w.otherMeanings!) {
        expect(m.meaning.trim()).not.toBe('');
        expect(m.meaning, `${w.id}: same as the main definition`).not.toBe(w.definition);
        expect(m.example?.trim(), `${w.id}: "${m.meaning}" needs an example`).toBeTruthy();
      }
    },
  );

  it.each(WORDS.map((w) => [w.id, w] as const))(
    '%s has one example per role, each using the term',
    (_id, w) => {
      for (const role of ROLES) {
        const examples = w.examples.filter((e) => e.role === role);
        expect(examples.length, `${w.id}: missing ${role} example`).toBeGreaterThan(0);
      }
      for (const e of w.examples) {
        expect(containsTerm(e.text, w), `${w.id}: "${e.text}" doesn't use the term`).toBe(true);
      }
    },
  );

  it.each(WORDS.filter((w) => w.upgrade).map((w) => [w.id, w] as const))(
    '%s upgrade prompt: model uses the term, plain sentence does not',
    (_id, w) => {
      expect(containsTerm(w.upgrade!.model, w), `${w.id}: model`).toBe(true);
      expect(containsTerm(w.upgrade!.plain, w), `${w.id}: plain`).toBe(false);
    },
  );

  it('uses British spelling', () => {
    for (const w of WORDS) {
      const text = [
        w.definition,
        w.commonMistake ?? '',
        w.origin ?? '',
        ...w.examples.map((e) => e.text),
        ...w.synonyms.map((s) => s.note),
        ...(w.otherMeanings ?? []).flatMap((m) => [m.meaning, m.example ?? '', m.cue ?? '']),
      ]
        .join(' ')
        // Allow explicit comparisons like "'endeavor' is American".
        .replace(/'[a-z]+'(?= is American)/gi, '');
      expect(text, w.id).not.toMatch(AMERICAN_SPELLINGS);
    }
  });
});
