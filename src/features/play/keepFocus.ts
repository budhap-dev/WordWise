import type { MouseEvent } from 'react';

/** Keeps focus where it was when tapped, so Enter still means "check", not "press that again". */
export const keepFocus = (event: MouseEvent) => event.preventDefault();
