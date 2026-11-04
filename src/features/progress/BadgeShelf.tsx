import { Check, Lock } from 'lucide-react';
import { useCallback, useState } from 'react';

import { BottomSheet } from '../../components/ui/BottomSheet';
import { cardClasses } from '../../components/ui/styles';
import {
  BADGE_GROUP_LABELS,
  type BadgeGroup,
  type BadgeStatus,
} from '../../lib/achievements/badges';

const GROUPS = Object.keys(BADGE_GROUP_LABELS) as BadgeGroup[];

function MiniBar({ current, target }: { current: number; target: number }) {
  return (
    <span className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-surface-2">
      <span
        className="block h-full rounded-full bg-brand"
        style={{ width: `${Math.round((current / target) * 100)}%` }}
      />
    </span>
  );
}

function BadgeTile({
  status,
  isNew,
  onOpen,
}: {
  status: BadgeStatus;
  isNew: boolean;
  onOpen: () => void;
}) {
  const { badge, earned, current } = status;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${badge.name}: ${earned ? 'earned' : `not yet, ${current} of ${badge.target}`}${isNew ? ', new' : ''}`}
      className={`relative flex h-full w-full flex-col items-center rounded-2xl border p-3 text-center transition active:scale-95 ${
        earned ? 'border-brand/30 bg-brand-soft/50' : 'border-dashed border-line'
      } ${isNew ? 'animate-pop' : ''}`}
    >
      {isNew && (
        <span className="absolute -top-2 right-2 rounded-full bg-brand px-1.5 py-0.5 text-[0.65rem] font-bold tracking-wide text-brand-ink uppercase">
          New
        </span>
      )}
      <span
        aria-hidden="true"
        className={`text-3xl leading-none ${earned ? '' : 'opacity-40 grayscale'}`}
      >
        {badge.emoji}
      </span>
      <span
        className={`mt-2 text-xs leading-tight font-semibold ${earned ? '' : 'text-ink-muted'}`}
      >
        {badge.name}
      </span>
      {!earned && badge.target > 1 && <MiniBar current={current} target={badge.target} />}
    </button>
  );
}

function BadgeSheet({ status, onClose }: { status: BadgeStatus; onClose: () => void }) {
  const { badge, earned, current } = status;
  return (
    <BottomSheet title={badge.name} closeLabel="Close badge" onClose={onClose}>
      <div className="mt-2 flex flex-col items-center text-center">
        <span
          aria-hidden="true"
          className={`animate-pop text-7xl ${earned ? '' : 'opacity-40 grayscale'}`}
        >
          {badge.emoji}
        </span>
        <p
          className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
            earned ? 'bg-success-soft text-ink' : 'bg-surface-2 text-ink-muted'
          }`}
        >
          {earned ? (
            <Check className="size-4 text-success" aria-hidden="true" />
          ) : (
            <Lock className="size-4" aria-hidden="true" />
          )}
          {earned ? 'Earned' : 'Not yet'}
        </p>
        <p className="mt-3 font-medium">{badge.how}</p>
        {earned ? (
          <p className="mt-2 text-ink-muted italic">{badge.quip}</p>
        ) : (
          badge.target > 1 && (
            <div className="mt-3 w-full max-w-xs">
              <MiniBar current={current} target={badge.target} />
              <p className="mt-1.5 text-sm text-ink-muted">
                {current} of {badge.target} · {badge.target - current} to go
              </p>
            </div>
          )
        )}
      </div>
    </BottomSheet>
  );
}

export function BadgeShelf({
  badges,
  highlight,
}: {
  badges: readonly BadgeStatus[];
  /** Badges earned since the learner last looked. */
  highlight: ReadonlySet<string>;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const earned = badges.filter((b) => b.earned).length;
  const openStatus = badges.find((b) => b.badge.id === open);
  const close = useCallback(() => setOpen(null), []);

  return (
    <section aria-labelledby="badges-heading" className={`${cardClasses} p-5`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="badges-heading" className="text-lg font-semibold">
          Badges
        </h2>
        <p className="text-sm text-ink-muted">
          {earned} of {badges.length} earned
        </p>
      </div>

      {GROUPS.map((group) => {
        const inGroup = badges.filter((b) => b.badge.group === group);
        return (
          <div key={group} className="mt-5">
            <h3 className="text-sm font-semibold text-ink-muted">{BADGE_GROUP_LABELS[group]}</h3>
            <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {inGroup.map((status) => (
                <li key={status.badge.id}>
                  <BadgeTile
                    status={status}
                    isNew={highlight.has(status.badge.id)}
                    onOpen={() => setOpen(status.badge.id)}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {openStatus && <BadgeSheet status={openStatus} onClose={close} />}
    </section>
  );
}
