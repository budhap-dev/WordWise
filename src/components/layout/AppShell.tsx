import { type LucideIcon, Settings, Sun } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router';

import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

/** Screens are added here as each phase lands. */
const NAV: NavItem[] = [
  { to: '/', label: 'Today', icon: Sun },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function navClass({ isActive }: { isActive: boolean }) {
  return `flex flex-col items-center gap-0.5 rounded-2xl px-4 py-1.5 text-xs font-semibold transition sm:flex-row sm:gap-2 sm:text-sm ${
    isActive ? 'bg-brand-soft text-brand' : 'text-ink-muted hover:text-ink'
  }`;
}

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-brand px-4 py-2 text-brand-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/85 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4 sm:h-16">
          <Link to="/" aria-label="WordWise home" className="rounded-lg">
            <Logo />
          </Link>
          <nav aria-label="Main" className="hidden sm:block">
            <ul className="flex items-center gap-1">
              {NAV.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink to={to} end className={navClass}>
                    <Icon className="size-4" aria-hidden="true" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 pt-5 pb-28 sm:pt-6 sm:pb-12">
        <Outlet />
      </main>

      {/* Bottom navigation on small screens */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        <ul className="mx-auto flex h-16 max-w-md items-center justify-around">
          {NAV.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink to={to} end className={navClass}>
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
