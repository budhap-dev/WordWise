import { db, LEGACY_TODAY_KEY, newCard, WordWiseDB } from './db';
import { introduceWord, recordReview, resetProgress } from './progress';

const TODAY = '2026-11-03';
const NOW = new Date('2026-11-03T09:30:00.000Z');

describe('introduceWord', () => {
  it('creates a card due tomorrow', async () => {
    await introduceWord('nuance', TODAY, NOW);
    expect(await db.cards.get('nuance')).toEqual({
      wordId: 'nuance',
      ease: 2.5,
      interval: 1,
      repetitions: 1,
      lapses: 0,
      due: '2026-11-04',
      introducedOn: TODAY,
      updatedAt: NOW.toISOString(),
    });
  });

  it('leaves an existing card alone', async () => {
    await introduceWord('nuance', '2026-10-01', NOW);
    await introduceWord('nuance', TODAY, NOW);
    expect((await db.cards.get('nuance'))?.introducedOn).toBe('2026-10-01');
    expect(await db.cards.count()).toBe(1);
  });
});

describe('recordReview', () => {
  it('reschedules the card and logs the review', async () => {
    await db.cards.add(newCard('nuance', '2026-11-02', NOW));
    const updated = await recordReview('nuance', 'good', TODAY, NOW);

    expect(updated).toMatchObject({ interval: 6, repetitions: 2, due: '2026-11-09' });
    expect(updated.lastReviewedOn).toBe(TODAY);
    expect(await db.cards.get('nuance')).toEqual(updated);

    const [log] = await db.reviews.toArray();
    expect(log).toMatchObject({
      wordId: 'nuance',
      grade: 'good',
      date: TODAY,
      intervalBefore: 1,
      intervalAfter: 6,
      easeAfter: 2.5,
    });
    expect(log!.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('brings a forgotten word back tomorrow', async () => {
    await db.cards.add({ ...newCard('nuance', '2026-10-01', NOW), interval: 15, repetitions: 3 });
    const updated = await recordReview('nuance', 'again', TODAY, NOW);
    expect(updated).toMatchObject({ interval: 1, repetitions: 0, lapses: 1, due: '2026-11-04' });
  });

  it('refuses to review a word that was never learnt', async () => {
    await expect(recordReview('nuance', 'good', TODAY, NOW)).rejects.toThrow(/no card/i);
    expect(await db.reviews.count()).toBe(0);
  });
});

describe('resetProgress', () => {
  it('clears cards and reviews', async () => {
    await db.cards.add(newCard('nuance', '2026-11-02', NOW));
    await recordReview('nuance', 'easy', TODAY, NOW);
    await resetProgress();
    expect(await db.cards.count()).toBe(0);
    expect(await db.reviews.count()).toBe(0);
  });
});

describe('migration from Phase 1', () => {
  it("turns the old localStorage 'explored today' list into cards, once", async () => {
    localStorage.setItem(
      LEGACY_TODAY_KEY,
      JSON.stringify({ date: '2026-11-02', seen: ['nuance', 'caveat', 'nuance', 42] }),
    );
    const fresh = new WordWiseDB(`migration-${Math.random()}`);
    try {
      const cards = await fresh.cards.orderBy('wordId').toArray();
      expect(cards.map((c) => [c.wordId, c.introducedOn, c.due])).toEqual([
        ['caveat', '2026-11-02', '2026-11-03'],
        ['nuance', '2026-11-02', '2026-11-03'],
      ]);
      expect(localStorage.getItem(LEGACY_TODAY_KEY)).toBeNull();
    } finally {
      await fresh.delete();
    }
  });

  it('copes with missing or corrupt legacy data', async () => {
    localStorage.setItem(LEGACY_TODAY_KEY, '{not json');
    const fresh = new WordWiseDB(`migration-${Math.random()}`);
    try {
      expect(await fresh.cards.count()).toBe(0);
    } finally {
      await fresh.delete();
    }
  });
});
