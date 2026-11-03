import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WORDS } from '../../data';
import { selectDailyWords } from '../../lib/daily';
import { toDateKey } from '../../lib/date';
import { renderApp, TEST_SETTINGS } from '../../test/render';

const todaysWords = () =>
  selectDailyWords({
    words: WORDS,
    roles: TEST_SETTINGS.roles,
    level: TEST_SETTINGS.level,
    size: TEST_SETTINGS.dailyGoal,
    date: toDateKey(),
  });

describe('daily learning session', () => {
  it('shows the word of the day on the Today screen', () => {
    renderApp();
    const [first] = todaysWords();
    expect(screen.getByRole('heading', { level: 2, name: first!.term })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /start today's set/i })).toBeInTheDocument();
  });

  it('reveals each word and finishes with a celebration', async () => {
    const user = userEvent.setup();
    const words = todaysWords();
    renderApp({ route: '/learn' });

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

    await user.keyboard(' ');
    expect(screen.getByText(words[0]!.definition)).toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('heading', { level: 2, name: words[1]!.term })).toBeInTheDocument();
    unmount();

    renderApp({ route: '/learn' });
    expect(screen.getByRole('heading', { level: 2, name: words[1]!.term })).toBeInTheDocument();
  });

  it('marks progress on the Today screen', async () => {
    const user = userEvent.setup();
    const { unmount } = renderApp({ route: '/learn' });
    await user.click(screen.getByRole('button', { name: /reveal/i }));
    unmount();

    renderApp();
    expect(screen.getByRole('link', { name: /continue \(1\/5\)/i })).toBeInTheDocument();
  });

  it('reveals when the card is tapped and moves on with a swipe left', async () => {
    const user = userEvent.setup();
    const words = todaysWords();
    renderApp({ route: '/learn' });

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
    await user.click(screen.getByRole('button', { name: /reveal/i }));

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
