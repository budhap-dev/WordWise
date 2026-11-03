import { loadSettings, parseSettings, saveSettings, SETTINGS_KEY } from './settingsStorage';

const valid = {
  schemaVersion: 1,
  roles: ['student', 'teacher'],
  dailyGoal: 10,
  level: 'advanced',
  theme: 'dark',
  onboardedAt: '2026-11-03T09:00:00.000Z',
};

describe('parseSettings', () => {
  it('accepts valid settings', () => {
    expect(parseSettings(valid)).toEqual(valid);
  });

  it('rejects settings without roles', () => {
    expect(parseSettings({ ...valid, roles: [] })).toBeNull();
    expect(parseSettings({ ...valid, roles: ['astronaut'] })).toBeNull();
  });

  it('rejects an invalid goal or level', () => {
    expect(parseSettings({ ...valid, dailyGoal: 7 })).toBeNull();
    expect(parseSettings({ ...valid, level: 'beginner' })).toBeNull();
  });

  it('defaults an unknown theme to system and de-duplicates roles', () => {
    const parsed = parseSettings({ ...valid, theme: 'neon', roles: ['student', 'student'] });
    expect(parsed?.theme).toBe('system');
    expect(parsed?.roles).toEqual(['student']);
  });
});

describe('load/save', () => {
  it('round-trips through localStorage', () => {
    const settings = parseSettings(valid)!;
    saveSettings(settings);
    expect(loadSettings()).toEqual(settings);
  });

  it('returns null for corrupt JSON', () => {
    localStorage.setItem(SETTINGS_KEY, '{not json');
    expect(loadSettings()).toBeNull();
  });
});
