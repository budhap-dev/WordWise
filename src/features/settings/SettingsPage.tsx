import { Monitor, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { Button } from '../../components/ui/Button';
import { cardClasses } from '../../components/ui/styles';
import { useRequiredSettings, useSettings } from '../../state/settingsContext';
import type { ThemePreference } from '../../types/user';
import { GoalPicker, LevelPicker, RolePicker } from '../onboarding/PreferenceFields';

function Legend({ children }: { children: string }) {
  return <span className="text-lg font-semibold">{children}</span>;
}

const THEMES: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'Match device', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

export function SettingsPage() {
  const settings = useRequiredSettings();
  const { updateSettings, resetSettings } = useSettings();
  const navigate = useNavigate();
  const [confirmingReset, setConfirmingReset] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Settings</h1>
      <p className="text-ink-muted" role="status">
        Changes save automatically.
      </p>

      <section className={`${cardClasses} p-6`}>
        <RolePicker
          value={settings.roles}
          onChange={(roles) => roles.length > 0 && updateSettings({ roles })}
          legend={<Legend>Your roles</Legend>}
        />
        <p className="mt-2 text-sm text-ink-muted">Keep at least one selected.</p>
      </section>

      <section className={`${cardClasses} p-6`}>
        <GoalPicker
          value={settings.dailyGoal}
          onChange={(dailyGoal) => updateSettings({ dailyGoal })}
          legend={<Legend>Daily goal</Legend>}
        />
      </section>

      <section className={`${cardClasses} p-6`}>
        <LevelPicker
          value={settings.level}
          onChange={(level) => updateSettings({ level })}
          legend={<Legend>Level</Legend>}
        />
      </section>

      <section className={`${cardClasses} p-6`}>
        <fieldset>
          <legend className="mb-3">
            <Legend>Appearance</Legend>
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map(({ value, label, icon: Icon }) => (
              <label
                key={value}
                className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-sm font-medium transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                  settings.theme === value
                    ? 'border-brand bg-brand-soft/60'
                    : 'border-line hover:border-ink-muted/40'
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  className="sr-only"
                  checked={settings.theme === value}
                  onChange={() => updateSettings({ theme: value })}
                />
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className={`${cardClasses} p-6`}>
        <h2 className="text-lg font-semibold">Start over</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Clears your preferences and takes you back to the welcome screen.
        </p>
        {confirmingReset ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              className="bg-danger text-white hover:brightness-110 dark:text-bg"
              onClick={() => {
                resetSettings();
                navigate('/welcome', { replace: true });
              }}
            >
              Yes, start over
            </Button>
            <Button variant="secondary" onClick={() => setConfirmingReset(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="secondary" className="mt-4" onClick={() => setConfirmingReset(true)}>
            Reset preferences
          </Button>
        )}
      </section>
    </div>
  );
}
