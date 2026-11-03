/**
 * SM-2 spaced repetition (Piotr Woźniak, SuperMemo, 1987), as a pure, framework-free module.
 *
 * Each word has an ease factor (EF, starting at 2.5), an interval in days and a count of
 * successful repetitions in a row. After a review graded with quality q (0–5):
 *
 * - q ≥ 3 (remembered): the 1st interval is 1 day, the 2nd is 6 days, then each interval is the
 *   previous one × EF, rounded.
 * - q < 3 (forgotten): repetitions restart, and the word comes back tomorrow.
 * - Either way, EF += 0.1 − (5 − q) × (0.08 + (5 − q) × 0.02), never below 1.3.
 * - Words graded below 4 are repeated in the same session until they're recalled well (step 7
 *   of SM-2); those in-session repeats don't change the schedule.
 *
 * Our four buttons map onto SM-2's quality scale:
 *
 * | Button | q | SM-2 meaning                                         | EF change |
 * | ------ | - | ---------------------------------------------------- | --------- |
 * | Again  | 2 | incorrect, but the answer seemed easy once seen      | −0.32     |
 * | Hard   | 3 | correct, with serious difficulty                     | −0.14     |
 * | Good   | 4 | correct, after some hesitation                       | ±0        |
 * | Easy   | 5 | perfect recall                                       | +0.10     |
 */
import { addDays, type DateKey } from './date';

export type Grade = 'again' | 'hard' | 'good' | 'easy';

export const GRADES: readonly Grade[] = ['again', 'hard', 'good', 'easy'];

export const GRADE_QUALITY: Record<Grade, number> = { again: 2, hard: 3, good: 4, easy: 5 };

export const INITIAL_EASE = 2.5;
export const MIN_EASE = 1.3;

export interface Sm2State {
  /** Ease factor: how quickly intervals grow. */
  ease: number;
  /** Days until the next review. 0 means "not yet scheduled". */
  interval: number;
  /** Successful reviews in a row. */
  repetitions: number;
  /** How many times the word has been forgotten after being learnt. */
  lapses: number;
}

export const NEW_CARD: Readonly<Sm2State> = {
  ease: INITIAL_EASE,
  interval: 0,
  repetitions: 0,
  lapses: 0,
};

/** The SM-2 ease update, clamped at MIN_EASE and rounded to avoid floating-point drift. */
export function nextEase(ease: number, quality: number): number {
  const d = 5 - quality;
  const updated = ease + (0.1 - d * (0.08 + d * 0.02));
  return Math.max(MIN_EASE, Math.round(updated * 100) / 100);
}

/** Applies one graded review and returns the new state. Pure: the input isn't modified. */
export function review(state: Sm2State, grade: Grade): Sm2State {
  const q = GRADE_QUALITY[grade];
  const ease = nextEase(state.ease, q);

  if (q < 3) {
    return {
      ease,
      interval: 1,
      repetitions: 0,
      // Forgetting a word you'd never recalled successfully isn't a lapse.
      lapses: state.repetitions > 0 ? state.lapses + 1 : state.lapses,
    };
  }

  const interval =
    state.repetitions === 0
      ? 1
      : state.repetitions === 1
        ? 6
        : Math.max(1, Math.round(state.interval * state.ease));
  return { ease, interval, repetitions: state.repetitions + 1, lapses: state.lapses };
}

/** The date a word is next due, given the state after a review on `today`. */
export function dueDate(state: Sm2State, today: DateKey): DateKey {
  return addDays(today, state.interval);
}

/**
 * Learning a new word counts as its first successful repetition: it's due again tomorrow,
 * then in six days if it's remembered.
 */
export function introduce(): Sm2State {
  return review(NEW_CARD, 'good');
}

/** SM-2 step 7: grades below "good" are repeated later in the same session. */
export function needsRepeat(grade: Grade): boolean {
  return GRADE_QUALITY[grade] < 4;
}

/** Short, friendly interval labels for the grade buttons, e.g. "1 day", "6 days", "3 wk". */
export function formatInterval(days: number): string {
  if (days <= 1) return '1 day';
  if (days < 14) return `${days} days`;
  if (days < 60) return `${Math.round(days / 7)} wk`;
  if (days < 365) return `${Math.round(days / 30)} mo`;
  const years = Math.round((days / 365) * 10) / 10;
  return `${years} yr`;
}
