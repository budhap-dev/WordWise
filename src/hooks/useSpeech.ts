import { useCallback, useEffect, useRef, useState } from 'react';

import {
  isSpeechSupported,
  loadVoices,
  pickBritishVoice,
  speak,
  stopSpeaking,
} from '../lib/speech';

export interface SpeechState {
  supported: boolean;
  /** null while voices are still loading. */
  britishVoice: SpeechSynthesisVoice | null | undefined;
  speakingText: string | null;
  say: (text: string, options?: { rate?: number }) => void;
}

export function useSpeech(): SpeechState {
  const supported = isSpeechSupported();
  const [britishVoice, setBritishVoice] = useState<SpeechSynthesisVoice | null | undefined>(
    supported ? undefined : null,
  );
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!supported) return;
    loadVoices().then((voices) => {
      if (mounted.current) setBritishVoice(pickBritishVoice(voices));
    });
    return () => {
      mounted.current = false;
      stopSpeaking();
    };
  }, [supported]);

  const say = useCallback(
    (text: string, options: { rate?: number } = {}) => {
      if (!supported) return;
      setSpeakingText(text);
      void speak(text, { ...options, voice: britishVoice ?? undefined }).finally(() => {
        if (mounted.current) setSpeakingText((t) => (t === text ? null : t));
      });
    },
    [supported, britishVoice],
  );

  return { supported, britishVoice, speakingText, say };
}
