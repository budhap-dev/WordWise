/**
 * WordWise's local database (IndexedDB via Dexie). Everything stays on the device.
 *
 * Records are sync-friendly for a possible future backend: stable keys (word ids, UUIDs) and an
 * `updatedAt` timestamp on mutable rows.
 */
import Dexie, { type EntityTable, type Transaction } from 'dexie';

import type { DateKey } from '../lib/date';
import type { PracticeMode, SessionMode } from '../lib/practice/types';
import { dueDate, type Grade, introduce, type Sm2State } from '../lib/sm2';

/** One row per word the learner has met: its SM-2 state and when it's next due. */
export interface CardRecord extends Sm2State {
  /** The WordEntry id. One card per word. */
  wordId: string;
  /** Next review date (local calendar day). */
  due: DateKey;
  /** The day the word was first learnt. */
  introducedOn: DateKey;
  lastReviewedOn?: DateKey;
  /** ISO timestamp of the last change. */
  updatedAt: string;
}

/** An append-only log of graded reviews, for stats and streaks. */
export interface ReviewRecord {
  id: string;
  wordId: string;
  grade: Grade;
  date: DateKey;
  /** ISO timestamp. */
  reviewedAt: string;
  intervalBefore: number;
  intervalAfter: number;
  easeAfter: number;
}

/** One answered practice question. Practice doesn't change the review schedule. */
export interface AttemptRecord {
  id: string;
  /** Groups the attempts of one session, for "last score". */
  sessionId: string;
  /** What the learner chose on the Practice screen (a mode, or the mixed bag). */
  sessionMode: SessionMode;
  /** The mode of this question. */
  mode: PracticeMode;
  itemId: string;
  wordId?: string;
  correct: boolean;
  date: DateKey;
  /** ISO timestamp. */
  answeredAt: string;
}

/** Phase 1 kept today's explored words in localStorage under this key. */
export const LEGACY_TODAY_KEY = 'wordwise:today';

export class WordWiseDB extends Dexie {
  cards!: EntityTable<CardRecord, 'wordId'>;
  reviews!: EntityTable<ReviewRecord, 'id'>;
  attempts!: EntityTable<AttemptRecord, 'id'>;

  constructor(name = 'wordwise') {
    super(name);
    this.version(1).stores({
      cards: 'wordId, due, introducedOn',
      reviews: 'id, wordId, date',
    });
    // v2 (Phase 3): practice attempts.
    this.version(2).stores({
      attempts: 'id, date, sessionId, sessionMode',
    });
    this.on('populate', (tx) => migrateLegacyToday(tx));
  }
}

/** A new card for a word learnt on `today`: due tomorrow (see `introduce` in lib/sm2). */
export function newCard(wordId: string, today: DateKey, now: Date = new Date()): CardRecord {
  const state = introduce();
  return {
    wordId,
    ...state,
    due: dueDate(state, today),
    introducedOn: today,
    updatedAt: now.toISOString(),
  };
}

/** Carries Phase 1's "explored today" list over into cards, the first time the database is created. */
interface LegacyToday {
  date?: unknown;
  seen?: unknown;
}

function migrateLegacyToday(tx: Transaction) {
  let legacy: LegacyToday | null;
  try {
    const raw = localStorage.getItem(LEGACY_TODAY_KEY);
    legacy = raw ? (JSON.parse(raw) as LegacyToday) : null;
    localStorage.removeItem(LEGACY_TODAY_KEY);
  } catch {
    return;
  }
  if (!legacy || typeof legacy.date !== 'string' || !Array.isArray(legacy.seen)) return;
  const { date } = legacy;
  const now = new Date();
  const seen: unknown[] = legacy.seen;
  const ids = [...new Set(seen.filter((id): id is string => typeof id === 'string'))];
  if (ids.length > 0) {
    void tx.table<CardRecord>('cards').bulkAdd(ids.map((id) => newCard(id, date, now)));
  }
}

export const db = new WordWiseDB();
