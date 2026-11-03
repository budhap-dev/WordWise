import { AMERICAN_SPELLINGS } from '../test/britishSpelling';
import { CONFUSABLES, REGISTER_PAIRS, REGISTERS } from './index';

const BLANK = '___';

describe('confusables (choose the better word)', () => {
  it('has a good supply with unique ids', () => {
    expect(CONFUSABLES.length).toBeGreaterThanOrEqual(30);
    expect(new Set(CONFUSABLES.map((c) => c.id)).size).toBe(CONFUSABLES.length);
  });

  it.each(CONFUSABLES.map((c) => [c.id, c] as const))('%s is well-formed', (_id, set) => {
    expect(set.options.length).toBeGreaterThanOrEqual(2);
    expect(new Set(set.options.map((o) => o.toLowerCase())).size).toBe(set.options.length);
    expect(set.items.length).toBeGreaterThan(0);
    for (const item of set.items) {
      expect(item.sentence.split(BLANK).length - 1, item.sentence).toBe(1);
      expect(set.options.map((o) => o.toLowerCase())).toContain(item.answer.toLowerCase());
      expect(item.explanation.trim()).not.toBe('');
      expect(`${item.sentence} ${item.explanation}`).not.toMatch(AMERICAN_SPELLINGS);
    }
  });
});

describe('register pairs (register switch)', () => {
  it('has a good supply with unique ids, in both directions', () => {
    expect(REGISTER_PAIRS.length).toBeGreaterThanOrEqual(25);
    expect(new Set(REGISTER_PAIRS.map((p) => p.id)).size).toBe(REGISTER_PAIRS.length);
    const relaxing = REGISTER_PAIRS.filter((p) => p.toRegister === 'informal');
    expect(relaxing.length).toBeGreaterThanOrEqual(5);
  });

  it.each(REGISTER_PAIRS.map((p) => [p.id, p] as const))('%s is well-formed', (_id, pair) => {
    expect(REGISTERS).toContain(pair.fromRegister);
    expect(REGISTERS).toContain(pair.toRegister);
    expect(pair.fromRegister).not.toBe(pair.toRegister);
    expect(pair.context.trim()).not.toBe('');
    expect(pair.answer).not.toBe(pair.from);
    expect(pair.distractors).toHaveLength(3);
    const choices = [pair.answer, ...pair.distractors.map((d) => d.text)];
    expect(new Set(choices).size, 'choices must be distinct').toBe(choices.length);
    for (const d of pair.distractors) expect(d.why.trim()).not.toBe('');
    const text = [
      pair.from,
      pair.answer,
      pair.explanation,
      ...pair.distractors.flatMap((d) => [d.text, d.why]),
    ];
    expect(text.join(' ')).not.toMatch(AMERICAN_SPELLINGS);
  });
});
