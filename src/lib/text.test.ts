import { containsTerm, findTerm, normalise } from './text';

describe('findTerm', () => {
  it('matches a single word case-insensitively', () => {
    expect(findTerm('Two studies Corroborate this.', { term: 'corroborate' })).toEqual({
      start: 12,
      end: 23,
      text: 'Corroborate',
    });
  });

  it('matches inflected forms', () => {
    expect(
      containsTerm('The logs corroborated her story.', {
        term: 'corroborate',
        forms: ['corroborated'],
      }),
    ).toBe(true);
  });

  it('respects word boundaries', () => {
    expect(containsTerm('That inference is weak.', { term: 'infer' })).toBe(false);
  });

  it('prefers the longest form', () => {
    expect(
      findTerm('We followed up on it.', {
        term: 'follow up on',
        forms: ['followed up', 'followed up on'],
      })?.text,
    ).toBe('followed up on');
  });

  it('treats "something"/"someone" as placeholders', () => {
    const entry = { term: 'take something on board', forms: ['taken something on board'] };
    expect(findTerm("I've taken your comments on board.", entry)?.text).toBe(
      'taken your comments on board',
    );
    expect(containsTerm('Can I pick your brains?', { term: "pick someone's brains" })).toBe(true);
  });

  it('accepts curly apostrophes', () => {
    expect(containsTerm('The ball’s in your court.', { term: "the ball's in your court" })).toBe(
      true,
    );
  });

  it('makes a leading article optional', () => {
    expect(
      containsTerm('It was the steepest… no, a really steep learning curve.', {
        term: 'a steep learning curve',
      }),
    ).toBe(true);
    expect(containsTerm('Steep learning curve, that.', { term: 'a steep learning curve' })).toBe(
      true,
    );
  });

  it('treats hyphens and spaces as equivalent', () => {
    expect(containsTerm('There is a trade off here.', { term: 'trade-off' })).toBe(true);
  });
});

describe('normalise', () => {
  it('lower-cases, unifies apostrophes and strips punctuation', () => {
    expect(normalise('  It’s   SPOT on!  ')).toBe("it's spot on");
  });
});
