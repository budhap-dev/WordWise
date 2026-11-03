/** Writes to the learner's progress. Reads go through live queries in src/hooks/useProgress.ts. */
import { type DateKey, toDateKey } from '../lib/date';
import { newId } from '../lib/id';
import { dueDate, type Grade, review } from '../lib/sm2';
import { type AttemptRecord, type CardRecord, db, newCard } from './db';

let persistRequested = false;

/** Ask the browser not to evict our data under storage pressure (best effort, once a session). */
function requestPersistentStorage() {
  if (persistRequested) return;
  persistRequested = true;
  void navigator.storage?.persist?.().catch(() => undefined);
}

/** Records that a word has been learnt today. A no-op if it was learnt before. */
export async function introduceWord(
  wordId: string,
  today: DateKey = toDateKey(),
  now: Date = new Date(),
): Promise<void> {
  await db.transaction('rw', db.cards, async () => {
    if (await db.cards.get(wordId)) return;
    await db.cards.add(newCard(wordId, today, now));
  });
  requestPersistentStorage();
}

/** Applies an SM-2 grade to a word, logs the review and returns the updated card. */
export async function recordReview(
  wordId: string,
  grade: Grade,
  today: DateKey = toDateKey(),
  now: Date = new Date(),
): Promise<CardRecord> {
  return db.transaction('rw', db.cards, db.reviews, async () => {
    const card = await db.cards.get(wordId);
    if (!card) throw new Error(`No card for "${wordId}"`);
    const next = review(card, grade);
    const updated: CardRecord = {
      ...card,
      ...next,
      due: dueDate(next, today),
      lastReviewedOn: today,
      updatedAt: now.toISOString(),
    };
    await db.cards.put(updated);
    await db.reviews.add({
      id: newId(),
      wordId,
      grade,
      date: today,
      reviewedAt: now.toISOString(),
      intervalBefore: card.interval,
      intervalAfter: next.interval,
      easeAfter: next.ease,
    });
    return updated;
  });
}

/** Logs one answered practice question. */
export async function recordAttempt(
  attempt: Omit<AttemptRecord, 'id' | 'date' | 'answeredAt'>,
  today: DateKey = toDateKey(),
  now: Date = new Date(),
): Promise<void> {
  await db.attempts.add({ ...attempt, id: newId(), date: today, answeredAt: now.toISOString() });
}

/** Deletes all learning progress (cards, review history and practice). Settings are kept. */
export async function resetProgress(): Promise<void> {
  await db.transaction('rw', db.cards, db.reviews, db.attempts, async () => {
    await db.cards.clear();
    await db.reviews.clear();
    await db.attempts.clear();
  });
}
