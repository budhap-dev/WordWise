import { SESSION_SIZE } from '../../lib/practice/session';
import type { SessionMode } from '../../lib/practice/types';

export interface ModeInfo {
  mode: SessionMode;
  emoji: string;
  title: string;
  blurb: string;
  /** Number of questions per session. */
  size: number;
}

/** Practice modes in the order shown on the Practice screen. The mixed bag comes first. */
export const MODES: readonly ModeInfo[] = [
  {
    mode: 'mixed',
    emoji: '🎲',
    title: 'Mixed bag',
    blurb: 'A bit of everything. Good if you can’t decide.',
  },
  {
    mode: 'meaning',
    emoji: '🧠',
    title: 'What does it mean?',
    blurb: 'Pick the right definition.',
  },
  {
    mode: 'gap-fill',
    emoji: '🧩',
    title: 'Fill the gap',
    blurb: 'Find the word that fits the sentence.',
  },
  {
    mode: 'better-word',
    emoji: '⚖️',
    title: 'Choose the better word',
    blurb: 'Affect or effect? Practice or practise?',
  },
  {
    mode: 'upgrade',
    emoji: '✨',
    title: 'Upgrade this sentence',
    blurb: 'Rewrite a plain sentence with a sharper word.',
  },
  {
    mode: 'register',
    emoji: '🎩',
    title: 'Register switch',
    blurb: 'Posh, polite or pub: pitch it right for the moment.',
  },
].map((m) => ({ ...m, mode: m.mode as SessionMode, size: SESSION_SIZE[m.mode as SessionMode] }));

export function modeInfo(mode: string): ModeInfo | undefined {
  return MODES.find((m) => m.mode === mode);
}
