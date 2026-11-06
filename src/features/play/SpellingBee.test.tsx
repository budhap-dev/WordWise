import { screen, waitFor, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { vi } from 'vitest';

import { WORDS } from '../../data';
import { db } from '../../db/db';
import { isSpellable, maskWord } from '../../lib/practice/bee';
import { renderApp } from '../../test/render';

/** Let the lock that stops a double tap skipping the feedback expire. */
const pause = () => new Promise((r) => setTimeout(r, 450));

/** Works out the word being asked, from the clue on screen. */
function currentWord() {
  const clue = screen.getByRole('heading', { name: 'It means' }).nextElementSibling?.textContent;
  const word = WORDS.find((w) => isSpellable(w) && maskWord(w.definition, w) === clue);
  if (!word) throw new Error(`No word for clue "${clue}"`);
  return word.term;
}

async function tapOut(user: UserEvent, text: string) {
  const keyboard = within(screen.getByRole('group', { name: 'Keyboard' }));
  for (const letter of text) await user.click(keyboard.getByRole('button', { name: letter }));
}

async function misspell(user: UserEvent) {
  await tapOut(user, 'zzz');
  await user.click(screen.getByRole('button', { name: /check spelling/i }));
}

async function saveGame(words: [string, boolean][], score = 40) {
  await db.gameScores.add({
    id: `g${Math.random()}`,
    game: 'bee',
    score,
    correct: words.filter(([, c]) => c).length,
    answered: words.length,
    bestCombo: 1,
    date: new Date().toLocaleDateString('en-CA'),
    playedAt: new Date().toISOString(),
    words: words.map(([wordId, correct]) => ({ wordId, correct })),
  });
}

describe('Spelling Bee', () => {
  it('is on the Practice screen', async () => {
    renderApp({ route: '/practice' });
    expect(await screen.findByRole('link', { name: /spelling bee/i })).toHaveAttribute(
      'href',
      '/play/bee',
    );
  });

  it('explains the rules, then plays: points for right, lives for wrong', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/play/bee' });

    expect(await screen.findByRole('heading', { name: 'Spelling Bee' })).toBeInTheDocument();
    expect(screen.getByText(/three lives/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /start the bee/i }));

    expect(screen.getByLabelText('3 of 3 lives left')).toBeInTheDocument();
    expect(screen.getByText(/round 1: a doddle/i)).toBeInTheDocument();

    const term = currentWord();
    await tapOut(user, term);
    expect(screen.getAllByRole('status')[0]).toHaveTextContent(
      `Your spelling: ${[...term].join(' ')}`,
    );
    await user.click(screen.getByRole('button', { name: /check spelling/i }));

    const points = term.length * 2;
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(`+${points}`);
    // The card animates, and a transform would pin this "fixed" bar over the card's own text.
    expect(screen.getByRole('button', { name: /next word/i }).closest('section')).toBeNull();
    await pause();
    await user.click(screen.getByRole('button', { name: /next word/i }));

    await misspell(user);
    expect(screen.getByLabelText('2 of 3 lives left')).toBeInTheDocument();
    expect(screen.getByText(/you wrote/i)).toBeInTheDocument();
    await pause();
    await user.click(screen.getByRole('button', { name: /next word/i }));

    await misspell(user);
    await pause();
    await user.click(screen.getByRole('button', { name: /next word/i }));

    await misspell(user);
    expect(screen.getByLabelText('0 of 3 lives left')).toBeInTheDocument();
    await pause();
    await user.click(screen.getByRole('button', { name: /see how you did/i }));

    expect(await screen.findByText(/your first score/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(String(points));
    expect(screen.getByText('Words to remember')).toBeInTheDocument();

    await waitFor(async () => expect(await db.gameScores.count()).toBe(1));
    const [saved] = await db.gameScores.toArray();
    expect(saved).toMatchObject({ game: 'bee', score: points, correct: 1, answered: 4 });
    expect(saved?.words).toHaveLength(4);

    await user.click(screen.getByRole('button', { name: /play again/i }));
    expect(await screen.findByText(/your best:/i)).toHaveTextContent(`Your best: ${points}`);
    expect(screen.getByRole('link', { name: /3 tricky words/i })).toHaveAttribute(
      'href',
      '/play/bee/tricky',
    );
  });

  it('works from a physical keyboard, without the phone’s getting in the way', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/play/bee' });
    await user.click(await screen.findByRole('button', { name: /start the bee/i }));
    expect(document.querySelector('input, textarea')).toBeNull();

    await user.keyboard('zq{Backspace}z');
    expect(screen.getAllByRole('status')[0]).toHaveTextContent('Your spelling: z z');
    await user.keyboard('{Enter}');
    expect(screen.getByLabelText('2 of 3 lives left')).toBeInTheDocument();

    // A second Enter straight away doesn't skip the feedback…
    await user.keyboard('{Enter}');
    expect(screen.getByText(/you wrote/i)).toBeInTheDocument();
    // …but one after a moment moves on.
    await pause();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('heading', { name: 'It means' })).toBeInTheDocument();
  });

  it('won’t spend a hint when Enter follows a tap on the hint button', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/play/bee' });
    await user.click(await screen.findByRole('button', { name: /start the bee/i }));
    await user.click(screen.getByRole('button', { name: /give me a letter/i }));
    await user.keyboard('{Enter}');
    // Enter checked the one revealed letter, rather than revealing another.
    expect(screen.getByText(/you wrote/i)).toBeInTheDocument();
  });

  it('gives away a letter, for a price', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/play/bee' });
    await user.click(await screen.findByRole('button', { name: /start the bee/i }));
    const term = currentWord();
    await user.click(screen.getByRole('button', { name: /give me a letter/i }));
    await tapOut(user, term.slice(1));
    await user.click(screen.getByRole('button', { name: /check spelling/i }));
    const points = Math.round(term.length * 2 * 0.75);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(`+${points}`);
  });

  it('asks for the British spelling, without costing a life', async () => {
    await saveGame([['synthesise', false]]);
    const user = userEvent.setup();
    renderApp({ route: '/play/bee/tricky' });
    await user.click(await screen.findByRole('button', { name: /have another go/i }));

    await tapOut(user, 'synthesize');
    await user.click(screen.getByRole('button', { name: /check spelling/i }));
    expect(screen.getByText(/american spelling/i)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Keyboard' })).toBeInTheDocument();
  });

  it('copes without speech: shows the sentence and the letter count', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/play/bee' });
    expect(await screen.findByText(/can’t read words aloud/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /start the bee/i }));

    expect(screen.queryByRole('button', { name: /hear the word/i })).not.toBeInTheDocument();
    expect(screen.getByText(`${currentWord().length} letters`)).toBeInTheDocument();
  });

  describe('with speech', () => {
    const spoken: { text: string; rate: number }[] = [];

    beforeEach(() => {
      spoken.length = 0;
      class Utterance {
        lang = '';
        rate = 1;
        voice = null;
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        text: string;
        constructor(text: string) {
          this.text = text;
        }
      }
      vi.stubGlobal('SpeechSynthesisUtterance', Utterance);
      vi.stubGlobal('speechSynthesis', {
        getVoices: () => [{ lang: 'en-GB', name: 'Daniel', localService: true }],
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        cancel: () => undefined,
        speak: (u: Utterance) => spoken.push({ text: u.text, rate: u.rate }),
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('says the word on starting, and again (or slowly) on request, without printing it', async () => {
      const user = userEvent.setup();
      renderApp({ route: '/play/bee' });
      await user.click(await screen.findByRole('button', { name: /start the bee/i }));

      const term = currentWord();
      await waitFor(() => expect(spoken.at(-1)?.text).toBe(term));
      expect(document.body.textContent).not.toContain(term);
      expect(document.body.innerHTML).not.toContain(`“${term}”`);

      await user.click(screen.getByRole('button', { name: 'Hear the word' }));
      expect(spoken).toHaveLength(2);
      await user.click(screen.getByRole('button', { name: 'Hear it slowly' }));
      expect(spoken.at(-1)).toEqual({ text: term, rate: 0.55 });
    });

    it('says the next word when moving on', async () => {
      const user = userEvent.setup();
      renderApp({ route: '/play/bee' });
      await user.click(await screen.findByRole('button', { name: /start the bee/i }));
      await misspell(user);
      await pause();
      await user.click(screen.getByRole('button', { name: /next word/i }));
      await waitFor(() => expect(spoken.at(-1)?.text).toBe(currentWord()));
    });
  });

  describe('tricky words', () => {
    it('says so when there are none', async () => {
      renderApp({ route: '/play/bee/tricky' });
      expect(await screen.findByText(/nothing on the list/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /to the bee/i })).toHaveAttribute(
        'href',
        '/play/bee',
      );
    });

    it('takes a word off the list once it’s spelt right, with no lives at stake', async () => {
      await saveGame([
        ['gauge', false],
        ['candid', true],
      ]);
      const user = userEvent.setup();
      renderApp({ route: '/play/bee/tricky' });
      await user.click(await screen.findByRole('button', { name: /have another go/i }));
      expect(screen.queryByLabelText(/lives left/)).not.toBeInTheDocument();

      await tapOut(user, 'gauge');
      await user.click(screen.getByRole('button', { name: /check spelling/i }));
      await pause();
      await user.click(screen.getByRole('button', { name: /see how you did/i }));

      expect(await screen.findByText('All sorted')).toBeInTheDocument();
      await waitFor(async () => expect(await db.gameScores.count()).toBe(2));

      await user.click(screen.getByRole('button', { name: /back to the list/i }));
      expect(await screen.findByText(/nothing on the list/i)).toBeInTheDocument();
    });

    it('doesn’t let a tricky round set the personal best', async () => {
      await saveGame([['gauge', false]], 5);
      const user = userEvent.setup();
      renderApp({ route: '/play/bee/tricky' });
      await user.click(await screen.findByRole('button', { name: /have another go/i }));
      await tapOut(user, 'gauge');
      await user.click(screen.getByRole('button', { name: /check spelling/i }));
      await pause();
      await user.click(screen.getByRole('button', { name: /see how you did/i }));
      await waitFor(async () => expect(await db.gameScores.count()).toBe(2));
      const scores = await db.gameScores.where('game').equals('bee').toArray();
      expect(scores.map((g) => g.score)).toEqual([5]);
    });
  });

  it('earns XP, counts towards the streak and fills the badges', async () => {
    await saveGame([['gauge', true]], 400);
    renderApp({ route: '/progress' });
    expect(await screen.findByText('40 XP')).toBeInTheDocument();
    expect(screen.getByText('1 of 22 earned')).toBeInTheDocument();
  });
});
