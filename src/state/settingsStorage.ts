import { LEVELS, ROLES } from '../data';
import { COLOUR_THEMES, type ColourTheme, DEFAULT_THEME } from '../theme/palettes';
import type { DailyGoal, Settings, ThemePreference } from '../types/user';

export const SETTINGS_KEY = 'wordwise:settings';

const GOALS: DailyGoal[] = [5, 10, 15];
const THEMES: ThemePreference[] = ['system', 'light', 'dark'];

/** Validates unknown JSON into Settings, or returns null if it isn't usable. */
export function parseSettings(value: unknown): Settings | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const roles = Array.isArray(v.roles) ? v.roles.filter((r) => ROLES.includes(r)) : [];
  if (roles.length === 0) return null;
  if (!GOALS.includes(v.dailyGoal as DailyGoal)) return null;
  if (!LEVELS.includes(v.level as Settings['level'])) return null;
  return {
    schemaVersion: 1,
    roles: [...new Set(roles)] as Settings['roles'],
    dailyGoal: v.dailyGoal as DailyGoal,
    level: v.level as Settings['level'],
    theme: THEMES.includes(v.theme as ThemePreference) ? (v.theme as ThemePreference) : 'system',
    palette: COLOUR_THEMES.includes(v.palette as ColourTheme)
      ? (v.palette as ColourTheme)
      : DEFAULT_THEME,
    onboardedAt: typeof v.onboardedAt === 'string' ? v.onboardedAt : new Date().toISOString(),
  };
}

export function loadSettings(): Settings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? parseSettings(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage can be unavailable (private mode, quota). The app keeps working in memory.
  }
}

export function clearSettings(): void {
  try {
    localStorage.removeItem(SETTINGS_KEY);
  } catch {
    // ignore
  }
}
