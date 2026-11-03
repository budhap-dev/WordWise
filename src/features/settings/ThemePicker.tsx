import { Check } from 'lucide-react';

import { type ColourTheme, PALETTES, type TokenSet } from '../../theme/palettes';

/** A tiny mock screen in a palette's colours: a card with a heading bar, text lines and a button. */
function MiniScreen({ t, label }: { t: TokenSet; label: string }) {
  return (
    <span
      className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg p-1.5"
      style={{ background: t.bg }}
      aria-hidden="true"
      title={label}
    >
      <span className="flex flex-col gap-1 rounded-md p-1.5" style={{ background: t.surface }}>
        <span className="h-1.5 w-3/4 rounded-full" style={{ background: t.ink }} />
        <span
          className="h-1 w-full rounded-full"
          style={{ background: t['ink-muted'], opacity: 0.6 }}
        />
        <span className="flex items-center gap-1">
          <span className="h-2.5 min-w-0 flex-1 rounded-full" style={{ background: t.brand }} />
          <span className="size-2 shrink-0 rounded-full" style={{ background: t.accent }} />
        </span>
      </span>
    </span>
  );
}

export function ThemePicker({
  value,
  onChange,
}: {
  value: ColourTheme;
  onChange: (palette: ColourTheme) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-1">
        <span className="text-lg font-semibold">Colour theme</span>
      </legend>
      <p className="mb-3 text-sm text-ink-muted">
        Each theme has a light and a dark version, so it follows the mode above.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {PALETTES.map((p) => {
          const selected = value === p.id;
          return (
            <label
              key={p.id}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                selected ? 'border-brand bg-brand-soft/50' : 'border-line hover:border-ink-muted/40'
              }`}
            >
              <input
                type="radio"
                name="palette"
                value={p.id}
                className="sr-only"
                checked={selected}
                onChange={() => onChange(p.id)}
              />
              <span className="flex w-28 shrink-0 gap-1 overflow-hidden rounded-xl border border-line p-1">
                <MiniScreen t={p.light} label={`${p.name}, light`} />
                <MiniScreen t={p.dark} label={`${p.name}, dark`} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{p.name}</span>
                <span className="block text-sm text-ink-muted">{p.blurb}</span>
              </span>
              {selected && <Check className="size-5 shrink-0 text-brand" aria-hidden="true" />}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
