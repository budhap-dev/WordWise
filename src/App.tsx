import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { AppShell } from './components/layout/AppShell';
import { FocusLayout } from './components/layout/FocusLayout';
import { UpdateToast } from './features/install/UpdateToast';
import { OnboardingPage } from './features/onboarding/OnboardingPage';
import { PracticeHub } from './features/practice/PracticeHub';
import { PracticeSession } from './features/practice/PracticeSession';
import { ReviewSession } from './features/review/ReviewSession';
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
        <Route path="practice" element={<PracticeHub />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      {/* Full-screen sessions: no header or tab bar */}
      <Route
        element={
          <RequireOnboarding>
            <FocusLayout />
          </RequireOnboarding>
        }
      >
        <Route path="learn" element={<LearnSession />} />
        <Route path="review" element={<ReviewSession />} />
        <Route path="practice/:mode" element={<PracticeSession />} />
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
      <UpdateToast />
    </SettingsProvider>
  );
}
