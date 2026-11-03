import { addDays } from './date';
import { dailyFun, rewardJoke } from './fun';

describe('dailyFun', () => {
  it('is stable for a given day', () => {
    expect(dailyFun('2026-11-03', ['teacher'])).toEqual(dailyFun('2026-11-03', ['teacher']));
  });

  it('serves both jokes and sayings over a month', () => {
    const kinds = new Set(
      Array.from({ length: 30 }, (_, i) => dailyFun(addDays('2026-11-01', i), ['student']).kind),
    );
    expect(kinds).toEqual(new Set(['joke', 'saying']));
  });

  it('only serves role-specific jokes to that role', () => {
    for (let i = 0; i < 60; i++) {
      const fun = dailyFun(addDays('2026-01-01', i), ['software']);
      if (fun.kind === 'joke' && fun.joke.roles) expect(fun.joke.roles).toContain('software');
    }
  });
});

describe('rewardJoke', () => {
  it("differs from the day's joke card", () => {
    for (let i = 0; i < 30; i++) {
      const date = addDays('2026-11-01', i);
      const fun = dailyFun(date, ['teacher']);
      if (fun.kind === 'joke') expect(rewardJoke(date, ['teacher']).id).not.toBe(fun.joke.id);
    }
  });
});
