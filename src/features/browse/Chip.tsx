import type { ReactNode } from 'react';

/** A toggle chip for filters. At least 44px tall with its padding, for thumbs. */
export function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition active:scale-[0.97] ${
        pressed
          ? 'border-brand bg-brand text-brand-ink'
          : 'border-line bg-surface text-ink hover:border-ink-muted/50'
      }`}
    >
      {/* One flex child, so spaces inside the label survive. */}
      <span>{children}</span>
    </button>
  );
}
