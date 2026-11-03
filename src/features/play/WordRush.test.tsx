import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WORDS } from '../../data';
import { db } from '../../db/db';
import { blankedExample, displayTerm } from '../../lib/practice/generators';
import { renderApp, TEST_SETTINGS } from '../../test/render';

/** Let the input lock (which stops double taps answering twice) expire. */
const pause = () => new Promise((r) => setTimeout(r, 300));

/** Works out which answer button is right, from the prompt on screen. */
function buttons() {
  const answers = within(screen.getByRole('list', { name: 'Answers' })).getAllByRole('button');
  const label = screen.getByRole('heading', { level: 2 }).textContent ?? '';
  const prompt = screen.getByRole('heading', { level: 2 }).nextElementSibling?.textContent ?? '';
  const isRight = (text: string) =>
    WORDS.some((w) => {
      if (displayTerm(w.term) !== text) return false;
      if (label.startsWith('Which word')) return w.definition === prompt;
      return blankedExample(w, TEST_SETTINGS.roles)?.sentence.replace('___', 'blank') === prompt;
    });
  const right = answers.find((b) => isRight(b.textContent ?? ''));
  if (!right) throw new Error(`No right answer found for "${label}" / "${prompt}"`);
  const wrong = answers.find((b) => b !== right)!;
  return { right, wrong };
}

describe('Word Rush', () => {
  it('is featured on the Practice screen', async () => {
    renderApp({ route: '/practice' });
    expect(await screen.findByRole('link', { name: /word rush/i })).toHaveAttribute(
      'href',
      '/play/rush',
    );
  });

  it('explains the rules, then plays: points for right answers, lives for wrong ones', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/play/rush' });

    expect(await screen.findByRole('heading', { name: 'Word Rush' })).toBeInTheDocument();
    expect(screen.getByText(/three lives/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /play/i }));

    expect(screen.getByRole('timer')).toHaveAccessibleName(/60 seconds left/);
    expect(screen.getByLabelText('3 of 3 lives left')).toBeInTheDocument();

    await user.click(buttons().right);
    expect(screen.getByText('+10')).toBeInTheDocument();
    await pause();

    await user.click(buttons().wrong);
    expect(screen.getByLabelText('2 of 3 lives left')).toBeInTheDocument();
    expect(screen.getByText(/✗ it was/i)).toBeInTheDocument();
    await pause();
    await user.click(buttons().wrong);
    await pause();
    await user.click(buttons().wrong);

    expect(await screen.findByText(/your first score/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('10');
    expect(screen.getByText('Words to remember')).toBeInTheDocument();

    await waitFor(async () => expect(await db.gameScores.count()).toBe(1));
    expect((await db.gameScores.toArray())[0]).toMatchObject({
      game: 'rush',
      score: 10,
      correct: 1,
      answered: 4,
    });

    await user.click(screen.getByRole('button', { name: /play again/i }));
    expect(await screen.findByText(/your best:/i)).toHaveTextContent('Your best: 10');
  });

  it('ignores a double tap, so one tap answers one question', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/play/rush' });
    await user.click(await screen.findByRole('button', { name: /play/i }));

    const { wrong } = buttons();
    await user.click(wrong);
    await user.click(screen.getAllByRole('button').find((b) => b.closest('ul'))!);
    expect(screen.getByLabelText('2 of 3 lives left')).toBeInTheDocument();
  });

  it('counts towards the streak', async () => {
    await db.gameScores.add({
      id: 'g1',
      game: 'rush',
      score: 40,
      correct: 4,
      answered: 5,
      bestCombo: 3,
      date: new Date().toLocaleDateString('en-CA'),
      playedAt: new Date().toISOString(),
    });
    renderApp();
    expect(await screen.findByText(/1-day streak/i)).toBeInTheDocument();
  });
});
