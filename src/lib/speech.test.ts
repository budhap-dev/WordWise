import { pickBritishVoice } from './speech';

function voice(name: string, lang: string, localService = true): SpeechSynthesisVoice {
  return { name, lang, localService, default: false, voiceURI: name } as SpeechSynthesisVoice;
}

describe('pickBritishVoice', () => {
  it('returns null when there is no en-GB voice', () => {
    expect(pickBritishVoice([voice('Samantha', 'en-US'), voice('Karen', 'en-AU')])).toBeNull();
  });

  it('prefers well-known natural British voices', () => {
    const voices = [voice('Some Voice', 'en-GB'), voice('Daniel', 'en-GB'), voice('Alex', 'en-US')];
    expect(pickBritishVoice(voices)?.name).toBe('Daniel');
  });

  it('accepts underscore and lower-case language tags', () => {
    expect(pickBritishVoice([voice('Android voice', 'en_gb')])?.name).toBe('Android voice');
  });

  it('falls back to a local British voice', () => {
    const voices = [voice('Remote', 'en-GB', false), voice('Local', 'en-GB', true)];
    expect(pickBritishVoice(voices)?.name).toBe('Local');
  });
});
