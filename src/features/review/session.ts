import type { Grade } from '../../lib/sm2';

/** Keeps sessions short: 20 reviews is about five minutes. */
export const REVIEW_SESSION_MAX = 20;

/** How many words got each grade (first attempts only). */
export type Tally = Record<Grade, number>;
