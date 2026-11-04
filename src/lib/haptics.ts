/**
 * Light haptic feedback on devices that support it (most Android browsers).
 * iOS Safari ignores the Vibration API, so this is purely a nice-to-have.
 */
export function haptic(pattern: number | readonly number[] = 8): void {
  try {
    // Browsers block vibration until the user has tapped the page; don't ask before then.
    if (typeof navigator !== 'undefined' && navigator.userActivation?.hasBeenActive === false)
      return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator)
      navigator.vibrate(typeof pattern === 'number' ? pattern : [...pattern]);
  } catch {
    // ignore
  }
}

export const HAPTIC = {
  tap: 8,
  success: [12, 40, 18],
  error: [30, 60, 30],
} as const;
