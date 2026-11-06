import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WORDS } from '../../data';
import { db, newCard } from '../../db/db';
import { addDays, toDateKey } from '../../lib/date';
import { CELEBRATIONS_KEY } from '../../state/celebrations';
import { renderApp } from '../../test/render';

const today = toDateKey();

async function learn(...wordIds: string[]) {
  await db.cards.bulkAdd(wordIds.map((id) => newCard(id, today)));
}

describe('Progress screen', () => {
  it('is in the main navigation and starts a newcomer at level 1', async () => {
    renderApp({ route: '/progress' });
    expect(await screen.findByRole('heading', { name: 'Your progress' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /^progress$/i }).length).toBeGreaterThan(0);
    expect(screen.getByText('Level 1', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Fresh Face/ })).toBeInTheDocument();
    expect(screen.getByText('0 of 22 earned')).toBeInTheDocument();
  });

  it('shows XP, the level bar and stats from what the learner has done', async () => {
    await learn('chuffed', 'succinct');
    await db.gameScores.add({
      id: 'g1',
      game: 'rush',
      score: 130,
      correct: 13,
      answered: 14,
      bestCombo: 5,
      date: today,
      playedAt: new Date().toISOString(),
    });
    renderApp({ route: '/progress' });

    // 2 words × 10 + 130 / 10 = 33 XP
    expect(await screen.findByText('33 XP')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Progress to level 2' })).toHaveAttribute(
      'aria-valuenow',
      '33',
    );
    expect(screen.getByText('67 XP to level 2')).toBeInTheDocument();
    const tiles = screen.getByText('Word Rush best').closest('div')!;
    expect(within(tiles).getByText('130')).toBeInTheDocument();
    expect(screen.getByText('+33')).toBeInTheDocument();
  });

  it('opens a badge to show how to earn it, and how far along you are', async () => {
    const user = userEvent.setup();
    await learn('chuffed', 'faff', 'succinct');
    renderApp({ route: '/progress' });

    await user.click(
      await screen.findByRole('button', { name: /^Proper British: not yet, 2 of 10/ }),
    );
    const sheet = screen.getByRole('dialog', { name: 'Proper British' });
    expect(within(sheet).getByText('Learn 10 Britishisms.')).toBeInTheDocument();
    expect(within(sheet).getByText('2 of 10 · 8 to go')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^First Steps: earned/ }));
    expect(screen.getByRole('dialog', { name: 'First Steps' })).toHaveTextContent(/little acorns/);
  });

  it('marks newly earned badges as new, once', async () => {
    await learn('chuffed');
    const { unmount } = renderApp({ route: '/progress' });
    expect(
      await screen.findByRole('button', { name: /^First Steps: earned, new$/ }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(CELEBRATIONS_KEY)!)).toEqual({
        badges: ['first-word'],
        level: 1,
      }),
    );
    unmount();

    renderApp({ route: '/progress' });
    expect(
      await screen.findByRole('button', { name: /^First Steps: earned$/ }),
    ).toBeInTheDocument();
  });

  it('shows what you did on a day in the activity calendar', async () => {
    const user = userEvent.setup();
    await learn('chuffed', 'succinct');
    await db.reviews.add({
      id: 'r1',
      wordId: 'chuffed',
      grade: 'good',
      date: addDays(today, -1),
      reviewedAt: new Date().toISOString(),
      intervalBefore: 1,
      intervalAfter: 6,
      easeAfter: 2.5,
    });
    renderApp({ route: '/progress' });

    const calendar = await screen.findByRole('group', { name: /Activity over the last 12 weeks/ });
    expect(screen.getByText('2 words learnt')).toBeInTheDocument();
    expect(screen.getByText(/Active on 2 of the last \d+ days/)).toBeInTheDocument();

    // Arrow up goes to the previous day (columns are weeks).
    const todayCell = within(calendar).getByRole('button', { pressed: true });
    expect(todayCell).toHaveAttribute('aria-current', 'date');
    todayCell.focus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByText('1 review')).toBeInTheDocument();
    expect(within(calendar).getByRole('button', { pressed: true })).toHaveFocus();
  });

  it('links each topic to its words in Browse', async () => {
    await learn('chuffed');
    renderApp({ route: '/progress' });
    const link = await screen.findByRole('link', { name: /Britishisms 1 \/ \d+/ });
    expect(link).toHaveAttribute('href', '/browse?cat=british&status=learnt');
  });
});

describe('Celebrations', () => {
  it('announce a new badge on Today, with a link to Progress, and only once', async () => {
    const user = userEvent.setup();
    await learn('chuffed');
    renderApp({ route: '/' });

    const toast = await screen.findByText('Badge unlocked: First Steps');
    expect(toast.closest('a')).toHaveAttribute('href', '/progress');
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Badge unlocked: First Steps')).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(CELEBRATIONS_KEY)!).badges).toEqual(['first-word']);
  });

  it('announce a level-up', async () => {
    // 10 words × 10 XP = 100 XP = level 2
    await learn(...WORDS.slice(0, 10).map((w) => w.id));
    localStorage.setItem(CELEBRATIONS_KEY, JSON.stringify({ badges: ['first-word'], level: 1 }));

    renderApp({ route: '/' });
    expect(await screen.findByText('Level up! You’re now level 2: Fresh Face')).toBeInTheDocument();
  });

  it('show the level on Today, linking to Progress', async () => {
    renderApp({ route: '/' });
    const chip = await screen.findByRole('link', { name: /Level 1/ });
    expect(chip).toHaveAttribute('href', '/progress');
  });
});
