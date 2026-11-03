/** Picks the day's "bit of fun": a joke or a piece of decoded British understatement. */
import { BRITISH_SAYINGS, JOKES } from '../data';
import type { BritishSaying, Joke, Role } from '../types/content';
import type { DateKey } from './date';
import { hashString, pick, seededRandom } from './random';

export type DailyFun = { kind: 'joke'; joke: Joke } | { kind: 'saying'; saying: BritishSaying };

function jokesFor(roles: readonly Role[], jokes: readonly Joke[] = JOKES): Joke[] {
  return jokes.filter((j) => !j.roles || j.roles.some((r) => roles.includes(r)));
}

/** Deterministic per date: alternates between jokes and sayings from day to day. */
export function dailyFun(date: DateKey, roles: readonly Role[]): DailyFun {
  const seed = hashString(`fun:${date}`);
  const random = seededRandom(seed);
  if (seed % 2 === 0) return { kind: 'joke', joke: pick(jokesFor(roles), random) };
  return { kind: 'saying', saying: pick(BRITISH_SAYINGS, random) };
}

/** A joke as a reward on the "done for today" screen (different from the daily card). */
export function rewardJoke(date: DateKey, roles: readonly Role[]): Joke {
  const fun = dailyFun(date, roles);
  const pool = jokesFor(roles).filter((j) => fun.kind !== 'joke' || j.id !== fun.joke.id);
  return pick(pool, seededRandom(hashString(`reward:${date}`)));
}
