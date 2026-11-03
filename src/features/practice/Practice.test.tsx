import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { REGISTER_PAIRS } from '../../data';
import { db, newCard } from '../../db/db';
import { lastScores, sessionsToday } from '../../hooks/usePractice';
import { addDays, toDateKey } from '../../lib/date';
import { SESSION_SIZE } from '../../lib/practice/session';
import { renderApp } from '../../test/render';

const answers = () => within(screen.getByRole('list', { name: 'Answers' })).getAllByRole('button');
const REGISTER_ANSWERS = new Set(REGISTER_PAIRS.map((p) => p.answer));
/** An answer button's text, without its number badge. */
const optionText = (b: HTMLElement) => (b.textContent ?? '').replace(/^\d/, '');

describe('Practice screen', () => {
  it('lists every mode, reachable from the main navigation', async () => {
    renderApp({ route: '/practice' });
    expect(await screen.findByRole('heading', { name: 'Practice' })).toBeInTheDocument();
    for (const name of [
      /mixed bag/i,
      /what does it mean/i,
      /fill the gap/i,
      /choose the better word/i,
      /upgrade this sentence/i,
      /register switch/i,
    ]) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument();
    }
    expect(screen.getAllByRole('link', { name: /^practice$/i }).length).toBeGreaterThan(0);
  });

  it('shows the latest score for a mode', async () => {
    const base = { sessionMode: 'register' as const, mode: 'register' as const, itemId: 'x' };
    await db.attempts.bulkAdd([
      {
        ...base,
        id: '1',
        sessionId: 's1',
        correct: true,
        date: toDateKey(),
        answeredAt: '2026-11-03T10:00:00Z',
      },
      {
        ...base,
        id: '2',
        sessionId: 's1',
        correct: false,
        date: toDateKey(),
        answeredAt: '2026-11-03T10:01:00Z',
      },
    ]);
    renderApp({ route: '/practice' });
    expect(await screen.findByText('Today: 1/2')).toBeInTheDocument();
  });

  it('sends unknown modes back to the Practice screen', async () => {
    renderApp({ route: '/practice/juggling' });
    expect(await screen.findByRole('heading', { name: 'Practice' })).toBeInTheDocument();
  });
});

describe('a choice session (register switch)', () => {
  it('can be played to the end, with a score', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/practice/register' });
    await screen.findByRole('list', { name: 'Answers' });

    for (let i = 0; i < SESSION_SIZE.register; i++) {
      const right = answers().find((b) => REGISTER_ANSWERS.has(optionText(b)))!;
      await user.click(right);
      expect(screen.getByText(/\(correct answer\)/)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /next|see how you did/i }));
    }

    expect(
      await screen.findByRole('heading', { name: `8 out of ${SESSION_SIZE.register}` }),
    ).toBeInTheDocument();
    expect(screen.getByText(/perfect score/i)).toBeInTheDocument();
    await waitFor(async () => expect(await db.attempts.count()).toBe(SESSION_SIZE.register));
    expect((await db.attempts.toArray()).every((a) => a.correct)).toBe(true);
  });

  it('explains why a wrong choice is wrong, and lists it to look at again', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/practice/register' });
    await screen.findByRole('list', { name: 'Answers' });

    const wrong = answers().find((b) => !REGISTER_ANSWERS.has(optionText(b)))!;
    const wrongText = optionText(wrong);
    const pair = REGISTER_PAIRS.find((p) => p.distractors.some((d) => d.text === wrongText))!;
    await user.click(wrong);
    expect(screen.getByText(/your pick:/i)).toBeInTheDocument();
    expect(
      screen.getByText(pair.distractors.find((d) => d.text === wrongText)!.why),
    ).toBeInTheDocument();
    // Options lock once answered.
    for (const b of answers()) expect(b).toBeDisabled();

    await waitFor(async () => expect((await db.attempts.toArray())[0]?.correct).toBe(false));
  });

  it('answers with number keys', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/practice/better-word' });
    await screen.findByRole('list', { name: 'Answers' });
    await user.keyboard('1');
    expect(answers()[0]).toHaveAttribute('aria-pressed', 'true');
    await user.keyboard('{Enter}');
    expect(screen.getByText(`2/${SESSION_SIZE['better-word']}`)).toBeInTheDocument();
  });
});

describe('gap fill', () => {
  it('fills the gap with the answer once you have chosen', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/practice/gap-fill' });
    await screen.findByRole('list', { name: 'Answers' });
    expect(screen.getByText('blank')).toBeInTheDocument();

    await user.click(answers()[0]!);
    const correct = answers().find((b) => b.textContent?.includes('(correct answer)'))!;
    const term = correct.textContent!.replace('(correct answer)', '').replace(/^\d/, '').trim();
    expect(screen.getByText(term, { selector: 'mark' })).toBeInTheDocument();
  });
});

describe('upgrade this sentence', () => {
  const term = () =>
    /using “(.+)”/.exec(screen.getByRole('textbox').getAttribute('placeholder') ?? '')![1]!;

  it('checks that the rewrite uses the word, then shows a model answer', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/practice/upgrade' });
    await screen.findByRole('textbox', { name: /your version/i });

    expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled();
    await user.type(screen.getByRole('textbox'), `Honestly, ${term()} is the word I needed.`);
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText(/lovely: you used/i)).toBeInTheDocument();
    expect(screen.getByText(/our version:/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.type(screen.getByRole('textbox'), 'Something plain and unimproved.');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText(/nearly\. try to include/i)).toBeInTheDocument();

    await waitFor(async () => expect(await db.attempts.count()).toBe(2));
    const saved = (await db.attempts.toArray()).sort((a, b) =>
      a.answeredAt.localeCompare(b.answeredAt),
    );
    expect(saved.map((a) => a.correct)).toEqual([true, false]);
  });

  it('can show an example without typing', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/practice/upgrade' });
    await user.click(await screen.findByRole('button', { name: /show me an example/i }));
    expect(screen.getByText(/here’s one way/i)).toBeInTheDocument();
  });
});

describe('mixed bag', () => {
  it('uses the learner’s own words first', async () => {
    const yesterday = addDays(toDateKey(), -1);
    await db.cards.bulkAdd(
      ['nuance', 'caveat', 'candid', 'wary', 'prudent', 'gauge'].map((id) =>
        newCard(id, yesterday),
      ),
    );
    renderApp({ route: '/practice/mixed' });
    expect(await screen.findByText(`1/${SESSION_SIZE.mixed}`)).toBeInTheDocument();
  });
});

describe('practice stats helpers', () => {
  const attempt = (
    sessionId: string,
    correct: boolean,
    answeredAt: string,
    date = '2026-11-03',
  ) => ({
    id: `${sessionId}-${answeredAt}`,
    sessionId,
    sessionMode: 'meaning' as const,
    mode: 'meaning' as const,
    itemId: 'nuance',
    correct,
    date,
    answeredAt,
  });

  it('takes the most recent session per mode', () => {
    const scores = lastScores([
      attempt('old', true, '2026-11-02T09:00:00Z', '2026-11-02'),
      attempt('new', true, '2026-11-03T09:00:00Z'),
      attempt('new', false, '2026-11-03T09:01:00Z'),
    ]);
    expect(scores.get('meaning')).toEqual({ correct: 1, total: 2, date: '2026-11-03' });
  });

  it('counts sessions started today', () => {
    const list = [
      attempt('a', true, '2026-11-03T09:00:00Z'),
      attempt('a', true, '2026-11-03T09:01:00Z'),
      attempt('b', true, '2026-11-03T10:00:00Z'),
      attempt('c', true, '2026-11-02T10:00:00Z', '2026-11-02'),
    ];
    expect(sessionsToday(list, 'meaning', '2026-11-03')).toBe(2);
    expect(sessionsToday(list, 'register', '2026-11-03')).toBe(0);
  });
});

describe('streaks and practice', () => {
  it('counts a practice session towards the streak', async () => {
    await db.attempts.add({
      id: 'p1',
      sessionId: 's',
      sessionMode: 'mixed',
      mode: 'meaning',
      itemId: 'nuance',
      correct: true,
      date: toDateKey(),
      answeredAt: new Date().toISOString(),
    });
    renderApp();
    expect(await screen.findByText(/1-day streak/i)).toBeInTheDocument();
    expect(screen.queryByText(/keep it going/i)).not.toBeInTheDocument();
  });
});
