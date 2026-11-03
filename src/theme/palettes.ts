/**
 * Colour themes. Each has a light and a dark variant; the mode (light, dark or match device) is
 * chosen separately. This file is the source of truth: src/index.css must match it (checked by
 * palettes.test.ts, which also checks WCAG AA contrast for every text pairing).
 */

export type ColourTheme = 'indigo' | 'oxford' | 'sage' | 'slate' | 'plum';

export type Token =
  | 'bg'
  | 'surface'
  | 'surface-2'
  | 'ink'
  | 'ink-muted'
  | 'line'
  | 'brand'
  | 'brand-ink'
  | 'brand-soft'
  | 'accent'
  | 'spark'
  | 'success'
  | 'success-soft'
  | 'danger'
  | 'danger-soft';

export type TokenSet = Record<Token, string>;

export interface PaletteInfo {
  id: ColourTheme;
  name: string;
  blurb: string;
  light: TokenSet;
  dark: TokenSet;
}

export const DEFAULT_THEME: ColourTheme = 'indigo';

export const PALETTES: readonly PaletteInfo[] = [
  {
    id: 'indigo',
    name: 'WordWise',
    blurb: 'Indigo on warm cream. The original.',
    light: {
      bg: '#faf7f2',
      surface: '#ffffff',
      'surface-2': '#f2ede4',
      ink: '#1f2328',
      'ink-muted': '#565b62',
      line: '#e4ddd1',
      brand: '#4f46e5',
      'brand-ink': '#ffffff',
      'brand-soft': '#e9e7fd',
      accent: '#f5a524',
      spark: '#ff7a59',
      success: '#17804a',
      'success-soft': '#dcf3e6',
      danger: '#c5363b',
      'danger-soft': '#fbe3e3',
    },
    dark: {
      bg: '#14161a',
      surface: '#1c1f24',
      'surface-2': '#252930',
      ink: '#ecedee',
      'ink-muted': '#a7acb3',
      line: '#2e333b',
      brand: '#9b97f7',
      'brand-ink': '#14161a',
      'brand-soft': '#2a2950',
      accent: '#f7b955',
      spark: '#ff9479',
      success: '#4cc38a',
      'success-soft': '#16352a',
      danger: '#ff7b7b',
      'danger-soft': '#3d1f22',
    },
  },
  {
    id: 'oxford',
    name: 'Oxford',
    blurb: 'Navy and gold, like a college scarf.',
    light: {
      bg: '#f4f6fa',
      surface: '#ffffff',
      'surface-2': '#e8edf5',
      ink: '#17202e',
      'ink-muted': '#4a5568',
      line: '#d6deea',
      brand: '#1d4f91',
      'brand-ink': '#ffffff',
      'brand-soft': '#dde7f6',
      accent: '#c9a227',
      spark: '#d9734e',
      success: '#1c7a4b',
      'success-soft': '#dbf0e4',
      danger: '#b42f35',
      'danger-soft': '#f8e0e1',
    },
    dark: {
      bg: '#0d1524',
      surface: '#142035',
      'surface-2': '#1b2a43',
      ink: '#e8edf6',
      'ink-muted': '#a4b0c4',
      line: '#26354f',
      brand: '#93b8ef',
      'brand-ink': '#0d1524',
      'brand-soft': '#1d3356',
      accent: '#e2be4c',
      spark: '#f0957a',
      success: '#5cc791',
      'success-soft': '#13301f',
      danger: '#ff8a8a',
      'danger-soft': '#3a1c22',
    },
  },
  {
    id: 'sage',
    name: 'Sage',
    blurb: 'Calm greens for a quiet mind.',
    light: {
      bg: '#f3f6f1',
      surface: '#ffffff',
      'surface-2': '#e5ece2',
      ink: '#1b2620',
      'ink-muted': '#4c5a51',
      line: '#d3ddd0',
      brand: '#2c6a4d',
      'brand-ink': '#ffffff',
      'brand-soft': '#dbece2',
      accent: '#d49b33',
      spark: '#de7859',
      success: '#1f7646',
      'success-soft': '#daf0e2',
      danger: '#b5373a',
      'danger-soft': '#f7e0e0',
    },
    dark: {
      bg: '#101713',
      surface: '#17201b',
      'surface-2': '#202b25',
      ink: '#e5ece7',
      'ink-muted': '#a0aea5',
      line: '#29362f',
      brand: '#7fc8a4',
      'brand-ink': '#101713',
      'brand-soft': '#1e392d',
      accent: '#e5b85c',
      spark: '#f29479',
      success: '#6acd9c',
      'success-soft': '#15321f',
      danger: '#ff8c8c',
      'danger-soft': '#3b1e20',
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    blurb: 'Neutral graphite with a crisp blue.',
    light: {
      bg: '#f7f7f8',
      surface: '#ffffff',
      'surface-2': '#ececef',
      ink: '#18181b',
      'ink-muted': '#52525b',
      line: '#dfdfe4',
      brand: '#1d4ed8',
      'brand-ink': '#ffffff',
      'brand-soft': '#e0e8fb',
      accent: '#f59e0b',
      spark: '#f97316',
      success: '#15803d',
      'success-soft': '#dcf5e4',
      danger: '#b91c1c',
      'danger-soft': '#fbe2e2',
    },
    dark: {
      bg: '#0f0f12',
      surface: '#18181c',
      'surface-2': '#222227',
      ink: '#ededf0',
      'ink-muted': '#a1a1aa',
      line: '#2c2c33',
      brand: '#8ab4ff',
      'brand-ink': '#0f0f12',
      'brand-soft': '#1e2a45',
      accent: '#fbbf24',
      spark: '#fb923c',
      success: '#4ade80',
      'success-soft': '#133020',
      danger: '#f87171',
      'danger-soft': '#3a1a1c',
    },
  },
  {
    id: 'plum',
    name: 'Plum',
    blurb: 'Warm and elegant, with a hint of rosé.',
    light: {
      bg: '#faf6f7',
      surface: '#ffffff',
      'surface-2': '#f1e7eb',
      ink: '#2a1d24',
      'ink-muted': '#634f59',
      line: '#e6d8de',
      brand: '#8a3459',
      'brand-ink': '#ffffff',
      'brand-soft': '#f4e0e9',
      accent: '#d4a35a',
      spark: '#e07a5f',
      success: '#1d774a',
      'success-soft': '#dcf1e5',
      danger: '#b3333a',
      'danger-soft': '#f9e0e2',
    },
    dark: {
      bg: '#161013',
      surface: '#1f171b',
      'surface-2': '#2a2025',
      ink: '#f2e9ed',
      'ink-muted': '#baa7b0',
      line: '#362a31',
      brand: '#e8a2c1',
      'brand-ink': '#161013',
      'brand-soft': '#3e2231',
      accent: '#e8be73',
      spark: '#f29479',
      success: '#5fc995',
      'success-soft': '#15301f',
      danger: '#ff8a8a',
      'danger-soft': '#3c1c21',
    },
  },
];

export const COLOUR_THEMES: readonly ColourTheme[] = PALETTES.map((p) => p.id);
