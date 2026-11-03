/**
 * Thin wrapper over the Web Speech API that prefers a British English (en-GB) voice.
 */

/** Well-known, natural-sounding en-GB voices on common platforms, in order of preference. */
const PREFERRED_VOICE_NAMES = [
  'Daniel', // macOS / iOS
  'Google UK English Female', // Chrome
  'Google UK English Male',
  'Microsoft Sonia', // Edge / Windows (natural voices)
  'Microsoft Libby',
  'Microsoft Ryan',
  'Serena',
  'Kate',
  'Arthur',
  'Martha',
];

export function isSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance !== 'undefined'
  );
}

function isBritish(voice: SpeechSynthesisVoice): boolean {
  return voice.lang.replace('_', '-').toLowerCase() === 'en-gb';
}

export function pickBritishVoice(
  voices: readonly SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  const british = voices.filter(isBritish);
  if (british.length === 0) return null;
  for (const name of PREFERRED_VOICE_NAMES) {
    const match = british.find((v) => v.name.includes(name));
    if (match) return match;
  }
  return british.find((v) => v.localService) ?? british[0]!;
}

/** Voices load asynchronously in some browsers (notably Chrome), so wait briefly for them. */
export function loadVoices(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSupported()) return Promise.resolve([]);
  const synth = window.speechSynthesis;
  const initial = synth.getVoices();
  if (initial.length > 0) return Promise.resolve(initial);

  return new Promise((resolve) => {
    const done = () => {
      synth.removeEventListener('voiceschanged', done);
      clearTimeout(timer);
      resolve(synth.getVoices());
    };
    const timer = setTimeout(done, timeoutMs);
    synth.addEventListener('voiceschanged', done);
  });
}

export interface SpeakOptions {
  rate?: number;
  voice?: SpeechSynthesisVoice | null;
}

/** Speaks `text` in British English. Resolves when speech ends (or fails). */
export async function speak(text: string, { rate = 0.95, voice }: SpeakOptions = {}) {
  if (!isSpeechSupported()) return;
  const synth = window.speechSynthesis;
  const chosen = voice === undefined ? pickBritishVoice(await loadVoices()) : voice;

  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-GB';
  utterance.rate = rate;
  if (chosen) utterance.voice = chosen;

  await new Promise<void>((resolve) => {
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    synth.speak(utterance);
  });
}

export function stopSpeaking() {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}
