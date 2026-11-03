import { currentStreak } from './streak';

const TODAY = '2026-11-03';

describe('currentStreak', () => {
  it('is zero with no activity', () => {
    expect(currentStreak(new Set(), TODAY)).toEqual({ days: 0, activeToday: false });
  });

  it('counts consecutive days ending today', () => {
    const dates = new Set(['2026-11-01', '2026-11-02', '2026-11-03', '2026-10-28']);
    expect(currentStreak(dates, TODAY)).toEqual({ days: 3, activeToday: true });
  });

  it("keeps yesterday's streak alive until today is over", () => {
    const dates = new Set(['2026-11-01', '2026-11-02']);
    expect(currentStreak(dates, TODAY)).toEqual({ days: 2, activeToday: false });
  });

  it('resets after a missed day', () => {
    expect(currentStreak(new Set(['2026-11-01']), TODAY).days).toBe(0);
  });

  it('crosses month and year boundaries', () => {
    const dates = new Set(['2026-12-30', '2026-12-31', '2027-01-01']);
    expect(currentStreak(dates, '2027-01-01').days).toBe(3);
  });
});
