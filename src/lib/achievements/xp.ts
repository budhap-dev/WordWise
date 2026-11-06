/**
 * XP and levels. XP is worked out from the learner's history, so it only ever goes up (until
 * they reset their progress), and every past session counts.
 */
import type { ActivityLog } from './stats';

export const XP = {
  /** Learning a new word. */
  learn: 10,
  /** A review graded Hard, Good or Easy. */
  review: 5,
  /** A review graded Again: turning up still counts. */
  reviewAgain: 2,
  practiceCorrect: 3,
  practiceWrong: 1,
  /** Word Rush and the Spelling Bee: 1 XP per this many points. */
  gamePointsPerXp: 10,
} as const;

export function totalXp(log: ActivityLog): number {
  let xp = log.cards.length * XP.learn;
  for (const r of log.reviews) xp += r.grade === 'again' ? XP.reviewAgain : XP.review;
  for (const a of log.attempts) xp += a.correct ? XP.practiceCorrect : XP.practiceWrong;
  for (const g of log.games) xp += Math.floor(g.score / XP.gamePointsPerXp);
  return xp;
}

/** XP needed to go from `level` to the next one: 100, then 50 more for each level after. */
export function xpForNextLevel(level: number): number {
  return 100 + 50 * (level - 1);
}

/** Total XP at which `level` starts. Level 1 starts at 0. */
export function xpAtLevel(level: number): number {
  const n = level - 1;
  return 100 * n + 25 * n * (n - 1);
}

export interface LevelTitle {
  /** The first level with this title. */
  from: number;
  title: string;
  emoji: string;
  /** What the (often British) phrase means. */
  note: string;
}

export const LEVEL_TITLES: readonly LevelTitle[] = [
  {
    from: 1,
    title: 'Fresh Face',
    emoji: '🌱',
    note: 'New to the team. Everyone starts somewhere.',
  },
  { from: 3, title: 'Keen Bean', emoji: '🫘', note: 'British for someone wonderfully eager.' },
  {
    from: 5,
    title: 'Bookworm',
    emoji: '🐛',
    note: 'Can’t stop reading. Lives on a diet of words.',
  },
  { from: 8, title: 'Smart Cookie', emoji: '🍪', note: 'Clever, and a bit of a treat.' },
  {
    from: 11,
    title: 'Clever Clogs',
    emoji: '👞',
    note: 'Said of someone who knows a lot, half admiringly, half teasing. We mean it nicely.',
  },
  { from: 15, title: 'Silver Tongue', emoji: '🗣️', note: 'Persuasive and articulate. Use wisely.' },
  {
    from: 20,
    title: 'Dab Hand',
    emoji: '✋',
    note: 'British for an expert, as in “she’s a dab hand at crosswords”.',
  },
  { from: 25, title: 'Wordsmith', emoji: '⚒️', note: 'A skilled crafter of words.' },
  {
    from: 30,
    title: 'Lexicon Legend',
    emoji: '👑',
    note: '“Absolute legend”, as they say down the pub. High praise indeed.',
  },
];

export function levelTitle(level: number): LevelTitle {
  return LEVEL_TITLES.findLast((t) => level >= t.from) ?? LEVEL_TITLES[0]!;
}

export interface LevelInfo extends LevelTitle {
  level: number;
  xp: number;
  /** XP earned since this level started. */
  intoLevel: number;
  /** XP this level takes in total. */
  levelSize: number;
  toNext: number;
}

export function levelFor(xp: number): LevelInfo {
  let level = 1;
  while (xp >= xpAtLevel(level + 1)) level++;
  const intoLevel = xp - xpAtLevel(level);
  const levelSize = xpForNextLevel(level);
  return {
    ...levelTitle(level),
    level,
    xp,
    intoLevel,
    levelSize,
    toNext: levelSize - intoLevel,
  };
}
