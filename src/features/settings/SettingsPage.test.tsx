import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { db, newCard } from '../../db/db';
import { renderApp } from '../../test/render';

describe('Settings', () => {
  it('resets progress after confirmation, keeping preferences', async () => {
    await db.cards.bulkAdd([newCard('nuance', '2026-11-01'), newCard('caveat', '2026-11-01')]);
    const user = userEvent.setup();
    renderApp({ route: '/settings' });

    expect(await screen.findByText(/forgets the 2 words you've learnt/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reset progress' }));
    await user.click(screen.getByRole('button', { name: /yes, forget my progress/i }));

    await waitFor(async () => expect(await db.cards.count()).toBe(0));
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
  });

  it('can cancel a reset', async () => {
    await db.cards.add(newCard('nuance', '2026-11-01'));
    const user = userEvent.setup();
    renderApp({ route: '/settings' });

    await user.click(await screen.findByRole('button', { name: 'Reset progress' }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(await db.cards.count()).toBe(1);
  });
});
