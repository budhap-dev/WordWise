import { Check, Delete } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '../../components/ui/Button';
import { HAPTIC, haptic } from '../../lib/haptics';
import { keepFocus } from './keepFocus';

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

function Key({
  label,
  wide,
  onPress,
  children,
}: {
  label: string;
  wide?: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onMouseDown={keepFocus}
      onClick={() => {
        haptic(HAPTIC.tap);
        onPress();
      }}
      // Flush keys with the visible cap inset, so every pixel of the row is a target.
      className={`group h-12 touch-manipulation p-0.5 select-none ${wide ? 'basis-[15%]' : 'basis-[10%]'}`}
    >
      <span className="flex h-full items-center justify-center rounded-lg border border-line bg-surface text-lg font-semibold uppercase shadow-sm transition-colors group-active:border-brand group-active:bg-brand-soft">
        {children}
      </span>
    </button>
  );
}

/**
 * The game's own keyboard. A phone's keyboard would autocorrect and suggest the very word being
 * tested, and take up half the screen doing it. A physical keyboard works too (see SpellingBee).
 */
export function BeeKeyboard({
  canCheck,
  onLetter,
  onBackspace,
  onCheck,
}: {
  canCheck: boolean;
  onLetter: (letter: string) => void;
  onBackspace: () => void;
  onCheck: () => void;
}) {
  return (
    <div role="group" aria-label="Keyboard">
      {ROWS.map((row, i) => (
        <div key={row} className="flex justify-center">
          {[...row].map((letter) => (
            <Key key={letter} label={letter} onPress={() => onLetter(letter)}>
              {letter}
            </Key>
          ))}
          {i === ROWS.length - 1 && (
            <Key label="Delete last letter" wide onPress={onBackspace}>
              <Delete className="size-5" aria-hidden="true" />
            </Key>
          )}
        </div>
      ))}
      <Button
        size="md"
        className="mt-1.5 w-full touch-manipulation"
        disabled={!canCheck}
        onMouseDown={keepFocus}
        onClick={onCheck}
      >
        <Check className="size-5" aria-hidden="true" /> Check spelling
      </Button>
    </div>
  );
}
