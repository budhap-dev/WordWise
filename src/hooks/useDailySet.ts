import { useMemo } from 'react';

import { WORDS } from '../data';
import { selectDailyWords } from '../lib/daily';
import { toDateKey } from '../lib/date';
import type { Settings } from '../types/user';

export function useDailySet(settings: Settings, date = toDateKey()) {
  return useMemo(
    () =>
      selectDailyWords({
        words: WORDS,
        roles: settings.roles,
        level: settings.level,
        size: settings.dailyGoal,
        date,
      }),
    [settings.roles, settings.level, settings.dailyGoal, date],
  );
}
