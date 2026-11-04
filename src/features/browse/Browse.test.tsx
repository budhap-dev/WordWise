import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WORDS } from '../../data';
import { db, newCard } from '../../db/db';
import { addDays, toDateKey } from '../../lib/date';
import { renderApp } from '../../test/render';

const wordList = () => screen.getByRole('list', { name: 'Words' });
const wordLinks = () => within(wordList()).getAllByRole('link');

describe('Browse screen', () => {
  it('is in the main navigation and lists every word, A to Z', async () => {
    renderApp({ route: '/browse' });
    expect(await screen.findByRole('heading', { name: 'Browse' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /^browse$/i }).length).toBeGreaterThan(0);
    expect(screen.getByText(`${WORDS.length} words, A to Z`)).toBeInTheDocument();
    expect(wordLinks()).toHaveLength(WORDS.length);
  });

  it('searches as you type, best match first, and says why a match is there', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/browse' });
    await user.type(await screen.findByRole('searchbox', { name: 'Search words' }), 'terse');

    await waitFor(() => expect(wordLinks()[0]).toHaveAccessibleName(/^succinct/));
    expect(within(wordLinks()[0]!).getByText('Similar:')).toBeInTheDocument();
    expect(screen.getByText(/^\d+ match(es)?, best first$/)).toBeInTheDocument();
  });

  it('keeps the search in the URL, so it survives coming back', async () => {
    renderApp({ route: '/browse?q=chuffed' });
    expect(await screen.findByRole('searchbox')).toHaveValue('chuffed');
    expect(wordLinks()[0]).toHaveAccessibleName(/^chuffed/);
  });

  it('shows a friendly empty state', async () => {
    renderApp({ route: '/browse?q=xyzzy' });
    expect(await screen.findByText(/Nothing for “xyzzy”/)).toBeInTheDocument();
  });

  it('filters by category with the chips', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/browse' });
    const categories = await screen.findByRole('group', { name: 'Category' });
    await user.click(within(categories).getByRole('button', { name: 'Britishisms' }));

    const count = WORDS.filter((w) => w.category === 'british').length;
    expect(await screen.findByText(`${count} words, A to Z`)).toBeInTheDocument();
    expect(within(categories).getByRole('button', { name: 'Britishisms' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('filters by progress in the Filters sheet', async () => {
    const user = userEvent.setup();
    const today = toDateKey();
    await db.cards.bulkAdd([
      { ...newCard('chuffed', addDays(today, -3)), due: today },
      newCard('succinct', today),
    ]);
    renderApp({ route: '/browse' });

    await user.click(await screen.findByRole('button', { name: /^filters/i }));
    const sheet = screen.getByRole('dialog', { name: 'Filters' });
    await user.click(await within(sheet).findByRole('button', { name: /^learnt · 2/i }));
    await user.click(within(sheet).getByRole('button', { name: 'Show 2 words' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /filters \(1 on\)/i })).toHaveFocus();
    expect(wordLinks().map((l) => l.textContent)).toEqual([
      expect.stringMatching(/^chuffed.*Due/),
      expect.stringMatching(/^succinct.*Learnt/),
    ]);
  });

  it('closes the Filters sheet with Escape', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/browse' });
    await user.click(await screen.findByRole('button', { name: /^filters/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('focuses search with "/"', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/browse' });
    await screen.findByRole('searchbox');
    await user.keyboard('/');
    expect(screen.getByRole('searchbox')).toHaveFocus();
  });
});

describe('Word page', () => {
  it('opens from Browse, and Back returns to the same search', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/browse?q=chuffed' });
    await user.click((await screen.findAllByRole('link', { name: /^chuffed/ }))[0]!);

    expect(await screen.findByRole('heading', { level: 1, name: 'chuffed' })).toBeInTheDocument();
    expect(screen.getByText(/Not learnt yet/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByRole('searchbox')).toHaveValue('chuffed');
  });

  it('adds a word to your reviews', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/words/chuffed' });
    await user.click(await screen.findByRole('button', { name: 'Add to my reviews' }));

    expect(await screen.findByText('Learnt today')).toBeInTheDocument();
    expect(screen.getByText(/next review tomorrow/)).toBeInTheDocument();
    const card = await db.cards.get('chuffed');
    expect(card?.introducedOn).toBe(toDateKey());
  });

  it('offers a review when the word is due', async () => {
    const today = toDateKey();
    await db.cards.add({ ...newCard('chuffed', addDays(today, -6)), due: today });
    renderApp({ route: '/words/chuffed' });
    expect(await screen.findByText(/due for review today/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Review now' })).toHaveAttribute('href', '/review');
  });

  it('links to related words in WordWise', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/words/chuffed' });
    await user.click(await screen.findByRole('link', { name: 'gutted' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'gutted' })).toBeInTheDocument();
  });

  it('keeps the Browse tab highlighted', async () => {
    renderApp({ route: '/words/chuffed' });
    await screen.findByRole('heading', { level: 1, name: 'chuffed' });
    for (const link of screen.getAllByRole('link', { name: /^browse$/i })) {
      expect(link.className).toContain('bg-brand-soft');
    }
  });

  it('copes with an unknown word', async () => {
    renderApp({ route: '/words/not-a-word' });
    expect(
      await screen.findByRole('heading', { name: 'Can’t find that word' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse all words' })).toHaveAttribute(
      'href',
      '/browse',
    );
  });
});
