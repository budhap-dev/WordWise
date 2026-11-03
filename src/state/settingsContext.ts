import { createContext, useContext } from 'react';

import type { Settings } from '../types/user';

export interface SettingsContextValue {
  settings: Settings | null;
  /** Replaces settings (used by onboarding). */
  setSettings: (settings: Settings) => void;
  /** Merges a partial update into existing settings. No-op before onboarding. */
  updateSettings: (patch: Partial<Omit<Settings, 'schemaVersion'>>) => void;
  /** Clears settings and returns the app to onboarding. */
  resetSettings: () => void;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}

/** For screens that are only reachable after onboarding. */
export function useRequiredSettings(): Settings {
  const { settings } = useSettings();
  if (!settings) throw new Error('Settings are required on this screen');
  return settings;
}
