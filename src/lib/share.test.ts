import { getWord } from '../data';
import { progressShare, share, SITE_URL, whatsappLink, wordOfTheDayShare } from './share';

const content = { title: 'Hi', text: 'Hello there' };

afterEach(() => {
  Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  vi.restoreAllMocks();
});

describe('share', () => {
  it('uses the phone’s share sheet when there is one', async () => {
    const native = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'share', { value: native, configurable: true });
    await expect(share(content)).resolves.toBe('shared');
    expect(native).toHaveBeenCalledWith({ ...content, url: SITE_URL });
  });

  it('treats closing the share sheet as a cancel, not a failure', async () => {
    const native = vi.fn(() => Promise.reject(new DOMException('closed', 'AbortError')));
    Object.defineProperty(navigator, 'share', { value: native, configurable: true });
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    await expect(share(content)).resolves.toBe('cancelled');
    expect(open).not.toHaveBeenCalled();
  });

  it('falls back to WhatsApp', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    await expect(share(content)).resolves.toBe('whatsapp');
    expect(open).toHaveBeenCalledWith(whatsappLink(content), '_blank', 'noopener,noreferrer');
  });

  it('builds a WhatsApp link with the text and the site', () => {
    const link = new URL(whatsappLink(content));
    expect(link.origin).toBe('https://wa.me');
    expect(link.searchParams.get('text')).toBe(`Hello there\n${SITE_URL}`);
  });
});

describe('share messages', () => {
  it('shares the word of the day with its definition', () => {
    const word = getWord('kerfuffle')!;
    const { text } = wordOfTheDayShare(word);
    expect(text).toContain('*kerfuffle*');
    expect(text).toContain(word.definition);
  });

  it('shares progress, mentioning a streak only when there is one', () => {
    expect(progressShare(['nuance', 'caveat', 'candid', 'wary'], 3).text).toBe(
      'I’ve just learnt 4 new words on WordWise, including “nuance”, “caveat”, “candid”. 🔥 3-day streak. Fancy joining me?'.replace(
        'I’ve',
        "I've",
      ),
    );
    expect(progressShare(['nuance'], 1).text).not.toContain('streak');
    expect(progressShare(['nuance'], 1).text).toContain('1 new word on WordWise');
  });
});
