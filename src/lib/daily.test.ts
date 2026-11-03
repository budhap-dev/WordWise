import { WORDS } from '../data';
import { selectDailyWords } from './daily';

const base = {
  words: WORDS,
  roles: ['software'] as const,
  level: 'advanced' as const,
  size: 10,
  date: '2026-11-03',
};

describe('selectDailyWords', () => {
  it('returns the requested number of words', () => {
    expect(selectDailyWords({ ...base, roles: [...base.roles] })).toHaveLength(10);
  });

  it('is deterministic for a given date', () => {
    const a = selectDailyWords({ ...base, roles: ['software'] }).map((w) => w.id);
    const b = selectDailyWords({ ...base, roles: ['software'] }).map((w) => w.id);
    expect(a).toEqual(b);
  });

  it('changes from day to day', () => {
    const a = selectDailyWords({ ...base, roles: ['software'] }).map((w) => w.id);
    const b = selectDailyWords({ ...base, roles: ['software'], date: '2026-11-04' }).map(
      (w) => w.id,
    );
    expect(a).not.toEqual(b);
  });

  it('only uses categories unlocked by the selected roles', () => {
    const set = selectDailyWords({ ...base, roles: ['software'], size: 100 });
    const categories = new Set(set.map((w) => w.category));
    expect([...categories].sort()).toEqual(['british', 'general', 'idiom', 'workplace']);
  });

  it('mixes categories rather than clumping them', () => {
    const set = selectDailyWords({ ...base, roles: ['student', 'teacher', 'software'], size: 6 });
    expect(new Set(set.map((w) => w.category)).size).toBe(6);
  });

  it('puts words at or below the learner level first', () => {
    const set = selectDailyWords({ ...base, roles: ['teacher'], level: 'upper-intermediate' });
    expect(set.every((w) => w.level === 'upper-intermediate')).toBe(true);
  });

  it('skips excluded words', () => {
    const first = selectDailyWords({ ...base, roles: ['software'] });
    const excludeIds = new Set(first.map((w) => w.id));
    const second = selectDailyWords({ ...base, roles: ['software'], excludeIds });
    expect(second.some((w) => excludeIds.has(w.id))).toBe(false);
  });

  it('serves only shared categories to the generic everyday role', () => {
    const set = selectDailyWords({ ...base, roles: ['everyday'], size: 100 });
    expect([...new Set(set.map((w) => w.category))].sort()).toEqual([
      'british',
      'general',
      'idiom',
    ]);
  });
});
