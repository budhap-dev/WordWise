import { RefreshCw, WifiOff } from 'lucide-react';
import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

import { Button } from '../../components/ui/Button';

/**
 * Registers the service worker. When a new version is ready we ask before reloading, so a
 * learning session is never interrupted; the first time the app is cached, we say so briefly.
 */
export function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (!offlineReady) return;
    const t = setTimeout(() => setOfflineReady(false), 5000);
    return () => clearTimeout(t);
  }, [offlineReady, setOfflineReady]);

  if (!needRefresh && !offlineReady) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 top-[calc(0.75rem+env(safe-area-inset-top))] z-50 mx-auto flex max-w-md animate-rise items-center gap-3 rounded-2xl border border-line bg-surface p-3 pl-4 shadow-lg"
    >
      {needRefresh ? (
        <>
          <RefreshCw className="size-5 shrink-0 text-brand" aria-hidden="true" />
          <p className="flex-1 text-sm font-medium">A new version of WordWise is ready.</p>
          <Button size="sm" onClick={() => void updateServiceWorker(true)}>
            Refresh
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setNeedRefresh(false)}>
            Later
          </Button>
        </>
      ) : (
        <>
          <WifiOff className="size-5 shrink-0 text-brand" aria-hidden="true" />
          <p className="flex-1 text-sm font-medium">WordWise now works offline.</p>
        </>
      )}
    </div>
  );
}
