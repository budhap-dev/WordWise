/**
 * Guards the colour themes: index.css must match palettes.ts, and every text pairing must meet
 * WCAG AA (4.5:1) in both light and dark.
 */
/// <reference types="node" />
import { readFileSync } from 'node:fs';

import { DEFAULT_THEME, PALETTES, type Token, type TokenSet } from './palettes';

// Read from disk: the test runner stubs CSS imports.
const css = readFileSync(`${process.cwd()}/src/index.css`, 'utf8');

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`No CSS block for ${selector}`);
  const body = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1]!, m[2]!.toLowerCase()]),
  );
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r!) + 0.7152 * lin(g!) + 0.0722 * lin(b!);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** Text colour on background colour, as used across the app. */
const TEXT_PAIRS: [Token, Token][] = [
  ...(['bg', 'surface', 'surface-2', 'brand-soft', 'success-soft', 'danger-soft'] as Token[]).map(
    (b): [Token, Token] => ['ink', b],
  ),
  ['ink-muted', 'bg'],
  ['ink-muted', 'surface'],
  ['ink-muted', 'surface-2'],
  ['brand', 'bg'],
  ['brand', 'surface'],
  ['brand', 'brand-soft'],
  ['brand-ink', 'brand'],
  ['success', 'bg'],
  ['success', 'surface'],
  ['danger', 'bg'],
  ['danger', 'surface'],
];

describe('colour themes', () => {
  it('has unique ids, including the default', () => {
    const ids = PALETTES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(DEFAULT_THEME);
  });

  it.each(
    PALETTES.flatMap((p) =>
      (['light', 'dark'] as const).map((mode) => [p.id, mode, p[mode]] as const),
    ),
  )('%s (%s) matches index.css', (id, mode, tokens) => {
    const selector =
      id === DEFAULT_THEME
        ? mode === 'light'
          ? ':root'
          : '.dark'
        : mode === 'light'
          ? `:root[data-palette='${id}']`
          : `:root.dark[data-palette='${id}']`;
    expect(block(selector)).toEqual(tokens);
  });

  it.each(
    PALETTES.flatMap((p) =>
      (['light', 'dark'] as const).map((mode) => [p.id, mode, p[mode]] as const),
    ),
  )('%s (%s) meets WCAG AA for text', (_id, mode, tokens: TokenSet) => {
    for (const [fg, bg] of TEXT_PAIRS) {
      expect(contrast(tokens[fg], tokens[bg]), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
    // The "danger" button: white text in light mode, page background in dark mode.
    const onDanger = mode === 'light' ? '#ffffff' : tokens.bg;
    expect(contrast(onDanger, tokens.danger), 'text on danger').toBeGreaterThanOrEqual(4.5);
  });
});
