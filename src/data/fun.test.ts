import { BRITISH_SAYINGS, JOKES, ROLES } from './index';

const AMERICAN = /\b(color|favor|humor|center|organiz|realiz|apologiz|gray)\w*/i;

describe('jokes', () => {
  it('has a good supply with unique ids', () => {
    expect(JOKES.length).toBeGreaterThanOrEqual(30);
    expect(new Set(JOKES.map((j) => j.id)).size).toBe(JOKES.length);
  });

  it.each(JOKES.map((j) => [j.id, j] as const))('%s is complete and British', (_id, j) => {
    for (const text of [j.setup, j.punchline, j.explanation]) {
      expect(text.trim()).not.toBe('');
      expect(text).not.toMatch(AMERICAN);
    }
    for (const r of j.roles ?? []) expect(ROLES).toContain(r);
  });
});

describe('British sayings', () => {
  it('has unique ids and both halves filled in', () => {
    expect(BRITISH_SAYINGS.length).toBeGreaterThanOrEqual(15);
    expect(new Set(BRITISH_SAYINGS.map((s) => s.id)).size).toBe(BRITISH_SAYINGS.length);
    for (const s of BRITISH_SAYINGS) {
      expect(s.say.trim()).not.toBe('');
      expect(s.mean.trim()).not.toBe('');
    }
  });

  it('explains how to tell when a saying means something else', () => {
    const withOthers = BRITISH_SAYINGS.filter((s) => s.otherMeanings);
    expect(withOthers.length).toBeGreaterThan(0);
    for (const s of withOthers) {
      for (const m of s.otherMeanings!) {
        expect(m.meaning.trim(), s.id).not.toBe('');
        expect(m.cue?.trim(), `${s.id}: "${m.meaning}" needs a cue`).toBeTruthy();
        expect(`${m.meaning} ${m.cue}`, s.id).not.toMatch(AMERICAN);
      }
    }
  });
});
