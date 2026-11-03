import { type CSSProperties, useMemo } from 'react';

import { seededRandom } from '../../lib/random';

const COLOURS = ['var(--brand)', 'var(--accent)', 'var(--spark)', 'var(--success)'];

/** A short, decorative burst of confetti. Hidden from screen readers and for reduced motion. */
export function Confetti({ pieces = 36, seed = 7 }: { pieces?: number; seed?: number }) {
  const bits = useMemo(() => {
    const random = seededRandom(seed);
    return Array.from({ length: pieces }, (_, i) => ({
      left: random() * 100,
      delay: random() * 0.6,
      duration: 2.2 + random() * 1.6,
      drift: (random() - 0.5) * 160,
      spin: 360 + random() * 720,
      colour: COLOURS[i % COLOURS.length]!,
      round: i % 3 === 0,
    }));
  }, [pieces, seed]);

  return (
    <div
      aria-hidden="true"
      className="confetti pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {bits.map((b, i) => (
        <span
          key={i}
          className={`absolute top-0 block h-3 w-2 ${b.round ? 'rounded-full' : 'rounded-[2px]'}`}
          style={
            {
              left: `${b.left}%`,
              background: b.colour,
              animation: `confetti-fall ${b.duration}s cubic-bezier(.25,.6,.4,1) ${b.delay}s both`,
              '--drift': `${b.drift}px`,
              '--spin': `${b.spin}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
