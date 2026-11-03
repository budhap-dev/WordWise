import { Monitor, Moon, Sun } from 'lucide-react';

import { useSettings } from '../../state/settingsContext';
import type { ThemePreference } from '../../types/user';

const NEXT: Record<ThemePreference, ThemePreference> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

const LABEL: Record<ThemePreference, string> = {
  system: 'Theme: match device',
  light: 'Theme: light',
  dark: 'Theme: dark',
};

export function ThemeToggle() {
  const { settings, updateSettings } = useSettings();
  const theme = settings?.theme ?? 'system';
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <button
      type="button"
      onClick={() => updateSettings({ theme: NEXT[theme] })}
      aria-label={`${LABEL[theme]}. Switch to ${NEXT[theme] === 'system' ? 'match device' : NEXT[theme]}`}
      title={LABEL[theme]}
      className="inline-flex size-10 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface-2 hover:text-ink"
    >
      <Icon key={theme} className="size-5 animate-pop" aria-hidden="true" />
    </button>
  );
}
