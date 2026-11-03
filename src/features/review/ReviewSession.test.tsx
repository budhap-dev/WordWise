import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getWord } from '../../data';
import { type CardRecord, db, newCard } from '../../db/db';
import { addDays, toDateKey } from '../../lib/date';
import { renderApp } from '../../test/render';
import { REVIEW_SESSION_MAX } from './session';

const today = toDateKey();
const yesterday = addDays(today, -1);

/** Cards learnt yesterday, so due today. */
async function seedDue(ids: string[], overrides: Partial<CardRecord> = {}) {
  await db.cards.bulkAdd(ids.map((id) => ({ ...newCard(id, yesterday), ...overrides })));
}

const reveal = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(await screen.findByRole('button', { name: /reveal/i }));

describe('review session', () => {
  it('shows a due word, reveals it and offers grades with their next intervals', async () => {
    await seedDue(['nuance']);
    const user = userEvent.setup();
    renderApp({ route: '/review' });

    expect(await screen.findByRole('heading', { level: 2, name: 'nuance' })).toBeInTheDocument();
    expect(screen.getByText(/what does it mean/i)).toBeInTheDocument();
    await reveal(user);
    expect(screen.getByText(getWord('nuance')!.definition)).toBeInTheDocument();

    const bar = screen.getByRole('region', { name: /grade your answer/i });
    expect(within(bar).getByRole('button', { name: 'Again, next review in 1 day' })).toBeVisible();
    expect(within(bar).getByRole('button', { name: 'Hard, next review in 6 days' })).toBeVisible();
    expect(within(bar).getByRole('button', { name: 'Good, next review in 6 days' })).toBeVisible();
    expect(within(bar).getByRole('button', { name: 'Easy, next review in 6 days' })).toBeVisible();
  });

  it('saves the grade, schedules the next review and logs it', async () => {
    await seedDue(['nuance']);
    const user = userEvent.setup();
    renderApp({ route: '/review' });

    await reveal(user);
    await user.click(screen.getByRole('button', { name: /^good/i }));

    expect(await screen.findByRole('heading', { name: /reviews done/i })).toBeInTheDocument();
    expect(screen.getByText('1 word reviewed')).toBeInTheDocument();
    const card = await db.cards.get('nuance');
    expect(card).toMatchObject({ repetitions: 2, interval: 6, due: addDays(today, 6) });
    expect(await db.reviews.count()).toBe(1);
  });

  it('repeats a forgotten word at the end of the session without rescheduling it twice', async () => {
    await seedDue(['caveat', 'nuance']);
    const user = userEvent.setup();
    renderApp({ route: '/review' });

    // Due cards are ordered by date, then id: caveat first.
    expect(await screen.findByRole('heading', { level: 2, name: 'caveat' })).toBeInTheDocument();
    await reveal(user);
    await user.click(screen.getByRole('button', { name: /^again/i }));

    expect(await screen.findByRole('heading', { level: 2, name: 'nuance' })).toBeInTheDocument();
    await reveal(user);
    await user.click(screen.getByRole('button', { name: /^easy/i }));

    expect(await screen.findByRole('heading', { level: 2, name: 'caveat' })).toBeInTheDocument();
    expect(screen.getByText(/once more/i)).toBeInTheDocument();
    await reveal(user);
    await user.click(screen.getByRole('button', { name: 'Not yet' }));
    await reveal(user);
    await user.click(screen.getByRole('button', { name: 'Got it' }));

    expect(await screen.findByRole('heading', { name: /reviews done/i })).toBeInTheDocument();
    expect(screen.getByText('2 words reviewed')).toBeInTheDocument();
    expect(await db.reviews.count()).toBe(2);
    expect(await db.cards.get('caveat')).toMatchObject({
      repetitions: 0,
      due: addDays(today, 1),
    });
  });

  it('works from the keyboard', async () => {
    await seedDue(['nuance']);
    const user = userEvent.setup();
    renderApp({ route: '/review' });
    await screen.findByRole('heading', { level: 2, name: 'nuance' });

    await user.keyboard(' ');
    expect(screen.getByText(getWord('nuance')!.definition)).toBeInTheDocument();
    await user.keyboard('4');
    expect(await screen.findByRole('heading', { name: /reviews done/i })).toBeInTheDocument();
    expect((await db.cards.get('nuance'))?.ease).toBe(2.6);
  });

  it('keeps sessions short and offers more afterwards', async () => {
    const ids = ['nuance', 'caveat', 'candid', 'gauge', 'wary', 'prudent', 'tangible', 'foster'];
    const extra = ['hinder', 'concede', 'diligent', 'succinct', 'pragmatic', 'reticent'];
    const more = ['meticulous', 'ambivalent', 'tentative', 'conducive', 'discerning', 'mitigate'];
    const all = [...ids, ...extra, ...more, 'exacerbate', 'alleviate', 'plausible'];
    expect(all.length).toBeGreaterThan(REVIEW_SESSION_MAX);
    await seedDue(all);
    const user = userEvent.setup();
    renderApp({ route: '/review' });

    for (let i = 0; i < REVIEW_SESSION_MAX; i++) {
      await reveal(user);
      await user.click(screen.getByRole('button', { name: /^good/i }));
    }
    expect(await screen.findByRole('heading', { name: /reviews done/i })).toBeInTheDocument();
    const moreButton = await screen.findByRole('button', {
      name: `Review ${all.length - REVIEW_SESSION_MAX} more`,
    });
    await user.click(moreButton);
    expect(await screen.findByText(`${all.length - REVIEW_SESSION_MAX} left`)).toBeInTheDocument();
  });

  it('says when nothing is due', async () => {
    await db.cards.add(newCard('nuance', today));
    renderApp({ route: '/review' });
    expect(
      await screen.findByRole('heading', { name: /nothing to review right now/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 word is due tomorrow/i)).toBeInTheDocument();
  });
});

describe('Today screen with reviews', () => {
  it('puts due reviews first, with a streak', async () => {
    await seedDue(['nuance', 'caveat']);
    renderApp();

    expect(await screen.findByRole('heading', { name: '2 words to review' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /review 2 words/i })).toHaveAttribute(
      'href',
      '/review',
    );
    // Learnt yesterday, nothing yet today: the streak is alive but needs today's session.
    expect(await screen.findByText(/1-day streak/i)).toBeInTheDocument();
    expect(screen.getByText(/keep it going/i)).toBeInTheDocument();
  });

  it('shows when the next reviews are due once today is clear', async () => {
    await db.cards.add(newCard('nuance', today));
    renderApp();
    expect(await screen.findByText(/no reviews due today · 1 word tomorrow/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /to review/i })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/1-day streak/i)).toBeInTheDocument());
    expect(screen.queryByText(/keep it going/i)).not.toBeInTheDocument();
  });
});
