import { examplesForRoles } from './examples';

const entry = {
  examples: [
    { role: 'student' as const, text: 'S' },
    { role: 'teacher' as const, text: 'T' },
    { role: 'software' as const, text: 'W' },
  ],
};

describe('examplesForRoles', () => {
  it('shows one example per selected role', () => {
    expect(examplesForRoles(entry, ['student', 'software']).map((e) => e.text)).toEqual(['S', 'W']);
  });

  it('tops up to two examples when only one role is selected', () => {
    const texts = examplesForRoles(entry, ['teacher']).map((e) => e.text);
    expect(texts[0]).toBe('T');
    expect(texts).toHaveLength(2);
  });

  it('shows all three for all three roles', () => {
    expect(examplesForRoles(entry, ['student', 'teacher', 'software'])).toHaveLength(3);
  });
});
