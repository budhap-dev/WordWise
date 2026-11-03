import { useSyncExternalStore } from 'react';

import { installMethod, type InstallMethod, isStandalone, subscribeInstall } from '../lib/install';

/** Whether the app is already installed, and how it can be installed if not. */
export function useInstall(): { installed: boolean; method: InstallMethod } {
  const snapshot = useSyncExternalStore(
    subscribeInstall,
    () => `${isStandalone()}|${installMethod()}`,
    () => 'false|manual',
  );
  const [installed, method] = snapshot.split('|') as ['true' | 'false', InstallMethod];
  return { installed: installed === 'true', method };
}
