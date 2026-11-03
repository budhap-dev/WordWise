import { type PointerEvent, useCallback, useRef, useState } from 'react';

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  /** Pixels of horizontal travel needed to count as a swipe. */
  threshold?: number;
  enabled?: boolean;
}

/**
 * Horizontal swipe for touch and pen. Vertical movement is left to the browser so
 * the card still scrolls (pair it with `touch-action: pan-y`). Returns the live
 * offset so the element can follow the finger.
 */
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
  enabled = true,
}: SwipeOptions) {
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const axis = useRef<'x' | 'y' | null>(null);
  const offset = useRef(0);
  const [dx, setDx] = useState(0);

  const reset = useCallback(() => {
    start.current = null;
    axis.current = null;
    offset.current = 0;
    setDx(0);
  }, []);

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      if (!enabled || e.pointerType === 'mouse') return;
      start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
      axis.current = null;
    },
    [enabled],
  );

  const onPointerMove = useCallback((e: PointerEvent) => {
    const s = start.current;
    if (!s || e.pointerId !== s.id) return;
    const mx = e.clientX - s.x;
    const my = e.clientY - s.y;
    if (!axis.current && (Math.abs(mx) > 10 || Math.abs(my) > 10)) {
      axis.current = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
    }
    if (axis.current === 'x') {
      offset.current = mx;
      setDx(mx);
    }
  }, []);

  const onPointerUp = useCallback(() => {
    const travelled = offset.current;
    const wasHorizontal = axis.current === 'x';
    reset();
    if (!wasHorizontal) return;
    if (travelled <= -threshold) onSwipeLeft?.();
    else if (travelled >= threshold) onSwipeRight?.();
  }, [onSwipeLeft, onSwipeRight, threshold, reset]);

  return {
    dx,
    /** True once the finger has moved far enough that letting go will trigger the swipe. */
    armed: Math.abs(dx) >= threshold,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: reset },
  };
}
