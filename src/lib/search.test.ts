import { getWord, WORDS } from '../data';
import type { WordEntry } from '../types/content';
import { relatedEntries } from './related';
import {
  activeFilterCount,
  fold,
  NO_FILTERS,
  parseRelation,
  searchWords,
  snippet,
  sortKey,
} from './search';

const terms = (query: string) => searchWords(WORDS, query).map((r) => r.word.term);

function word(overrides: Partial<WordEntry> & Pick<WordEntry, 'id' | 'term'>): WordEntry {
  return {
    partOfSpeech: 'adjective',
    ipa: '/x/',
    definition: 'A test word.',
    examples: [],
    register: 'neutral',
    collocations: [],
    synonyms: [],
    category: 'general',
    topics: [],
    level: 'advanced',
    ...overrides,
  };
}

describe('fold', () => {
  it('ignores case, accents, apostrophes and punctuation', () => {
    expect(fold('Bob’s your Uncle!')).toBe('bobs your uncle');
    expect(fold('Naïve café')).toBe('naive cafe');
    expect(fold('well-being')).toBe('well being');
  });
});

describe('searchWords', () => {
  it('lists every word A to Z, ignoring a leading article, when there is no query', () => {
    const all = searchWords(WORDS, '  ');
    expect(all).toHaveLength(WORDS.length);
    const keys = all.map((r) => sortKey(r.word.term).toLowerCase());
    expect(keys.indexOf('cuppa')).toBeLessThan(keys.indexOf('cut corners'));
  });

  it('puts an exact match for the term first', () => {
    expect(terms('chuffed')[0]).toBe('chuffed');
    expect(terms('CHUFFED')[0]).toBe('chuffed');
  });

  it('forgives missing apostrophes and placeholders like "something"', () => {
    expect(terms('bobs your uncle')[0]).toBe("Bob's your uncle");
    expect(terms('take on board')[0]).toBe('take something on board');
  });

  it('finds words by synonym, and says so', () => {
    const [first] = searchWords(WORDS, 'terse');
    expect(first?.word.id).toBe('succinct');
    expect(first?.reason).toEqual({ field: 'synonym', text: 'terse' });
  });

  it('finds words by their definition', () => {
    expect(terms('tired')).toContain('knackered');
  });

  it('finds words by topic', () => {
    const results = searchWords(WORDS, 'meetings');
    expect(results.length).toBeGreaterThan(5);
    expect(
      results.every((r) => r.word.topics.includes('meetings') || r.reason?.field !== 'topic'),
    ).toBe(true);
  });

  it('answers "opposite of …" and "another word for …"', () => {
    expect(terms('opposite of lazy')).toContain('diligent');
    expect(terms('Opposite of chuffed')).toEqual(expect.arrayContaining(['gutted', 'cheesed off']));
    expect(terms('another word for chuffed')).toContain('made up');
  });

  it('looks up the word itself for "another word for …" when no synonym is listed', () => {
    expect(terms('another word for tired')).toContain('knackered');
    // Never the opposite: "opposite of tired" mustn't suggest "knackered".
    expect(terms('opposite of tired')).not.toContain('knackered');
  });

  it('falls back to a plain search when nothing is related', () => {
    const words = [word({ id: 'x', term: 'opposite number' })];
    expect(searchWords(words, 'opposite number').map((r) => r.word.id)).toEqual(['x']);
  });

  it('doesn’t match noise inside other words or in scattered little words', () => {
    // "latin" is inside "escalating", and "up" is everywhere.
    expect(terms('latin')).not.toContain('escalate');
    expect(terms('fed up')).not.toContain('hypothesise');
  });

  it('matches inside the headword itself for longer queries', () => {
    const words = [word({ id: 'contribute', term: 'contribute' })];
    expect(searchWords(words, 'tribut')).toHaveLength(1);
    expect(searchWords(words, 'tri')).toHaveLength(0);
  });

  it('treats compounds with and without spaces alike', () => {
    const words = [word({ id: 'wb', term: 'well-being' })];
    expect(searchWords(words, 'wellbeing')).toHaveLength(1);
  });

  it('matches only the start of the term for a single letter', () => {
    const results = searchWords(WORDS, 'q');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => fold(r.word.term).startsWith('q'))).toBe(true);
  });

  it('filters by category, level, register and progress', () => {
    const british = searchWords(WORDS, '', { ...NO_FILTERS, category: 'british' });
    expect(british.length).toBeGreaterThan(0);
    expect(british.every((r) => r.word.category === 'british')).toBe(true);

    const formalProficient = searchWords(WORDS, '', {
      ...NO_FILTERS,
      levels: ['proficient'],
      registers: ['formal'],
    });
    expect(formalProficient.every((r) => r.word.level === 'proficient')).toBe(true);
    expect(formalProficient.every((r) => r.word.register === 'formal')).toBe(true);

    const status = { learnt: new Set(['chuffed', 'succinct']), due: new Set(['chuffed']) };
    const ids = (f: typeof NO_FILTERS) => searchWords(WORDS, '', f, status).map((r) => r.word.id);
    expect(ids({ ...NO_FILTERS, status: 'learnt' }).sort()).toEqual(['chuffed', 'succinct']);
    expect(ids({ ...NO_FILTERS, status: 'due' })).toEqual(['chuffed']);
    expect(ids({ ...NO_FILTERS, status: 'new' })).toHaveLength(WORDS.length - 2);
  });

  it('returns nothing for gibberish', () => {
    expect(searchWords(WORDS, 'xyzzy plugh')).toEqual([]);
  });
});

describe('parseRelation', () => {
  it.each([
    ['opposite of lazy', 'antonym', 'lazy'],
    ['the opposite of lazy', 'antonym', 'lazy'],
    ['antonym for happy', 'antonym', 'happy'],
    ['another word for happy', 'synonym', 'happy'],
    ['synonyms of tired', 'synonym', 'tired'],
    ['similar to chuffed', 'synonym', 'chuffed'],
  ])('reads "%s"', (query, relation, target) => {
    expect(parseRelation(query)).toEqual({ relation, target });
  });

  it('leaves ordinary searches alone', () => {
    expect(parseRelation('opposite')).toBeNull();
    expect(parseRelation('chuffed')).toBeNull();
  });
});

describe('activeFilterCount', () => {
  it('counts the filters in the sheet, not the category chips', () => {
    expect(activeFilterCount(NO_FILTERS)).toBe(0);
    expect(activeFilterCount({ ...NO_FILTERS, category: 'idiom' })).toBe(0);
    expect(
      activeFilterCount({ category: 'all', status: 'due', levels: ['advanced'], registers: [] }),
    ).toBe(2);
  });
});

describe('snippet', () => {
  it('keeps short text whole and trims long text around the match', () => {
    expect(snippet('Short and sweet.', 'sweet')).toBe('Short and sweet.');
    const long =
      'The committee met on Tuesday to discuss the budget, and after a great deal of debate they finally agreed to postpone the decision until spring.';
    const s = snippet(long, 'postpone', 20);
    expect(s).toContain('postpone');
    expect(s.startsWith('…')).toBe(true);
    expect(s.length).toBeLessThan(long.length);
  });
});

describe('relatedEntries', () => {
  it('links synonyms and opposites that are headwords, in both directions', () => {
    const chuffed = getWord('chuffed')!;
    const { similar, opposite } = relatedEntries(chuffed);
    expect(opposite.map((w) => w.term)).toEqual(expect.arrayContaining(['gutted', 'cheesed off']));
    expect(similar.map((w) => w.term)).toContain('made up');
    expect([...similar, ...opposite].some((w) => w.id === chuffed.id)).toBe(false);
  });

  it('includes entries that list this word, even when it doesn’t list them', () => {
    const a = word({ id: 'a', term: 'alpha' });
    const b = word({ id: 'b', term: 'beta', antonyms: [{ term: 'Alpha' }] });
    expect(relatedEntries(a, [a, b]).opposite.map((w) => w.id)).toEqual(['b']);
  });
});
