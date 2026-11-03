import type { ReactNode } from 'react';

/**
 * A bar pinned to the bottom of the screen, in easy thumb reach on phones,
 * clear of the home indicator. Pages using it should leave bottom padding (pb-32).
 */
export function StickyActionBar({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div
      role={label ? 'region' : undefined}
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-bg/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-2xl items-center gap-3">{children}</div>
    </div>
  );
}
