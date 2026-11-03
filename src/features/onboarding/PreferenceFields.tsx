import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

import { LEVEL_LABELS, LEVELS, ROLE_LABELS, ROLES } from '../../data';
import { estimateMinutes } from '../../lib/daily';
import type { Level, Role } from '../../types/content';
import type { DailyGoal } from '../../types/user';

function OptionCard({
  type,
  name,
  checked,
  onChange,
  title,
  description,
  leading,
}: {
  type: 'checkbox' | 'radio';
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  description: string;
  leading?: ReactNode;
}) {
  return (
    <label
      className={`group relative flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
        checked
          ? 'border-brand bg-brand-soft/60'
          : 'border-line bg-surface hover:border-ink-muted/40'
      }`}
    >
      <input type={type} name={name} checked={checked} onChange={onChange} className="sr-only" />
      {leading && (
        <span className="text-3xl transition group-hover:scale-110" aria-hidden="true">
          {leading}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-ink-muted">{description}</span>
      </span>
      <span
        aria-hidden="true"
        className={`flex size-6 shrink-0 items-center justify-center border-2 transition ${
          type === 'radio' ? 'rounded-full' : 'rounded-md'
        } ${checked ? 'border-brand bg-brand text-brand-ink' : 'border-line'}`}
      >
        {checked && <Check className="size-4 animate-pop" strokeWidth={3} />}
      </span>
    </label>
  );
}

export function RolePicker({
  value,
  onChange,
  legend,
}: {
  value: Role[];
  onChange: (roles: Role[]) => void;
  legend: ReactNode;
}) {
  const toggle = (role: Role) =>
    onChange(value.includes(role) ? value.filter((r) => r !== role) : [...value, role]);
  return (
    <fieldset>
      <legend className="mb-3">{legend}</legend>
      <div className="grid gap-3">
        {ROLES.map((role) => (
          <OptionCard
            key={role}
            type="checkbox"
            name="roles"
            checked={value.includes(role)}
            onChange={() => toggle(role)}
            title={ROLE_LABELS[role].label}
            description={ROLE_LABELS[role].blurb}
            leading={ROLE_LABELS[role].emoji}
          />
        ))}
      </div>
    </fieldset>
  );
}

const GOAL_COPY: Record<DailyGoal, { title: string; emoji: string }> = {
  5: { title: 'Gentle', emoji: '🌱' },
  10: { title: 'Steady', emoji: '🚶' },
  15: { title: 'Ambitious', emoji: '🚀' },
};

export function GoalPicker({
  value,
  onChange,
  legend,
}: {
  value: DailyGoal;
  onChange: (goal: DailyGoal) => void;
  legend: ReactNode;
}) {
  return (
    <fieldset>
      <legend className="mb-3">{legend}</legend>
      <div className="grid gap-3">
        {([5, 10, 15] as const).map((goal) => (
          <OptionCard
            key={goal}
            type="radio"
            name="dailyGoal"
            checked={value === goal}
            onChange={() => onChange(goal)}
            title={`${goal} words · ${GOAL_COPY[goal].title}`}
            description={`About ${estimateMinutes(goal)} minutes a day`}
            leading={GOAL_COPY[goal].emoji}
          />
        ))}
      </div>
    </fieldset>
  );
}

const LEVEL_EMOJI: Record<Level, string> = {
  'upper-intermediate': '📗',
  advanced: '📘',
  proficient: '📕',
};

export function LevelPicker({
  value,
  onChange,
  legend,
}: {
  value: Level;
  onChange: (level: Level) => void;
  legend: ReactNode;
}) {
  return (
    <fieldset>
      <legend className="mb-3">{legend}</legend>
      <div className="grid gap-3">
        {LEVELS.map((level) => (
          <OptionCard
            key={level}
            type="radio"
            name="level"
            checked={value === level}
            onChange={() => onChange(level)}
            title={LEVEL_LABELS[level].label}
            description={LEVEL_LABELS[level].blurb}
            leading={LEVEL_EMOJI[level]}
          />
        ))}
      </div>
    </fieldset>
  );
}
