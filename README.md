# WordWise

A calm, playful, mobile-first vocabulary app for fluent English speakers who want a richer, more precise everyday vocabulary — in British English.

## Getting started

Requires Node 22+ (Node 24 recommended; see `.nvmrc`).

```bash
npm install
npm run dev        # start the dev server at http://localhost:5173
```

### Try it on your phone

WordWise is designed mobile-first. With your phone on the same Wi-Fi as your computer:

```bash
npm run dev:mobile
```

Vite prints a `Network:` address such as `http://192.168.1.20:5173`. Open that on your phone.

## Scripts

| Command              | What it does                                 |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Start the Vite dev server                    |
| `npm run build`      | Typecheck and build for production (`dist/`) |
| `npm run preview`    | Serve the production build locally           |
| `npm test`           | Run the test suite once (Vitest)             |
| `npm run test:watch` | Run tests in watch mode                      |
| `npm run lint`       | Lint with ESLint (incl. accessibility rules) |
| `npm run format`     | Format everything with Prettier              |
| `npm run check`      | Typecheck, lint, format check and tests      |

## What's in it so far

- **Onboarding**: pick your roles (student, teacher, software professional, or everyday life), a daily goal (5, 10 or 15 words) and your level. Saved in your browser (localStorage).
- **Word of the Day and daily set**: a fresh, varied set each day, chosen from words for your roles and level. Each word has UK IPA, a plain-English definition, examples tailored to your roles, register, collocations, synonyms with how they differ, other meanings (with how to tell them apart), common mistakes and an origin story.
- **Britishisms and British humour**: everyday British words and phrases (chuffed, a faff, Bob's your uncle…), plus a daily "bit of fun" card. It alternates between clean jokes, each with the wordplay explained, and British understatement decoded ("With the greatest respect…" means "you're wrong"), including when a phrase can mean the opposite ("quite good" is usually lukewarm, but said with enthusiasm it's praise).
- **Spaced-repetition reviews (SM-2)**: words you've learnt come back just before you'd forget them: tomorrow, then in about 6 days, then at growing intervals. Grade each one Again, Hard, Good or Easy (or press 1–4); each button shows when you'll see the word next. Words you struggle with get another go at the end of the session. Today shows reviews first, plus your 🔥 streak.
- **Your progress stays on your device**: words you've learnt are saved in IndexedDB (via Dexie), so they never reappear in a new daily set and are scheduled for review. Nothing is sent anywhere. Settings → Reset progress clears it.
- **Mobile-first**: full-screen sessions, thumb-reach buttons, tap to reveal, swipe to move on.
- **Pronunciation**: tap the speaker (or press <kbd>S</kbd>) to hear the word in a British English voice.
- **Playful, quick sessions**: reveal each card, then finish with a short "done for today" celebration and a small challenge.
- Light and dark mode (follows your device by default), keyboard shortcuts and screen-reader labels.

## Adding words

See [docs/ADDING_WORDS.md](docs/ADDING_WORDS.md). In short: add an entry to `src/data/words.json` and run `npm test`; the dataset test tells you if anything is missing.

## Project structure

```
src/
  data/        seed content (words.json) and typed loaders
  types/       content and user-data types
  lib/         pure logic: SM-2 scheduling, daily selection, text matching, speech, dates
  db/          IndexedDB (Dexie) schema, progress writes and selectors
  hooks/       React hooks, including live progress queries
  state/       settings (localStorage)
  components/  shared UI (layout, buttons, word cards)
  features/    one folder per screen (onboarding, today, settings…)
```

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · React Router · Dexie (IndexedDB) · Vitest + React Testing Library · ESLint + Prettier.

## Contributing

`main` is protected: all changes go through a pull request and must pass CI (`npm run check` + build).
