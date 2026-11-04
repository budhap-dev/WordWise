import type { ReactNode } from 'react';

import { BottomSheet } from '../../components/ui/BottomSheet';
import { Button } from '../../components/ui/Button';
import { LEVEL_LABELS, LEVELS, REGISTERS } from '../../data';
import { NO_FILTERS, type SearchFilters, type StatusFilter } from '../../lib/search';
import type { Level, Register } from '../../types/content';
import { Chip } from './Chip';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All words' },
  { value: 'new', label: 'Not learnt yet' },
  { value: 'learnt', label: 'Learnt' },
  { value: 'due', label: 'Due for review' },
];

const REGISTER_LABELS: Record<Register, string> = {
  formal: 'Formal',
  neutral: 'Neutral',
  informal: 'Informal',
};

function toggle<T>(values: readonly T[], value: T): T[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="mt-5">
      <legend className="font-semibold">{title}</legend>
      {hint && <p className="text-sm text-ink-muted">{hint}</p>}
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

/**
 * Status, level and register filters in a bottom sheet: thumb-reachable on phones, and out of
 * the way of the results until it's wanted.
 */
export function FilterSheet({
  filters,
  onChange,
  onClose,
  resultCount,
  counts,
}: {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onClose: () => void;
  resultCount: number;
  counts: { learnt: number; due: number };
}) {
  const statusCount = (s: StatusFilter) =>
    s === 'learnt' ? counts.learnt : s === 'due' ? counts.due : undefined;

  return (
    <BottomSheet title="Filters" closeLabel="Close filters" onClose={onClose}>
      <Group title="Your progress">
        {STATUS_OPTIONS.map(({ value, label }) => {
          const count = statusCount(value);
          return (
            <Chip
              key={value}
              pressed={filters.status === value}
              onClick={() => onChange({ ...filters, status: value })}
            >
              {label}
              {count !== undefined && (
                <>
                  {' '}
                  <span className="opacity-70">· {count}</span>
                </>
              )}
            </Chip>
          );
        })}
      </Group>

      <Group title="Level" hint="Pick any number; none means every level.">
        {LEVELS.map((level: Level) => (
          <Chip
            key={level}
            pressed={filters.levels.includes(level)}
            onClick={() => onChange({ ...filters, levels: toggle(filters.levels, level) })}
          >
            {LEVEL_LABELS[level].label}
          </Chip>
        ))}
      </Group>

      <Group title="Register" hint="Formal for essays and reports, informal for the pub.">
        {REGISTERS.map((register) => (
          <Chip
            key={register}
            pressed={filters.registers.includes(register)}
            onClick={() => onChange({ ...filters, registers: toggle(filters.registers, register) })}
          >
            {REGISTER_LABELS[register]}
          </Chip>
        ))}
      </Group>

      <div className="mt-6 flex gap-2">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => onChange({ ...NO_FILTERS, category: filters.category })}
        >
          Clear
        </Button>
        <Button className="flex-[2]" onClick={onClose}>
          {resultCount === 0
            ? 'No words match'
            : `Show ${resultCount} ${resultCount === 1 ? 'word' : 'words'}`}
        </Button>
      </div>
    </BottomSheet>
  );
}
