import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { AppShell } from './components/layout/AppShell';
import { OnboardingPage } from './features/onboarding/OnboardingPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { LearnSession } from './features/today/LearnSession';
import { TodayPage } from './features/today/TodayPage';
import { useSettings } from './state/settingsContext';
import { SettingsProvider } from './state/SettingsProvider';
import type { Settings } from './types/user';

function RequireOnboarding({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  return settings ? children : <Navigate to="/welcome" replace />;
}

function OnboardingRoute() {
  const { settings } = useSettings();
  return settings ? <Navigate to="/" replace /> : <OnboardingPage />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/welcome" element={<OnboardingRoute />} />
      <Route
        element={
          <RequireOnboarding>
            <AppShell />
          </RequireOnboarding>
        }
      >
        <Route index element={<TodayPage />} />
        <Route path="learn" element={<LearnSession />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App({ initialSettings }: { initialSettings?: Settings | null }) {
  return (
    <SettingsProvider initialSettings={initialSettings}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </SettingsProvider>
  );
}
