import { type CSSProperties, type KeyboardEvent, useMemo, useRef, useState } from 'react';

import { cardClasses } from '../../components/ui/styles';
import { type DayActivity, dayTotal, describeDay, plural } from '../../lib/achievements/stats';
import { addDays, type DateKey, fromDateKey } from '../../lib/date';

export const CALENDAR_WEEKS = 12;

/** Activity is a magnitude, so it's one hue (the theme's brand colour) from light to dark. */
const STEPS = [
  { min: 1, mix: 40 },
  { min: 5, mix: 60 },
  { min: 15, mix: 80 },
  { min: 30, mix: 100 },
] as const;

function cellStyle(total: number): CSSProperties | undefined {
  const step = STEPS.findLast((s) => total >= s.min);
  return step
    ? { background: `color-mix(in oklab, var(--brand) ${step.mix}%, var(--surface))` }
    : undefined;
}

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

const shortDate = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});
const longDate = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const monthName = new Intl.DateTimeFormat('en-GB', { month: 'short' });

/** Monday of the week containing `date` (weeks start on Monday in the UK). */
function mondayOf(date: DateKey): DateKey {
  const dow = (fromDateKey(date).getDay() + 6) % 7; // Mon = 0
  return addDays(date, -dow);
}

/**
 * The last 12 weeks, GitHub-style: a column per week, Monday at the top. Tap (or use the arrow
 * keys on) a day to see what you did.
 */
export function ActivityCalendar({
  days,
  today,
}: {
  days: ReadonlyMap<DateKey, DayActivity>;
  today: DateKey;
}) {
  const start = useMemo(() => addDays(mondayOf(today), -7 * (CALENDAR_WEEKS - 1)), [today]);
  const weeks = useMemo(
    () =>
      Array.from({ length: CALENDAR_WEEKS }, (_, w) =>
        Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)),
      ),
    [start],
  );
  const [selected, setSelected] = useState(today);
  const cells = useRef(new Map<DateKey, HTMLButtonElement>());

  const inRange = weeks.flat().filter((d) => d <= today);
  const activeDays = inRange.filter((d) => dayTotal(days.get(d)) > 0).length;

  const move = (e: KeyboardEvent, date: DateKey) => {
    const by: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 };
    let next: DateKey | undefined;
    if (e.key in by) next = addDays(date, by[e.key]!);
    else if (e.key === 'Home') next = start;
    else if (e.key === 'End') next = today;
    if (!next) return;
    e.preventDefault();
    if (next < start || next > today) return;
    setSelected(next);
    cells.current.get(next)?.focus();
  };

  return (
    <section aria-labelledby="activity-heading" className={`${cardClasses} p-5`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="activity-heading" className="text-lg font-semibold">
          Activity
        </h2>
        <p className="text-sm text-ink-muted">
          Active on {activeDays} of the last {inRange.length} days
        </p>
      </div>

      <div className="mt-4 flex gap-1.5">
        {/* Day names */}
        <div className="grid grid-rows-[auto_repeat(7,1fr)] gap-1 text-[0.65rem] text-ink-muted">
          <span aria-hidden="true">&nbsp;</span>
          {DAY_LABELS.map((label, i) => (
            <span key={i} aria-hidden="true" className="flex items-center leading-none">
              {label}
            </span>
          ))}
        </div>

        <div
          role="group"
          aria-label={`Activity over the last ${CALENDAR_WEEKS} weeks`}
          className="grid flex-1 grid-flow-col gap-1"
          style={{ gridTemplateColumns: `repeat(${CALENDAR_WEEKS}, minmax(0, 1fr))` }}
        >
          {weeks.map((week, w) => {
            const firstOfMonth = week.find((d) => d.endsWith('-01'));
            const label = w === 0 ? week[0] : firstOfMonth;
            return (
              <div key={week[0]} className="grid grid-rows-[auto_repeat(7,1fr)] gap-1">
                <span
                  aria-hidden="true"
                  className="h-3.5 overflow-visible text-[0.65rem] leading-none whitespace-nowrap text-ink-muted"
                >
                  {label ? monthName.format(fromDateKey(label)) : ''}
                </span>
                {week.map((date) => {
                  if (date > today) return <span key={date} aria-hidden="true" />;
                  const total = dayTotal(days.get(date));
                  const isSelected = date === selected;
                  return (
                    <button
                      key={date}
                      ref={(el) => {
                        if (el) cells.current.set(date, el);
                        else cells.current.delete(date);
                      }}
                      type="button"
                      tabIndex={isSelected ? 0 : -1}
                      aria-pressed={isSelected}
                      aria-current={date === today ? 'date' : undefined}
                      aria-label={`${shortDate.format(fromDateKey(date))}: ${
                        total === 0 ? 'nothing' : plural(total, 'activity', 'activities')
                      }`}
                      onClick={() => setSelected(date)}
                      onKeyDown={(e) => move(e, date)}
                      className={`aspect-square w-full rounded-[4px] bg-surface-2 outline-offset-1 ${
                        isSelected ? 'ring-2 ring-ink ring-offset-1 ring-offset-surface' : ''
                      }`}
                      style={cellStyle(total)}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="mt-3 flex items-center justify-end gap-1 text-xs text-ink-muted"
        aria-hidden="true"
      >
        Less
        <span className="size-3 rounded-[3px] bg-surface-2" />
        {STEPS.map((s) => (
          <span key={s.min} className="size-3 rounded-[3px]" style={cellStyle(s.min)} />
        ))}
        More
      </div>

      <p className="mt-3 rounded-2xl bg-surface-2 px-4 py-3 text-sm" aria-live="polite">
        <span className="font-semibold">
          {selected === today ? 'Today' : longDate.format(fromDateKey(selected))}:
        </span>{' '}
        {describeDay(days.get(selected), selected === today)}
      </p>
    </section>
  );
}
