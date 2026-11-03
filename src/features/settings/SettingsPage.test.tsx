import { screen, waitFor, within } from '@testing-library/react';
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

describe('colour themes', () => {
  it('applies a colour theme straight away and remembers it', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/settings' });

    await user.click(await screen.findByRole('radio', { name: /oxford/i }));
    expect(document.documentElement.dataset.palette).toBe('oxford');
    expect(JSON.parse(localStorage.getItem('wordwise:settings') ?? '{}').palette).toBe('oxford');

    // Each theme works in dark mode too.
    await user.click(screen.getByRole('radio', { name: /^dark$/i }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.dataset.palette).toBe('oxford');

    // The default theme needs no attribute.
    await user.click(screen.getByRole('radio', { name: /wordwise/i }));
    expect(document.documentElement.dataset.palette).toBeUndefined();
  });

  it('offers five themes', async () => {
    renderApp({ route: '/settings' });
    const group = await screen.findByRole('group', { name: /colour theme/i });
    expect(within(group).getAllByRole('radio')).toHaveLength(5);
  });
});
