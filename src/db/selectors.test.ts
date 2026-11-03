import { type CardRecord, newCard } from './db';
import { dueCards, introducedBefore, introducedOn } from './selectors';

const card = (wordId: string, introduced: string, due: string): CardRecord => ({
  ...newCard(wordId, introduced),
  due,
});

const CARDS = [
  card('a', '2026-10-01', '2026-11-05'),
  card('b', '2026-10-20', '2026-11-03'),
  card('c', '2026-11-02', '2026-11-01'),
  card('d', '2026-11-03', '2026-11-04'),
  card('e', '2026-10-30', '2026-11-03'),
];

describe('progress selectors', () => {
  it('splits words learnt before today from those learnt today', () => {
    expect([...introducedBefore(CARDS, '2026-11-03')].sort()).toEqual(['a', 'b', 'c', 'e']);
    expect([...introducedOn(CARDS, '2026-11-03')]).toEqual(['d']);
  });

  it('lists due and overdue cards, most overdue first', () => {
    expect(dueCards(CARDS, '2026-11-03').map((c) => c.wordId)).toEqual(['c', 'b', 'e']);
  });

  it('skips cards for words that no longer exist', () => {
    expect(dueCards(CARDS, '2026-11-03', new Set(['b', 'e'])).map((c) => c.wordId)).toEqual([
      'b',
      'e',
    ]);
  });
});
