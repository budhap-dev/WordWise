import { useId } from 'react';

/**
 * The WordWise mark: a speech bubble with a "W" and the amber spark from the wordmark.
 * Same artwork as public/favicon.svg and the app icons.
 */
export function LogoMark({ className = 'size-8' }: { className?: string }) {
  const gradient = `logo-bg-${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6C64F6" />
          <stop offset="1" stopColor="#3F35C9" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill={`url(#${gradient})`} />
      <path
        d="M164 108h184a76 76 0 0 1 76 76v116a76 76 0 0 1-76 76H252l-74 58a10 10 0 0 1-16-9l7-49h-5a76 76 0 0 1-76-76V184a76 76 0 0 1 76-76z"
        fill="#fff"
      />
      <path
        d="M150 196l34 112 50-84 50 84 34-112"
        fill="none"
        stroke="#4F46E5"
        strokeWidth="36"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="366" cy="174" r="24" fill="#F5A524" />
    </svg>
  );
}

/** The wordmark, with the mark beside it unless `mark` is false. */
export function Logo({ className = '', mark = true }: { className?: string; mark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-display text-2xl font-semibold tracking-tight ${className}`}
    >
      {mark && <LogoMark className="size-[1.25em] shrink-0" />}
      <span>
        Word<span className="text-brand">Wise</span>
        <span className="ml-0.5 inline-block size-1.5 rounded-full bg-accent align-super" />
      </span>
    </span>
  );
}
