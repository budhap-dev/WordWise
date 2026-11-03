/**
 * "Add to home screen" support.
 *
 * Chrome, Edge and Samsung Internet fire `beforeinstallprompt`, which we keep so a button can
 * show the browser's own install dialog later. iOS has no such event: Safari users add the app
 * from the Share menu, so we show instructions instead. The listener is registered as soon as
 * this module loads (from main.tsx), because the event can fire before React has rendered.
 */

/** The non-standard event Chromium browsers fire when the app can be installed. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallMethod =
  /** We can show the browser's install dialog. */
  | 'prompt'
  /** iPhone or iPad: Share → Add to Home Screen. */
  | 'ios'
  /** Another browser: use its menu, if it supports installing at all. */
  | 'manual';

let deferred: BeforeInstallPromptEvent | null = null;
let installedNow = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // We'll offer our own, friendlier button.
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installedNow = true;
    notify();
  });
}

export function subscribeInstall(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** True when running as an installed app (home-screen icon), not in a browser tab. */
export function isStandalone(): boolean {
  if (installedNow) return true;
  if (typeof window === 'undefined') return false;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

export function isIos(
  userAgent = navigator.userAgent,
  touchPoints = navigator.maxTouchPoints,
): boolean {
  // iPadOS reports itself as a Mac, but Macs don't have touch screens.
  return /iphone|ipad|ipod/i.test(userAgent) || (/macintosh/i.test(userAgent) && touchPoints > 1);
}

export function isMobile(userAgent = navigator.userAgent): boolean {
  return isIos(userAgent) || /android|mobile/i.test(userAgent);
}

export function installMethod(): InstallMethod {
  if (deferred) return 'prompt';
  if (isIos()) return 'ios';
  return 'manual';
}

/** Shows the browser's install dialog. Resolves true if the learner accepted. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const event = deferred;
  deferred = null;
  await event.prompt();
  const { outcome } = await event.userChoice;
  notify();
  return outcome === 'accepted';
}

/** Test helper: forget any captured prompt or install. */
export function resetInstallState(): void {
  deferred = null;
  installedNow = false;
  notify();
}
