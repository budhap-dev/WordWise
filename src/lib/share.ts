/** Sharing to WhatsApp and friends: the phone's share sheet where there is one, else WhatsApp. */
import type { WordEntry } from '../types/content';

/** Shared links always point at production, so previews and newcomers land in the right place. */
export const SITE_URL = 'https://wordwise-daily.vercel.app';

export interface ShareContent {
  title: string;
  text: string;
  url?: string;
}

export type ShareResult = 'shared' | 'whatsapp' | 'cancelled';

export function whatsappLink({ text, url = SITE_URL }: ShareContent): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
}

/** Opens the native share sheet (which includes WhatsApp on phones), or WhatsApp itself. */
export async function share(content: ShareContent): Promise<ShareResult> {
  const data = { title: content.title, text: content.text, url: content.url ?? SITE_URL };
  if (typeof navigator.share === 'function' && navigator.canShare?.(data) !== false) {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (error) {
      // The learner closed the sheet: that's fine, not an error.
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    }
  }
  window.open(whatsappLink(content), '_blank', 'noopener,noreferrer');
  return 'whatsapp';
}

export function wordOfTheDayShare(word: WordEntry): ShareContent {
  return {
    title: `Word of the day: ${word.term}`,
    text: `📚 Word of the day: *${word.term}* (${word.partOfSpeech})\n${word.definition}\n\nI'm learning a word a day with WordWise:`,
  };
}

/** Any word, linking straight to its page. */
export function wordShare(word: WordEntry): ShareContent {
  return {
    title: `${word.term} · WordWise`,
    text: `📚 *${word.term}* (${word.partOfSpeech})\n${word.definition}\n\nLook it up on WordWise:`,
    url: `${SITE_URL}/words/${word.id}`,
  };
}

export function progressShare(terms: readonly string[], streakDays: number): ShareContent {
  const count = terms.length;
  const what = count === 0 ? 'some new words' : `${count} new ${count === 1 ? 'word' : 'words'}`;
  const shown = terms.slice(0, 3).map((t) => `“${t}”`);
  const including = shown.length > 0 ? `, including ${shown.join(', ')}` : '';
  const streak = streakDays > 1 ? ` 🔥 ${streakDays}-day streak.` : '';
  return {
    title: 'My WordWise progress',
    text: `I've just learnt ${what} on WordWise${including}.${streak} Fancy joining me?`,
  };
}
