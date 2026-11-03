import {
  dueDate,
  formatInterval,
  type Grade,
  introduce,
  MIN_EASE,
  needsRepeat,
  NEW_CARD,
  nextEase,
  review,
  type Sm2State,
} from './sm2';

const run = (grades: Grade[], start: Sm2State = NEW_CARD) =>
  grades.reduce((state, g) => review(state, g), start);

describe('nextEase', () => {
  it('follows the SM-2 formula for each quality', () => {
    expect(nextEase(2.5, 5)).toBe(2.6);
    expect(nextEase(2.5, 4)).toBe(2.5);
    expect(nextEase(2.5, 3)).toBe(2.36);
    expect(nextEase(2.5, 2)).toBe(2.18);
  });

  it('never drops below the minimum', () => {
    expect(nextEase(1.4, 2)).toBe(MIN_EASE);
    expect(nextEase(MIN_EASE, 0)).toBe(MIN_EASE);
  });
});

describe('review', () => {
  it('uses intervals of 1, then 6, then the previous interval × ease', () => {
    const first = review(NEW_CARD, 'good');
    expect(first).toMatchObject({ interval: 1, repetitions: 1, ease: 2.5 });
    const second = review(first, 'good');
    expect(second).toMatchObject({ interval: 6, repetitions: 2 });
    const third = review(second, 'good');
    expect(third).toMatchObject({ interval: 15, repetitions: 3 }); // 6 × 2.5
    const fourth = review(third, 'good');
    expect(fourth.interval).toBe(38); // round(15 × 2.5 = 37.5)
  });

  it('grows faster with Easy and slower with Hard', () => {
    const easy = run(['easy', 'easy', 'easy', 'easy']);
    const good = run(['good', 'good', 'good', 'good']);
    const hard = run(['hard', 'hard', 'hard', 'hard']);
    expect(easy.interval).toBeGreaterThan(good.interval);
    expect(good.interval).toBeGreaterThan(hard.interval);
    expect(easy.ease).toBeCloseTo(2.9);
    expect(hard.ease).toBeCloseTo(1.94);
  });

  it('uses the ease from before this review to compute the interval', () => {
    // 3rd repetition with ease 2.5 graded Easy: interval = 6 × 2.5, then ease rises to 2.6.
    const state = run(['good', 'good']);
    expect(review(state, 'easy')).toMatchObject({ interval: 15, ease: 2.6 });
  });

  it('restarts a forgotten word tomorrow, lowers its ease and counts a lapse', () => {
    const learnt = run(['good', 'good', 'good']);
    const forgotten = review(learnt, 'again');
    expect(forgotten).toEqual({ ease: 2.18, interval: 1, repetitions: 0, lapses: 1 });
    // After a lapse the 1-day, 6-day ladder starts again.
    expect(review(forgotten, 'good')).toMatchObject({ interval: 1, repetitions: 1 });
    expect(run(['good', 'good'], forgotten).interval).toBe(6);
  });

  it("doesn't count a lapse for a word never yet recalled", () => {
    expect(review(NEW_CARD, 'again').lapses).toBe(0);
  });

  it('treats Hard as a pass', () => {
    expect(review(introduce(), 'hard')).toMatchObject({ interval: 6, repetitions: 2 });
  });

  it('is pure', () => {
    const state = { ...NEW_CARD };
    review(state, 'easy');
    expect(state).toEqual(NEW_CARD);
  });

  it('keeps intervals sensible over a long run at minimum ease', () => {
    let state = NEW_CARD;
    for (let i = 0; i < 6; i++) state = review(state, 'again');
    expect(state.ease).toBe(MIN_EASE);
    state = run(['hard', 'hard', 'hard', 'hard'], state);
    expect(state.interval).toBeGreaterThanOrEqual(6);
    expect(Number.isInteger(state.interval)).toBe(true);
  });
});

describe('introduce', () => {
  it('schedules a newly learnt word for tomorrow', () => {
    const state = introduce();
    expect(state).toEqual({ ease: 2.5, interval: 1, repetitions: 1, lapses: 0 });
    expect(dueDate(state, '2026-11-03')).toBe('2026-11-04');
  });
});

describe('dueDate', () => {
  it('adds the interval across month and year boundaries', () => {
    expect(dueDate({ ...NEW_CARD, interval: 6 }, '2026-12-28')).toBe('2027-01-03');
    expect(dueDate({ ...NEW_CARD, interval: 1 }, '2028-02-28')).toBe('2028-02-29');
  });
});

describe('needsRepeat', () => {
  it('repeats Again and Hard in the same session (SM-2 step 7)', () => {
    expect(needsRepeat('again')).toBe(true);
    expect(needsRepeat('hard')).toBe(true);
    expect(needsRepeat('good')).toBe(false);
    expect(needsRepeat('easy')).toBe(false);
  });
});

describe('formatInterval', () => {
  it.each([
    [1, '1 day'],
    [6, '6 days'],
    [13, '13 days'],
    [15, '2 wk'],
    [38, '5 wk'],
    [95, '3 mo'],
    [400, '1.1 yr'],
  ])('%i → %s', (days, label) => {
    expect(formatInterval(days)).toBe(label);
  });
});
