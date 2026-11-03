import type {
  BritishSaying,
  Category,
  Joke,
  Level,
  Register,
  Role,
  WordEntry,
} from '../types/content';
import sayingsJson from './britishSayings.json';
import jokesJson from './jokes.json';
import wordsJson from './words.json';

/** All built-in words. The JSON is validated by src/data/words.test.ts. */
export const WORDS: readonly WordEntry[] = wordsJson as unknown as WordEntry[];

export const JOKES: readonly Joke[] = jokesJson as unknown as Joke[];
export const BRITISH_SAYINGS: readonly BritishSaying[] = sayingsJson as BritishSaying[];

const WORDS_BY_ID = new Map(WORDS.map((w) => [w.id, w]));

export function getWord(id: string): WordEntry | undefined {
  return WORDS_BY_ID.get(id);
}

export const ROLES: readonly Role[] = ['student', 'teacher', 'software'];
export const LEVELS: readonly Level[] = ['upper-intermediate', 'advanced', 'proficient'];
export const REGISTERS: readonly Register[] = ['formal', 'neutral', 'informal'];
export const CATEGORIES: readonly Category[] = [
  'general',
  'student',
  'teaching',
  'workplace',
  'idiom',
  'british',
];

/** Each role unlocks one category. `general` and `idiom` are shown to everyone. */
export const ROLE_CATEGORY: Record<Role, Category> = {
  student: 'student',
  teacher: 'teaching',
  software: 'workplace',
};

export const SHARED_CATEGORIES: readonly Category[] = ['general', 'idiom', 'british'];

export function categoriesForRoles(roles: readonly Role[]): Category[] {
  return [...SHARED_CATEGORIES, ...roles.map((r) => ROLE_CATEGORY[r])];
}

export const ROLE_LABELS: Record<Role, { label: string; blurb: string; emoji: string }> = {
  student: {
    label: 'Student',
    blurb: 'Seminars, essays, presentations and emails to tutors',
    emoji: '🎓',
  },
  teacher: {
    label: 'Teacher',
    blurb: 'Explaining Maths and Science, feedback, parents and colleagues',
    emoji: '🧪',
  },
  software: {
    label: 'Software professional',
    blurb: 'Stand-ups, code reviews, technical writing and stakeholders',
    emoji: '💻',
  },
};

export const LEVEL_LABELS: Record<Level, { label: string; blurb: string }> = {
  'upper-intermediate': {
    label: 'Upper-intermediate',
    blurb: 'Confident, but sometimes reach for the same few words',
  },
  advanced: { label: 'Advanced', blurb: 'Fluent, and want more precision and range' },
  proficient: { label: 'Proficient', blurb: 'Near-native polish and subtle distinctions' },
};

export const CATEGORY_LABELS: Record<Category, string> = {
  general: 'Everyday',
  student: 'Study',
  teaching: 'Teaching',
  workplace: 'Workplace',
  idiom: 'Idioms & phrasal verbs',
  british: 'Britishisms',
};
