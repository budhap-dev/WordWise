import { Volume2, VolumeX } from 'lucide-react';

import { useSpeech } from '../../hooks/useSpeech';

/** Speaks a word or phrase in British English via the Web Speech API. */
export function SpeakButton({
  text,
  size = 'md',
  className = '',
}: {
  text: string;
  size?: 'md' | 'lg';
  className?: string;
}) {
  const { supported, britishVoice, speakingText, say } = useSpeech();
  const speaking = speakingText === text;
  const dims = size === 'lg' ? 'size-14' : 'size-11';
  const icon = size === 'lg' ? 'size-6' : 'size-5';

  if (!supported) {
    return (
      <span
        className={`inline-flex ${dims} items-center justify-center rounded-full bg-surface-2 text-ink-muted ${className}`}
        title="Your browser doesn't support speech"
      >
        <VolumeX className={icon} aria-hidden="true" />
        <span className="sr-only">Pronunciation audio isn't available in this browser</span>
      </span>
    );
  }

  const noBritishVoice = britishVoice === null;
  return (
    <button
      type="button"
      onClick={() => say(text)}
      aria-label={`Hear “${text}” pronounced${noBritishVoice ? '' : ' in a British accent'}`}
      title={
        noBritishVoice
          ? 'No British voice is installed, so your default voice will be used'
          : 'Hear it (British English)'
      }
      aria-pressed={speaking}
      className={`group relative inline-flex ${dims} shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand transition hover:scale-105 active:scale-95 ${className}`}
    >
      {speaking ? (
        <span className="flex h-5 items-center gap-[3px]" aria-hidden="true">
          {[0, 150, 300, 450].map((d) => (
            <span
              key={d}
              className="block h-full w-[3px] origin-center animate-wave rounded-full bg-current"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </span>
      ) : (
        <Volume2 className={icon} aria-hidden="true" />
      )}
    </button>
  );
}
