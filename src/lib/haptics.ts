/**
 * Light haptic feedback on devices that support it (most Android browsers).
 * iOS Safari ignores the Vibration API, so this is purely a nice-to-have.
 */
export function haptic(pattern: number | readonly number[] = 8): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator)
      navigator.vibrate(typeof pattern === 'number' ? pattern : [...pattern]);
  } catch {
    // ignore
  }
}

export const HAPTIC = {
  tap: 8,
  success: [12, 40, 18],
} as const;
