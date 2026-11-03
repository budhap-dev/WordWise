import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { AppRoutes } from '../App';
import { SettingsProvider } from '../state/SettingsProvider';
import type { Settings } from '../types/user';

export const TEST_SETTINGS: Settings = {
  schemaVersion: 1,
  roles: ['teacher'],
  dailyGoal: 5,
  level: 'advanced',
  theme: 'system',
  palette: 'indigo',
  onboardedAt: '2026-11-03T09:00:00.000Z',
};

/** Renders the whole app at `route`, with optional settings (null = not onboarded). */
export function renderApp({
  route = '/',
  settings = TEST_SETTINGS,
}: { route?: string; settings?: Settings | null } = {}) {
  return render(
    <SettingsProvider initialSettings={settings}>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </SettingsProvider>,
  );
}
