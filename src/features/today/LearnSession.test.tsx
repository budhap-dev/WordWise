import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WORDS } from '../../data';
import { db, newCard } from '../../db/db';
import { selectDailyWords } from '../../lib/daily';
import { addDays, toDateKey } from '../../lib/date';
import { renderApp, TEST_SETTINGS } from '../../test/render';

const todaysWords = (excludeIds?: Set<string>) =>
  selectDailyWords({
    words: WORDS,
    roles: TEST_SETTINGS.roles,
    level: TEST_SETTINGS.level,
    size: TEST_SETTINGS.dailyGoal,
    date: toDateKey(),
    excludeIds,
  });

/** Waits for the session to load its saved progress. */
const sessionReady = () => screen.findByRole('button', { name: /reveal/i });
const savedCards = async (n: number) => waitFor(async () => expect(await db.cards.count()).toBe(n));

describe('daily learning session', () => {
  it('shows the word of the day on the Today screen', async () => {
    renderApp();
    const [first] = todaysWords();
    expect(await screen.findByRole('heading', { level: 2, name: first!.term })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /start today's words/i })).toBeInTheDocument();
  });

  it('reveals each word and finishes with a celebration', async () => {
    const user = userEvent.setup();
    const words = todaysWords();
    renderApp({ route: '/learn' });
    await sessionReady();

    for (const [i, word] of words.entries()) {
      expect(screen.getByRole('heading', { level: 2, name: word.term })).toBeInTheDocument();
      expect(screen.getByText(`${i + 1}/${words.length}`)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /reveal/i }));
      expect(screen.getByText(word.definition)).toBeInTheDocument();
      // Teacher examples are tailored: the teacher example sentence should be shown.
      const teacherExample = word.examples.find((e) => e.role === 'teacher')!;
      expect(screen.getByText((_, el) => el?.textContent === teacherExample.text)).toBeTruthy();
      await user.click(
        screen.getByRole('button', { name: i + 1 < words.length ? /next word/i : /finish/i }),
      );
    }

    expect(screen.getByRole('heading', { name: /done for today/i })).toBeInTheDocument();
    expect(screen.getByText(`${words.length} words explored`)).toBeInTheDocument();
  });

  it('supports keyboard shortcuts and resumes where you left off', async () => {
    const user = userEvent.setup();
    const words = todaysWords();
    const { unmount } = renderApp({ route: '/learn' });
    await sessionReady();

    await user.keyboard(' ');
    expect(screen.getByText(words[0]!.definition)).toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('heading', { level: 2, name: words[1]!.term })).toBeInTheDocument();
    await savedCards(1);
    unmount();

    renderApp({ route: '/learn' });
    expect(
      await screen.findByRole('heading', { level: 2, name: words[1]!.term }),
    ).toBeInTheDocument();
  });

  it('marks progress on the Today screen', async () => {
    const user = userEvent.setup();
    const { unmount } = renderApp({ route: '/learn' });
    await user.click(await sessionReady());
    await savedCards(1);
    unmount();

    renderApp();
    expect(await screen.findByRole('link', { name: /continue \(1\/5\)/i })).toBeInTheDocument();
  });

  it('saves a learnt word as a card due tomorrow', async () => {
    const user = userEvent.setup();
    const [first] = todaysWords();
    renderApp({ route: '/learn' });
    await user.click(await sessionReady());
    await savedCards(1);

    const card = await db.cards.get(first!.id);
    expect(card).toMatchObject({
      introducedOn: toDateKey(),
      due: addDays(toDateKey(), 1),
      repetitions: 1,
      interval: 1,
    });
  });

  it("doesn't bring back words learnt on earlier days", async () => {
    const yesterday = addDays(toDateKey(), -1);
    const learnt = todaysWords();
    await db.cards.bulkAdd(learnt.map((w) => newCard(w.id, yesterday)));

    const fresh = todaysWords(new Set(learnt.map((w) => w.id)));
    renderApp({ route: '/learn' });
    expect(
      await screen.findByRole('heading', { level: 2, name: fresh[0]!.term }),
    ).toBeInTheDocument();
    expect(fresh.some((w) => learnt.some((l) => l.id === w.id))).toBe(false);
  });

  it('can go through a finished set again without losing progress', async () => {
    const today = toDateKey();
    const words = todaysWords();
    await db.cards.bulkAdd(words.map((w) => newCard(w.id, today)));

    renderApp();
    const again = await screen.findByRole('link', { name: /go through them again/i });
    expect(screen.getByText(/done for today/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(again);
    expect(
      await screen.findByRole('heading', { level: 2, name: words[0]!.term }),
    ).toBeInTheDocument();
    expect(await db.cards.count()).toBe(words.length);
  });

  it('reveals when the card is tapped and moves on with a swipe left', async () => {
    const user = userEvent.setup();
    const words = todaysWords();
    renderApp({ route: '/learn' });
    await sessionReady();

    await user.click(screen.getByText(/do you know it/i));
    expect(screen.getByText(words[0]!.definition)).toBeInTheDocument();

    const card = screen
      .getByRole('heading', { level: 2, name: words[0]!.term })
      .closest('.touch-pan-y')!;
    const touch = { pointerType: 'touch', pointerId: 1 };
    fireEvent.pointerDown(card, { ...touch, clientX: 300, clientY: 200 });
    fireEvent.pointerMove(card, { ...touch, clientX: 250, clientY: 202 });
    fireEvent.pointerMove(card, { ...touch, clientX: 150, clientY: 205 });
    fireEvent.pointerUp(card, { ...touch, clientX: 150, clientY: 205 });

    expect(screen.getByRole('heading', { level: 2, name: words[1]!.term })).toBeInTheDocument();
  });

  it('ignores mostly vertical drags (scrolling)', async () => {
    const user = userEvent.setup();
    const words = todaysWords();
    renderApp({ route: '/learn' });
    await user.click(await sessionReady());

    const card = screen
      .getByRole('heading', { level: 2, name: words[0]!.term })
      .closest('.touch-pan-y')!;
    const touch = { pointerType: 'touch', pointerId: 1 };
    fireEvent.pointerDown(card, { ...touch, clientX: 300, clientY: 400 });
    fireEvent.pointerMove(card, { ...touch, clientX: 280, clientY: 300 });
    fireEvent.pointerMove(card, { ...touch, clientX: 200, clientY: 100 });
    fireEvent.pointerUp(card, { ...touch, clientX: 200, clientY: 100 });

    expect(screen.getByText(words[0]!.definition)).toBeInTheDocument();
  });
});
