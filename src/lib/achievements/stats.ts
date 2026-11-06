/**
 * Everything on the Progress screen is derived from the learner's existing records (cards,
 * reviews, practice attempts and games), so it's retroactive and needs no extra storage.
 */
import { getWord } from '../../data';
import type { AttemptRecord, CardRecord, GameScoreRecord, ReviewRecord } from '../../db/db';
import type { Category } from '../../types/content';
import { addDays, type DateKey, fromDateKey } from '../date';
import { currentStreak, type Streak } from '../streak';

export interface ActivityLog {
  cards: readonly CardRecord[];
  reviews: readonly ReviewRecord[];
  attempts: readonly AttemptRecord[];
  games: readonly GameScoreRecord[];
}

export interface DayActivity {
  learnt: number;
  reviewed: number;
  practised: number;
  games: number;
}

/** A word reviewed at intervals of three weeks or more is well and truly learnt. */
export const MASTERED_INTERVAL = 21;
/** From a week apart, a word is familiar. */
export const FAMILIAR_INTERVAL = 7;

/** A practice session with at least this many answers, all right, is a perfect one. */
export const PERFECT_SESSION_MIN = 5;

export type MasteryStage = 'learning' | 'familiar' | 'mastered';

export function masteryStage(interval: number): MasteryStage {
  if (interval >= MASTERED_INTERVAL) return 'mastered';
  if (interval >= FAMILIAR_INTERVAL) return 'familiar';
  return 'learning';
}

export interface ProgressStats {
  wordsLearnt: number;
  /** Where each word is now. A word can slip back if it's forgotten. */
  mastery: Record<MasteryStage, number>;
  /** Words that have ever reached a mastered interval: never goes down. */
  everMastered: number;
  byCategory: Record<Category, number>;
  reviews: number;
  /** Reviews graded Good or Easy. */
  reviewsRecalled: number;
  practiceAnswered: number;
  practiceCorrect: number;
  perfectSessions: number;
  rushGames: number;
  rushBest: number;
  rushBestCombo: number;
  beeGames: number;
  beeBest: number;
  /** Words spelt right in the Spelling Bee, tricky-word rounds included. */
  beeWordsSpelt: number;
  /** What happened on each active day. */
  days: ReadonlyMap<DateKey, DayActivity>;
  streak: Streak;
  longestStreak: number;
  /** Did anything before 7am (but after 4am: that's still last night). */
  earlyBird: boolean;
  /** Did anything from 11pm to 4am. */
  nightOwl: boolean;
  /** The longest break between two active days, in days. */
  longestBreak: number;
}

function emptyDay(): DayActivity {
  return { learnt: 0, reviewed: 0, practised: 0, games: 0 };
}

export function dayTotal(day: DayActivity | undefined): number {
  return day ? day.learnt + day.reviewed + day.practised + day.games : 0;
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

export function describeDay(day: DayActivity | undefined, isToday = false): string {
  if (!day || dayTotal(day) === 0)
    return isToday
      ? 'Nothing yet. The kettle’s on, no rush.'
      : 'A day off. Even word nerds need those.';
  return [
    day.learnt && `${plural(day.learnt, 'word')} learnt`,
    day.reviewed && plural(day.reviewed, 'review'),
    day.practised && plural(day.practised, 'practice answer'),
    day.games && plural(day.games, 'game'),
  ]
    .filter(Boolean)
    .join(' · ');
}

function daysBetween(a: DateKey, b: DateKey): number {
  return Math.round((fromDateKey(b).getTime() - fromDateKey(a).getTime()) / 86_400_000);
}

/** The longest run of consecutive days in `dates`. */
export function longestRun(dates: Iterable<DateKey>): number {
  const set = new Set(dates);
  let best = 0;
  for (const date of set) {
    if (set.has(addDays(date, -1))) continue; // not the start of a run
    let length = 1;
    for (let d = addDays(date, 1); set.has(d); d = addDays(d, 1)) length++;
    best = Math.max(best, length);
  }
  return best;
}

export function progressStats(log: ActivityLog, today: DateKey): ProgressStats {
  const days = new Map<DateKey, DayActivity>();
  const on = (date: DateKey) => {
    let day = days.get(date);
    if (!day) days.set(date, (day = emptyDay()));
    return day;
  };

  const mastery: Record<MasteryStage, number> = { learning: 0, familiar: 0, mastered: 0 };
  const byCategory: Record<Category, number> = {
    general: 0,
    student: 0,
    teaching: 0,
    workplace: 0,
    idiom: 0,
    british: 0,
  };
  let wordsLearnt = 0;
  for (const card of log.cards) {
    on(card.introducedOn).learnt++;
    const word = getWord(card.wordId);
    if (!word) continue; // a word since removed from the dataset still counted for the day
    wordsLearnt++;
    mastery[masteryStage(card.interval)]++;
    byCategory[word.category]++;
  }

  let reviewsRecalled = 0;
  const mastered = new Set(
    log.cards
      .filter((c) => c.interval >= MASTERED_INTERVAL && getWord(c.wordId))
      .map((c) => c.wordId),
  );
  for (const r of log.reviews) {
    on(r.date).reviewed++;
    if (r.grade === 'good' || r.grade === 'easy') reviewsRecalled++;
    if (r.intervalAfter >= MASTERED_INTERVAL && getWord(r.wordId)) mastered.add(r.wordId);
  }

  const sessions = new Map<string, { answered: number; correct: number }>();
  let practiceCorrect = 0;
  for (const a of log.attempts) {
    on(a.date).practised++;
    if (a.correct) practiceCorrect++;
    const s = sessions.get(a.sessionId) ?? { answered: 0, correct: 0 };
    s.answered++;
    if (a.correct) s.correct++;
    sessions.set(a.sessionId, s);
  }
  const perfectSessions = [...sessions.values()].filter(
    (s) => s.answered >= PERFECT_SESSION_MIN && s.correct === s.answered,
  ).length;

  const rush = log.games.filter((g) => g.game === 'rush');
  const bee = log.games.filter((g) => g.game === 'bee');
  const beeWordsSpelt = log.games
    .filter((g) => g.game === 'bee' || g.game === 'bee-tricky')
    .reduce((sum, g) => sum + g.correct, 0);
  for (const g of log.games) on(g.date).games++;

  const hours = [
    ...log.reviews.map((r) => r.reviewedAt),
    ...log.attempts.map((a) => a.answeredAt),
    ...log.games.map((g) => g.playedAt),
  ].map((iso) => new Date(iso).getHours());

  const active = [...days.keys()].sort();
  let longestBreak = 0;
  for (let i = 1; i < active.length; i++) {
    longestBreak = Math.max(longestBreak, daysBetween(active[i - 1]!, active[i]!) - 1);
  }

  return {
    wordsLearnt,
    mastery,
    everMastered: mastered.size,
    byCategory,
    reviews: log.reviews.length,
    reviewsRecalled,
    practiceAnswered: log.attempts.length,
    practiceCorrect,
    perfectSessions,
    rushGames: rush.length,
    rushBest: rush.reduce((max, g) => Math.max(max, g.score), 0),
    rushBestCombo: rush.reduce((max, g) => Math.max(max, g.bestCombo), 0),
    beeGames: bee.length,
    beeBest: bee.reduce((max, g) => Math.max(max, g.score), 0),
    beeWordsSpelt,
    days,
    streak: currentStreak(new Set(active), today),
    longestStreak: longestRun(active),
    earlyBird: hours.some((h) => h >= 4 && h < 7),
    nightOwl: hours.some((h) => h >= 23 || h < 4),
    longestBreak,
  };
}
