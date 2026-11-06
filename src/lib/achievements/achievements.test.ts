import { WORDS } from '../../data';
import type { AttemptRecord, CardRecord, GameScoreRecord, ReviewRecord } from '../../db/db';
import { newCard } from '../../db/db';
import { AMERICAN_SPELLINGS } from '../../test/britishSpelling';
import { addDays } from '../date';
import type { Grade } from '../sm2';
import { achievements } from '.';
import { BADGES, badgeStatuses } from './badges';
import { type ActivityLog, describeDay, longestRun, masteryStage, progressStats } from './stats';
import { LEVEL_TITLES, levelFor, levelTitle, totalXp, xpAtLevel, XP } from './xp';

const TODAY = '2026-11-04';
const EMPTY: ActivityLog = { cards: [], reviews: [], attempts: [], games: [] };

function card(wordId: string, introducedOn: string, interval = 1): CardRecord {
  return { ...newCard(wordId, introducedOn), interval };
}

let n = 0;
function reviewRec(
  wordId: string,
  date: string,
  grade: Grade = 'good',
  intervalAfter = 6,
  hour = 12,
): ReviewRecord {
  return {
    id: `r${n++}`,
    wordId,
    grade,
    date,
    reviewedAt: new Date(`${date}T${String(hour).padStart(2, '0')}:30:00`).toISOString(),
    intervalBefore: 1,
    intervalAfter,
    easeAfter: 2.5,
  };
}

function attempt(sessionId: string, correct: boolean, date = TODAY): AttemptRecord {
  return {
    id: `a${n++}`,
    sessionId,
    sessionMode: 'mixed',
    mode: 'meaning',
    itemId: 'x',
    correct,
    date,
    answeredAt: new Date(`${date}T12:00:00`).toISOString(),
  };
}

function game(score: number, bestCombo = 0, date = TODAY): GameScoreRecord {
  return {
    id: `g${n++}`,
    game: 'rush',
    score,
    correct: 0,
    answered: 0,
    bestCombo,
    date,
    playedAt: new Date(`${date}T12:00:00`).toISOString(),
  };
}

const ids = (category: string, count: number) =>
  WORDS.filter((w) => w.category === category)
    .slice(0, count)
    .map((w) => w.id);

describe('levels', () => {
  it('start at level 1 with no XP, and each level takes 50 XP more than the last', () => {
    expect(levelFor(0)).toMatchObject({ level: 1, intoLevel: 0, levelSize: 100, toNext: 100 });
    expect(xpAtLevel(2)).toBe(100);
    expect(xpAtLevel(3)).toBe(250);
    expect(xpAtLevel(4)).toBe(450);
    expect(levelFor(99).level).toBe(1);
    expect(levelFor(100)).toMatchObject({ level: 2, intoLevel: 0, levelSize: 150 });
    expect(levelFor(300)).toMatchObject({ level: 3, intoLevel: 50, toNext: 150 });
  });

  it('have a title for every level, changing at the right points', () => {
    expect(levelTitle(1).title).toBe('Fresh Face');
    expect(levelTitle(2).title).toBe('Fresh Face');
    expect(levelTitle(3).title).toBe('Keen Bean');
    expect(levelTitle(99).title).toBe('Lexicon Legend');
    const froms = LEVEL_TITLES.map((t) => t.from);
    expect(froms).toEqual([...froms].sort((a, b) => a - b));
    expect(froms[0]).toBe(1);
  });
});

describe('totalXp', () => {
  it('adds up learning, reviews, practice and games', () => {
    const log: ActivityLog = {
      cards: [card('chuffed', TODAY), card('succinct', TODAY)],
      reviews: [reviewRec('chuffed', TODAY, 'good'), reviewRec('chuffed', TODAY, 'again')],
      attempts: [attempt('s', true), attempt('s', false)],
      games: [game(257)],
    };
    expect(totalXp(log)).toBe(
      2 * XP.learn + XP.review + XP.reviewAgain + XP.practiceCorrect + XP.practiceWrong + 25, // 257 points
    );
    expect(totalXp(EMPTY)).toBe(0);
  });

  it('counts only today in xpToday', () => {
    const log: ActivityLog = {
      ...EMPTY,
      cards: [card('chuffed', TODAY), card('succinct', addDays(TODAY, -1))],
    };
    expect(achievements(log, TODAY).xpToday).toBe(XP.learn);
  });
});

describe('progressStats', () => {
  it('sorts words by how well they are known, and by topic', () => {
    const log: ActivityLog = {
      ...EMPTY,
      cards: [card('chuffed', TODAY, 1), card('succinct', TODAY, 10), card('faff', TODAY, 30)],
    };
    const s = progressStats(log, TODAY);
    expect(s.wordsLearnt).toBe(3);
    expect(s.mastery).toEqual({ learning: 1, familiar: 1, mastered: 1 });
    expect(s.byCategory.british).toBe(2);
    expect(masteryStage(6)).toBe('learning');
    expect(masteryStage(7)).toBe('familiar');
    expect(masteryStage(21)).toBe('mastered');
  });

  it('ignores cards for words no longer in the dataset, but still counts the day', () => {
    const s = progressStats({ ...EMPTY, cards: [card('no-such-word', TODAY)] }, TODAY);
    expect(s.wordsLearnt).toBe(0);
    expect(s.days.get(TODAY)?.learnt).toBe(1);
  });

  it('remembers mastered words even after they slip back', () => {
    const log: ActivityLog = {
      ...EMPTY,
      cards: [card('chuffed', '2026-09-01', 1)],
      reviews: [
        reviewRec('chuffed', '2026-10-01', 'good', 24),
        reviewRec('chuffed', TODAY, 'again', 1),
      ],
    };
    const s = progressStats(log, TODAY);
    expect(s.mastery.mastered).toBe(0);
    expect(s.everMastered).toBe(1);
  });

  it('works out current and longest streaks, and the longest break', () => {
    const dates = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-11-03', TODAY];
    const log: ActivityLog = { ...EMPTY, games: dates.map((d) => game(10, 0, d)) };
    const s = progressStats(log, TODAY);
    expect(s.streak).toEqual({ days: 2, activeToday: true });
    expect(s.longestStreak).toBe(4);
    expect(s.longestBreak).toBe(29);
    expect(longestRun([])).toBe(0);
  });

  it('counts perfect practice sessions of at least five questions', () => {
    const log: ActivityLog = {
      ...EMPTY,
      attempts: [
        ...Array.from({ length: 5 }, () => attempt('perfect', true)),
        ...Array.from({ length: 4 }, () => attempt('too-short', true)),
        ...Array.from({ length: 5 }, (_, i) => attempt('one-wrong', i > 0)),
      ],
    };
    const s = progressStats(log, TODAY);
    expect(s.perfectSessions).toBe(1);
    expect(s.practiceCorrect).toBe(13);
    expect(s.practiceAnswered).toBe(14);
  });

  it('spots early birds and night owls by local time', () => {
    const at = (hour: number) =>
      progressStats({ ...EMPTY, reviews: [reviewRec('chuffed', TODAY, 'good', 6, hour)] }, TODAY);
    expect(at(5)).toMatchObject({ earlyBird: true, nightOwl: false });
    expect(at(23)).toMatchObject({ earlyBird: false, nightOwl: true });
    expect(at(2)).toMatchObject({ earlyBird: false, nightOwl: true });
    expect(at(12)).toMatchObject({ earlyBird: false, nightOwl: false });
  });
});

describe('badges', () => {
  it('have unique ids and British spelling throughout', () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
    for (const b of BADGES) {
      for (const text of [b.name, b.how, b.quip]) expect(text).not.toMatch(AMERICAN_SPELLINGS);
    }
    for (const t of LEVEL_TITLES) expect(`${t.title} ${t.note}`).not.toMatch(AMERICAN_SPELLINGS);
  });

  it('are all locked to begin with', () => {
    const statuses = badgeStatuses(progressStats(EMPTY, TODAY));
    expect(statuses.filter((s) => s.earned)).toEqual([]);
  });

  it('are earned at their targets, with progress capped', () => {
    const log: ActivityLog = {
      cards: [...ids('british', 10), ...ids('idiom', 3)].map((id) => card(id, TODAY)),
      reviews: [],
      attempts: [],
      games: [game(300, 12)],
    };
    const statuses = badgeStatuses(progressStats(log, TODAY));
    const get = (id: string) => statuses.find((s) => s.badge.id === id)!;
    expect(get('first-word').earned).toBe(true);
    expect(get('british-10').earned).toBe(true);
    expect(get('idiom-10')).toMatchObject({ earned: false, current: 3 });
    expect(get('words-25')).toMatchObject({ earned: false, current: 13 });
    expect(get('rush-250').earned).toBe(true);
    expect(get('rush-250').current).toBe(250);
    expect(get('combo-10').earned).toBe(true);
    expect(get('streak-3').earned).toBe(false);
  });
});

describe('Spelling Bee stats', () => {
  const bee = (game: 'bee' | 'bee-tricky', score: number, correct: number): GameScoreRecord => ({
    id: `b${n++}`,
    game,
    score,
    correct,
    answered: correct,
    bestCombo: 15,
    date: TODAY,
    playedAt: new Date(`${TODAY}T12:00:00`).toISOString(),
  });

  it('keeps the Bee and Word Rush apart, and counts tricky rounds as words but not bests', () => {
    const log: ActivityLog = {
      ...EMPTY,
      games: [bee('bee', 300, 20), bee('bee', 450, 30), bee('bee-tricky', 900, 60), game(50)],
    };
    const stats = progressStats(log, TODAY);
    expect(stats).toMatchObject({
      beeBest: 450,
      beeGames: 2,
      beeWordsSpelt: 110,
      rushBest: 50,
      rushBestCombo: 0,
    });
    const statuses = badgeStatuses(stats);
    const get = (id: string) => statuses.find((s) => s.badge.id === id)!;
    expect(get('bee-400').earned).toBe(true);
    expect(get('bee-spelt-100').earned).toBe(true);
    expect(get('rush-250').earned).toBe(false);
    expect(get('combo-10').earned).toBe(false);
  });
});

describe('describeDay', () => {
  it('summarises what happened, or makes light of a day off', () => {
    expect(describeDay({ learnt: 1, reviewed: 3, practised: 0, games: 2 })).toBe(
      '1 word learnt · 3 reviews · 2 games',
    );
    expect(describeDay(undefined)).toMatch(/day off/);
    expect(describeDay(undefined, true)).toMatch(/Nothing yet/);
  });
});
