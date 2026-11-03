/**
 * Types for the learner's own data (settings now; review cards, logs and practice
 * attempts arrive with IndexedDB persistence in Phase 2).
 */
import type { Level, Role } from './content';

export type DailyGoal = 5 | 10 | 15;
export type ThemePreference = 'system' | 'light' | 'dark';

/** Stored in localStorage under `wordwise:settings`; small and read synchronously at start-up. */
export interface Settings {
  schemaVersion: 1;
  roles: Role[];
  dailyGoal: DailyGoal;
  level: Level;
  theme: ThemePreference;
  /** ISO timestamp of when onboarding was completed. */
  onboardedAt: string;
}
