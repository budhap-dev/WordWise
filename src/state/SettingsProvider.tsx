import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import type { Settings, ThemePreference } from '../types/user';
import { SettingsContext, type SettingsContextValue } from './settingsContext';
import {
  clearSettings,
  loadSettings,
  parseSettings,
  saveSettings,
  SETTINGS_KEY,
} from './settingsStorage';

function applyTheme(theme: ThemePreference) {
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', dark);
}

export function SettingsProvider({
  children,
  initialSettings,
}: {
  children: ReactNode;
  /** Mainly for tests; defaults to what's in localStorage. */
  initialSettings?: Settings | null;
}) {
  const [settings, setState] = useState<Settings | null>(() =>
    initialSettings !== undefined ? initialSettings : loadSettings(),
  );

  const setSettings = useCallback((next: Settings) => {
    saveSettings(next);
    setState(next);
  }, []);

  const updateSettings = useCallback<SettingsContextValue['updateSettings']>((patch) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = parseSettings({ ...prev, ...patch }) ?? prev;
      saveSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    clearSettings();
    setState(null);
  }, []);

  // Keep the theme in sync with settings and the OS preference.
  const theme = settings?.theme ?? 'system';
  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  // Pick up changes made in another tab.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SETTINGS_KEY) setState(loadSettings());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(
    () => ({ settings, setSettings, updateSettings, resetSettings }),
    [settings, setSettings, updateSettings, resetSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
