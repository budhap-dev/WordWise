import { X } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';

import { Button } from '../../components/ui/Button';
import { Confetti } from '../../components/ui/Confetti';
import { useAchievements } from '../../hooks/useAchievements';
import { BADGES } from '../../lib/achievements/badges';
import { levelTitle } from '../../lib/achievements/xp';
import { HAPTIC, haptic } from '../../lib/haptics';
import { useCelebrations, writeCelebrated } from '../../state/celebrations';

export const CELEBRATION_MS = 8000;

/**
 * Announces new badges and level-ups when the learner is back on a main screen (never in the
 * middle of a session). Tapping it, closing it or letting it fade all count as seen.
 */
export function CelebrationToast() {
  const { pathname } = useLocation();
  const data = useAchievements();
  const earned = data?.badges.filter((b) => b.earned).map((b) => b.badge.id);
  const { newBadges, levelUp, markSeen, celebrated } = useCelebrations(
    data && earned ? { earned, level: data.level.level } : undefined,
  );
  const onProgress = pathname === '/progress';
  const show = !onProgress && (newBadges.length > 0 || levelUp !== null);

  // After a reset, forget what was celebrated, so it's celebrated again when re-earned.
  const currentLevel = data?.level.level;
  const earnedKey = earned?.join(',');
  useEffect(() => {
    if (currentLevel === undefined || earnedKey === undefined) return;
    const stillEarned = new Set(earnedKey.split(','));
    const badges = celebrated.badges.filter((id) => stillEarned.has(id));
    if (currentLevel < celebrated.level || badges.length < celebrated.badges.length) {
      writeCelebrated({ badges, level: Math.min(currentLevel, celebrated.level) });
    }
  }, [currentLevel, earnedKey, celebrated]);

  useEffect(() => {
    if (!show) return;
    haptic(HAPTIC.success);
    const t = setTimeout(markSeen, CELEBRATION_MS);
    return () => clearTimeout(t);
  }, [show, markSeen]);

  if (!show) return null;

  const first = BADGES.find((b) => b.id === newBadges[0]);
  const title = levelTitle(levelUp ?? 1);
  return (
    <>
      {levelUp !== null && <Confetti seed={levelUp} />}
      <div
        role="status"
        className="fixed inset-x-4 top-[calc(4.25rem+env(safe-area-inset-top))] z-40 mx-auto flex max-w-md animate-pop items-center gap-2 rounded-2xl border border-brand/30 bg-surface p-2 pl-4 shadow-xl shadow-brand/15 sm:top-20"
      >
        <Link to="/progress" onClick={markSeen} className="flex flex-1 items-center gap-3 py-1">
          <span aria-hidden="true" className="text-3xl">
            {levelUp !== null ? title.emoji : (first?.emoji ?? '🏅')}
          </span>
          <span className="flex-1 text-sm">
            {levelUp !== null && (
              <span className="block font-semibold">
                Level up! You’re now level {levelUp}: {title.title}
              </span>
            )}
            {newBadges.length > 0 && (
              <span className={`block ${levelUp !== null ? 'text-ink-muted' : 'font-semibold'}`}>
                {newBadges.length === 1 && first
                  ? `Badge unlocked: ${first.name}`
                  : `${newBadges.length} new badges unlocked`}
              </span>
            )}
            <span className="block text-xs text-brand">See your progress</span>
          </span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Dismiss"
          className="size-11 shrink-0 px-0"
          onClick={markSeen}
        >
          <X className="size-5" aria-hidden="true" />
        </Button>
      </div>
    </>
  );
}
