import type { Example, Role, WordEntry } from '../types/content';

/**
 * Every example for a word, most relevant first: the learner's roles, then general ones,
 * then the other roles' examples.
 */
export function orderedExamples(
  entry: Pick<WordEntry, 'examples'>,
  roles: readonly Role[],
): Example[] {
  const mine = entry.examples.filter((e) => e.role && roles.includes(e.role));
  const general = entry.examples.filter((e) => !e.role);
  const others = entry.examples.filter((e) => e.role && !roles.includes(e.role));
  return [...mine, ...general, ...others];
}

/**
 * Picks the examples to show: one for each selected role, plus general ones,
 * topped up from other roles so there are always at least `min` (and at most `max`).
 */
export function examplesForRoles(
  entry: Pick<WordEntry, 'examples'>,
  roles: readonly Role[],
  { min = 2, max = 3 }: { min?: number; max?: number } = {},
): Example[] {
  const mine = entry.examples.filter((e) => e.role && roles.includes(e.role));
  const general = entry.examples.filter((e) => !e.role);
  const others = entry.examples.filter((e) => e.role && !roles.includes(e.role));

  const chosen = [...mine, ...general].slice(0, Math.max(max, roles.length));
  for (const e of others) {
    if (chosen.length >= min) break;
    chosen.push(e);
  }
  return chosen;
}
