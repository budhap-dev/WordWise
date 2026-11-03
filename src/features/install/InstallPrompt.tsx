import { Download, EllipsisVertical, Share, SquarePlus, X } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';

import { LogoMark } from '../../components/layout/Logo';
import { Button } from '../../components/ui/Button';
import { cardClasses } from '../../components/ui/styles';
import { useInstall } from '../../hooks/useInstall';
import { HAPTIC, haptic } from '../../lib/haptics';
import { type InstallMethod, isMobile, promptInstall } from '../../lib/install';

const DISMISS_KEY = 'wordwise:install-dismissed';
const DISMISS_DAYS = 14;

function dismissedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(at) && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand"
        aria-hidden="true"
      >
        {n}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}

/** Step-by-step instructions for browsers without an install dialog. */
export function InstallSteps({ method, id }: { method: InstallMethod; id?: string }) {
  if (method === 'ios') {
    return (
      <ol
        id={id}
        className="mt-4 animate-rise space-y-3 text-sm"
        aria-label="How to install on iPhone or iPad"
      >
        <Step n={1}>
          Tap <Share className="mx-0.5 inline size-4 align-text-bottom" aria-label="Share" /> Share
          in Safari’s toolbar (in Chrome, it’s at the top right).
        </Step>
        <Step n={2}>
          Scroll down and tap{' '}
          <SquarePlus className="mx-0.5 inline size-4 align-text-bottom" aria-hidden="true" />{' '}
          <strong>Add to Home Screen</strong>.
        </Step>
        <Step n={3}>
          Tap <strong>Add</strong>. WordWise will appear on your home screen, and works offline.
        </Step>
      </ol>
    );
  }
  return (
    <ol id={id} className="mt-4 animate-rise space-y-3 text-sm" aria-label="How to install">
      <Step n={1}>
        Open your browser’s menu{' '}
        <EllipsisVertical className="inline size-4 align-text-bottom" aria-label="(three dots)" />.
      </Step>
      <Step n={2}>
        Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.
      </Step>
      <Step n={3}>Confirm, and WordWise will open like any other app, even offline.</Step>
    </ol>
  );
}

function useInstallAction() {
  const { installed, method } = useInstall();
  const [showSteps, setShowSteps] = useState(false);
  const stepsId = useId();
  const act = async () => {
    haptic(HAPTIC.tap);
    if (method === 'prompt') await promptInstall();
    else setShowSteps((s) => !s);
  };
  return { installed, method, showSteps, stepsId, act };
}

function ActionButton({
  method,
  showSteps,
  stepsId,
  onClick,
}: {
  method: InstallMethod;
  showSteps: boolean;
  stepsId: string;
  onClick: () => void;
}) {
  return method === 'prompt' ? (
    <Button onClick={onClick}>
      <Download className="size-4" aria-hidden="true" /> Install
    </Button>
  ) : (
    <Button
      variant="soft"
      onClick={onClick}
      aria-expanded={showSteps}
      aria-controls={showSteps ? stepsId : undefined}
    >
      {showSteps ? 'Hide steps' : 'Show me how'}
    </Button>
  );
}

/** A friendly nudge on Today, for phones only, dismissible for a fortnight. */
export function InstallCard() {
  const { installed, method, showSteps, stepsId, act } = useInstallAction();
  const [dismissed, setDismissed] = useState(dismissedRecently);
  if (installed || dismissed || !isMobile()) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore: it'll just show again next time
    }
    setDismissed(true);
  };

  return (
    <section
      aria-labelledby="install-heading"
      className={`${cardClasses} relative animate-rise p-5`}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Not now"
        className="absolute top-2 right-2 inline-flex size-11 items-center justify-center rounded-full text-ink-muted active:bg-surface-2"
      >
        <X className="size-5" aria-hidden="true" />
      </button>
      <div className="flex items-center gap-4 pr-8">
        <LogoMark className="size-14 shrink-0 drop-shadow" />
        <div>
          <h2 id="install-heading" className="font-semibold">
            Put WordWise on your home screen
          </h2>
          <p className="text-sm text-ink-muted">One tap to your daily words. Works offline, too.</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <ActionButton
          method={method}
          showSteps={showSteps}
          stepsId={stepsId}
          onClick={() => void act()}
        />
        <Button variant="ghost" onClick={dismiss}>
          Not now
        </Button>
      </div>
      {showSteps && <InstallSteps method={method} id={stepsId} />}
    </section>
  );
}

/** Always available in Settings (unless already installed). */
export function InstallSection() {
  const { installed, method, showSteps, stepsId, act } = useInstallAction();
  return (
    <section aria-labelledby="install-settings-heading" className={`${cardClasses} p-6`}>
      <h2 id="install-settings-heading" className="text-lg font-semibold">
        Install the app
      </h2>
      {installed ? (
        <p className="mt-1 text-sm text-ink-muted">You’re using the installed app. Lovely. 📲</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-ink-muted">
            Add WordWise to your home screen: it opens full-screen and works offline. Your progress
            stays on this device.
          </p>
          <div className="mt-4">
            <ActionButton
              method={method}
              showSteps={showSteps}
              stepsId={stepsId}
              onClick={() => void act()}
            />
          </div>
          {showSteps && <InstallSteps method={method} id={stepsId} />}
        </>
      )}
    </section>
  );
}
