import { X } from 'lucide-react';
import { type ReactNode, useEffect, useId, useRef } from 'react';

import { Button } from './Button';

/**
 * A modal sheet that rises from the bottom on phones (in thumb reach) and sits centred on larger
 * screens. Escape, the backdrop and the close button all close it; focus moves to its heading.
 */
export function BottomSheet({
  title,
  onClose,
  closeLabel = 'Close',
  children,
}: {
  title: ReactNode;
  onClose: () => void;
  /** The accessible name of the backdrop, e.g. "Close filters". */
  closeLabel?: string;
  children: ReactNode;
}) {
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        tabIndex={-1}
        aria-label={closeLabel}
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="relative max-h-[85dvh] w-full max-w-lg animate-rise overflow-y-auto rounded-t-3xl border border-line bg-surface px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:pb-5"
      >
        <div
          className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line sm:hidden"
          aria-hidden="true"
        />
        <div className="flex items-center justify-between gap-4">
          <h2
            id={headingId}
            ref={headingRef}
            tabIndex={-1}
            className="text-xl font-semibold outline-none"
          >
            {title}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Close"
            className="size-11 px-0"
            onClick={onClose}
          >
            <X className="size-5" aria-hidden="true" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
