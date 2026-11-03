import { Outlet } from 'react-router';

/**
 * Full-screen layout for sessions (learning, later reviews and practice):
 * no header or tab bar, so all attention and the thumb zone go to the task.
 */
export function FocusLayout() {
  return (
    <div className="flex min-h-dvh flex-col pt-[env(safe-area-inset-top)]">
      <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 pt-3 pb-36">
        <Outlet />
      </main>
    </div>
  );
}
