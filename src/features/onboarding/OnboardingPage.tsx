import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/layout/Logo';
import { LEVEL_LABELS, ROLE_LABELS } from '../../data';
import { estimateMinutes } from '../../lib/daily';
import { useSettings } from '../../state/settingsContext';
import type { Level, Role } from '../../types/content';
import type { DailyGoal } from '../../types/user';
import { GoalPicker, LevelPicker, RolePicker } from './PreferenceFields';

const STEPS = ['welcome', 'roles', 'goal', 'level', 'ready'] as const;
type Step = (typeof STEPS)[number];

function StepHeading({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <>
      <span className="block font-display text-3xl font-semibold tracking-tight text-balance">
        {children}
      </span>
      {sub && <span className="mt-2 block text-ink-muted">{sub}</span>}
    </>
  );
}

export function OnboardingPage() {
  const { setSettings } = useSettings();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('welcome');
  const [roles, setRoles] = useState<Role[]>([]);
  const [dailyGoal, setDailyGoal] = useState<DailyGoal>(10);
  const [level, setLevel] = useState<Level>('advanced');
  const panelRef = useRef<HTMLDivElement>(null);

  const index = STEPS.indexOf(step);
  const go = (delta: number) => setStep(STEPS[index + delta] ?? step);

  // Move focus to the new step for keyboard and screen-reader users.
  useEffect(() => {
    if (step !== 'welcome') panelRef.current?.focus();
  }, [step]);

  const finish = () => {
    setSettings({
      schemaVersion: 1,
      roles,
      dailyGoal,
      level,
      theme: 'system',
      onboardedAt: new Date().toISOString(),
    });
    navigate('/', { replace: true });
  };

  const canContinue = step !== 'roles' || roles.length > 0;

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      {/* Decorative blobs */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 size-72 animate-float rounded-full bg-brand/15 blur-3xl" />
        <div className="absolute bottom-0 -left-24 size-72 animate-float rounded-full bg-accent/20 blur-3xl [animation-delay:-3s]" />
      </div>

      {step !== 'welcome' && <h1 className="sr-only">Set up WordWise</h1>}
      <div className="flex h-10 items-center justify-between">
        {index > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => go(-1)}>
            <ArrowLeft className="size-4" aria-hidden="true" /> Back
          </Button>
        ) : (
          <span />
        )}
        {index > 0 && (
          <ol className="flex gap-1.5" aria-label={`Step ${index} of ${STEPS.length - 1}`}>
            {STEPS.slice(1).map((s, i) => (
              <li
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  i < index ? 'w-6 bg-brand' : 'w-1.5 bg-line'
                }`}
              />
            ))}
          </ol>
        )}
      </div>

      <div
        ref={panelRef}
        tabIndex={-1}
        key={step}
        className="flex flex-1 animate-rise flex-col justify-center py-8 outline-none"
      >
        {step === 'welcome' && (
          <div className="text-center">
            <Logo className="text-5xl" />
            <h1 className="mt-8 font-display text-4xl font-semibold tracking-tight text-balance">
              Find <em className="text-brand">exactly</em> the right word.
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-lg text-ink-muted">
              A few minutes a day for a richer, more precise vocabulary, in British English.
            </p>
            <ul className="mx-auto mt-8 grid max-w-sm gap-2 text-left">
              {[
                ['🎯', 'Words tailored to how you actually use English'],
                ['🔁', 'Smart reviews, so new words stick'],
                ['🔊', 'British pronunciation for every word'],
              ].map(([emoji, text]) => (
                <li key={text} className="flex items-center gap-3 rounded-2xl bg-surface/70 p-3">
                  <span aria-hidden="true" className="text-xl">
                    {emoji}
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {step === 'roles' && (
          <RolePicker
            value={roles}
            onChange={setRoles}
            legend={
              <StepHeading sub="Pick as many as you like; we'll tailor the examples to you.">
                Where do you use English most?
              </StepHeading>
            }
          />
        )}

        {step === 'goal' && (
          <GoalPicker
            value={dailyGoal}
            onChange={setDailyGoal}
            legend={
              <StepHeading sub="You can change this any time. Little and often beats cramming.">
                How many new words a day?
              </StepHeading>
            }
          />
        )}

        {step === 'level' && (
          <LevelPicker
            value={level}
            onChange={setLevel}
            legend={
              <StepHeading sub="We'll start with words at your level and stretch you from there.">
                How would you describe your English?
              </StepHeading>
            }
          />
        )}

        {step === 'ready' && (
          <div className="text-center">
            <div className="mx-auto flex size-20 animate-pop items-center justify-center rounded-full bg-brand-soft text-4xl">
              <Sparkles className="size-9 text-brand" aria-hidden="true" />
            </div>
            <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight">
              You're all set
            </h2>
            <p className="mt-3 text-ink-muted">
              {dailyGoal} words a day (about {estimateMinutes(dailyGoal)} minutes) at{' '}
              {LEVEL_LABELS[level].label.toLowerCase()} level, with examples tailored for{' '}
              {new Intl.ListFormat('en-GB').format(roles.map((r) => ROLE_LABELS[r].label))}.
            </p>
            <p className="mt-6 font-medium">Your first word of the day is waiting.</p>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 -mx-4 bg-gradient-to-t from-bg via-bg/95 to-transparent px-4 pt-6 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {step === 'ready' ? (
          <Button size="lg" className="w-full" onClick={finish}>
            Show me today's word <ArrowRight className="size-5" aria-hidden="true" />
          </Button>
        ) : (
          <>
            <Button size="lg" className="w-full" disabled={!canContinue} onClick={() => go(1)}>
              {step === 'welcome' ? "Let's begin" : 'Continue'}
              <ArrowRight className="size-5" aria-hidden="true" />
            </Button>
            {step === 'roles' && roles.length === 0 && (
              <p className="mt-2 text-center text-sm text-ink-muted" role="status">
                Choose at least one to continue.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
