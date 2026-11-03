import { pick } from '../../lib/random';

/** Encouraging but grown-up. Shown on the "done for today" screen. */
export const DONE_MESSAGES = [
  'Nicely done. That’s a few more ways to say exactly what you mean.',
  'Job done. Your future self, mid-meeting, thanks you.',
  'That’s today sorted. Little and often really does work.',
  'Lovely work. Now try slipping one of them into a conversation.',
  'Done and dusted. See you tomorrow for the next batch.',
  'Splendid. Your vocabulary is quietly getting sharper.',
];

export const CHALLENGES = [
  'Use one of today’s words in an email before the end of the day.',
  'Drop one of today’s words into a conversation tomorrow and see if anyone notices.',
  'Explain one of today’s words to a friend without using the definition.',
  'Write a single sentence using two of today’s words.',
];

export function randomFrom(list: readonly string[], random?: () => number): string {
  return pick(list, random);
}
