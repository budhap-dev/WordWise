import { Monitor, Moon, Sun } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { useNavigate } from 'react-router';

import { Button } from '../../components/ui/Button';
import { cardClasses } from '../../components/ui/styles';
import { resetProgress } from '../../db/progress';
import { useCards } from '../../hooks/useProgress';
import { useRequiredSettings, useSettings } from '../../state/settingsContext';
import type { ThemePreference } from '../../types/user';
import { InstallSection } from '../install/InstallPrompt';
import { GoalPicker, LevelPicker, RolePicker } from '../onboarding/PreferenceFields';

function Legend({ children }: { children: string }) {
  return <span className="text-lg font-semibold">{children}</span>;
}

const THEMES: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'Match device', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

/** A destructive action behind a second, explicit confirmation. */
function ConfirmAction({
  title,
  description,
  action,
  confirm,
  onConfirm,
}: {
  title: string;
  description: ReactNode;
  action: string;
  confirm: string;
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <section className={`${cardClasses} p-6`}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-ink-muted">{description}</p>
      {confirming ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            className="bg-danger text-white hover:brightness-110 dark:text-bg"
            onClick={() => {
              setConfirming(false);
              onConfirm();
            }}
          >
            {confirm}
          </Button>
          <Button variant="secondary" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button variant="secondary" className="mt-4" onClick={() => setConfirming(true)}>
          {action}
        </Button>
      )}
    </section>
  );
}

export function SettingsPage() {
  const settings = useRequiredSettings();
  const { updateSettings, resetSettings } = useSettings();
  const navigate = useNavigate();
  const learnt = useCards()?.length ?? 0;

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

      <InstallSection />

      <ConfirmAction
        title="Reset progress"
        description={
          learnt > 0
            ? `Forgets the ${learnt} ${learnt === 1 ? 'word' : 'words'} you've learnt and your review history. Your preferences stay.`
            : "Forgets the words you've learnt and your review history. Your preferences stay."
        }
        action="Reset progress"
        confirm="Yes, forget my progress"
        onConfirm={() => {
          resetProgress().catch((error: unknown) => console.error('Could not reset', error));
        }}
      />

      <ConfirmAction
        title="Start over"
        description="Clears your preferences and takes you back to the welcome screen. Your progress is kept."
        action="Reset preferences"
        confirm="Yes, start over"
        onConfirm={() => {
          resetSettings();
          navigate('/welcome', { replace: true });
        }}
      />
    </div>
  );
}
