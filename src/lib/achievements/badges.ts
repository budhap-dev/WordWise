/** Badges: little milestones, each with a bit of British wit. All derived from ProgressStats. */
import type { ProgressStats } from './stats';

export type BadgeGroup = 'words' | 'habits' | 'games' | 'quirks';

export interface Badge {
  id: string;
  group: BadgeGroup;
  emoji: string;
  name: string;
  /** How to earn it, as an instruction. */
  how: string;
  /** A line of fun once it's earned. */
  quip: string;
  /** Where the learner is, towards `target`. */
  current: (s: ProgressStats) => number;
  target: number;
}

const yes = (value: boolean) => (value ? 1 : 0);

export const BADGES: readonly Badge[] = [
  // Words
  {
    id: 'first-word',
    group: 'words',
    emoji: '🌱',
    name: 'First Steps',
    how: 'Learn your first word.',
    quip: 'From little acorns, mighty vocabularies grow.',
    current: (s) => s.wordsLearnt,
    target: 1,
  },
  {
    id: 'words-25',
    group: 'words',
    emoji: '📗',
    name: 'Bookish',
    how: 'Learn 25 words.',
    quip: 'Twenty-five words richer, and not a penny spent.',
    current: (s) => s.wordsLearnt,
    target: 25,
  },
  {
    id: 'words-100',
    group: 'words',
    emoji: '🏏',
    name: 'A Century',
    how: 'Learn 100 words.',
    quip: 'Like a hundred in cricket, only with less standing about in a field.',
    current: (s) => s.wordsLearnt,
    target: 100,
  },
  {
    id: 'words-250',
    group: 'words',
    emoji: '🏛️',
    name: 'Walking Dictionary',
    how: 'Learn 250 words.',
    quip: 'People will start asking you how to spell things. Sorry in advance.',
    current: (s) => s.wordsLearnt,
    target: 250,
  },
  {
    id: 'mastered-1',
    group: 'words',
    emoji: '💎',
    name: 'Got It Down Pat',
    how: 'Master a word: remember it well enough that it comes back three weeks later.',
    quip: '“Down pat” means learnt perfectly. Which you have. Pat yourself on the back.',
    current: (s) => s.everMastered,
    target: 1,
  },
  {
    id: 'mastered-25',
    group: 'words',
    emoji: '🧠',
    name: 'Mastermind',
    how: 'Master 25 words.',
    quip: 'Your specialist subject: absolutely everything.',
    current: (s) => s.everMastered,
    target: 25,
  },
  {
    id: 'british-10',
    group: 'words',
    emoji: '☕',
    name: 'Proper British',
    how: 'Learn 10 Britishisms.',
    quip: 'You’re now legally required to apologise when someone else bumps into you.',
    current: (s) => s.byCategory.british,
    target: 10,
  },
  {
    id: 'idiom-10',
    group: 'words',
    emoji: '🐴',
    name: 'Horse’s Mouth',
    how: 'Learn 10 idioms or phrasal verbs.',
    quip: 'Straight from the horse’s mouth: you’re getting rather good at this.',
    current: (s) => s.byCategory.idiom,
    target: 10,
  },
  // Habits
  {
    id: 'streak-3',
    group: 'habits',
    emoji: '🔥',
    name: 'On a Roll',
    how: 'Keep a 3-day streak.',
    quip: 'Three days running. Well, three days learning. Running is optional.',
    current: (s) => s.longestStreak,
    target: 3,
  },
  {
    id: 'streak-7',
    group: 'habits',
    emoji: '🗓️',
    name: 'Full Week',
    how: 'Keep a 7-day streak.',
    quip: 'Seven days without learning makes one weak. Not you, though.',
    current: (s) => s.longestStreak,
    target: 7,
  },
  {
    id: 'streak-30',
    group: 'habits',
    emoji: '🫖',
    name: 'Stiff Upper Lip',
    how: 'Keep a 30-day streak.',
    quip: 'A whole month. Keep calm and carry on learning.',
    current: (s) => s.longestStreak,
    target: 30,
  },
  {
    id: 'reviews-50',
    group: 'habits',
    emoji: '🔁',
    name: 'Creature of Habit',
    how: 'Do 50 reviews.',
    quip: 'Little and often: the secret to memory, and to a good cuppa.',
    current: (s) => s.reviews,
    target: 50,
  },
  {
    id: 'reviews-250',
    group: 'habits',
    emoji: '⏰',
    name: 'Like Clockwork',
    how: 'Do 250 reviews.',
    quip: 'More reliable than the 8:15 from Paddington.',
    current: (s) => s.reviews,
    target: 250,
  },
  // Games
  {
    id: 'practice-100',
    group: 'games',
    emoji: '🎯',
    name: 'Sharpshooter',
    how: 'Get 100 practice questions right.',
    quip: 'Bang on target, every time. Well, a hundred times.',
    current: (s) => s.practiceCorrect,
    target: 100,
  },
  {
    id: 'perfect-session',
    group: 'games',
    emoji: '💯',
    name: 'Spot On',
    how: 'Get every question right in a practice session (5 questions or more).',
    quip: '“Spot on” is British for exactly right. Like you.',
    current: (s) => s.perfectSessions,
    target: 1,
  },
  {
    id: 'rush-250',
    group: 'games',
    emoji: '⚡',
    name: 'Quick Off the Mark',
    how: 'Score 250 or more in Word Rush.',
    quip: 'Faster than a queue forming at a new bakery.',
    current: (s) => s.rushBest,
    target: 250,
  },
  {
    id: 'combo-10',
    group: 'games',
    emoji: '🎩',
    name: 'Hat-Trick and Then Some',
    how: 'Get a ×4 combo (10 in a row) in Word Rush.',
    quip: 'A hat-trick is three in a row. You did ten. Show-off.',
    current: (s) => s.rushBestCombo,
    target: 10,
  },
  {
    id: 'bee-400',
    group: 'games',
    emoji: '🐝',
    name: 'The Bee’s Knees',
    how: 'Score 400 or more in the Spelling Bee.',
    quip: '“The bee’s knees” means the very best. Which is you, apparently.',
    current: (s) => s.beeBest,
    target: 400,
  },
  {
    id: 'bee-spelt-100',
    group: 'games',
    emoji: '🪄',
    name: 'Spellbound',
    how: 'Spell 100 words correctly in the Spelling Bee.',
    quip: 'Spelt, mind you, not spelled. Well, either’s fine. We’re not monsters.',
    current: (s) => s.beeWordsSpelt,
    target: 100,
  },
  // Quirks
  {
    id: 'early-bird',
    group: 'quirks',
    emoji: '🐦',
    name: 'Early Bird',
    how: 'Review, practise or play before 7am.',
    quip: 'The early bird catches the worm. And the vocabulary.',
    current: (s) => yes(s.earlyBird),
    target: 1,
  },
  {
    id: 'night-owl',
    group: 'quirks',
    emoji: '🦉',
    name: 'Night Owl',
    how: 'Review, practise or play after 11pm.',
    quip: 'Burning the midnight oil. Do get some kip, though.',
    current: (s) => yes(s.nightOwl),
    target: 1,
  },
  {
    id: 'comeback',
    group: 'quirks',
    emoji: '🪃',
    name: 'Boomerang',
    how: 'Come back after a week or more away.',
    quip: 'You came back! We knew you would. We weren’t worried. Much.',
    current: (s) => yes(s.longestBreak >= 7),
    target: 1,
  },
];

export const BADGE_GROUP_LABELS: Record<BadgeGroup, string> = {
  words: 'Words',
  habits: 'Habits',
  games: 'Practice and games',
  quirks: 'Quirks',
};

export interface BadgeStatus {
  badge: Badge;
  earned: boolean;
  /** Progress towards the target, capped at the target. */
  current: number;
}

export function badgeStatuses(stats: ProgressStats): BadgeStatus[] {
  return BADGES.map((badge) => {
    const current = Math.min(badge.target, badge.current(stats));
    return { badge, earned: current >= badge.target, current };
  });
}
