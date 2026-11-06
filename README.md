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
- **Browse and search** 📖: every word and phrase, A to Z, with a search that looks in terms, meanings, synonyms, opposites, other meanings, topics and example sentences, and says why each result matched. Ask for “opposite of lazy” or “another word for tired”. Filter by category, your progress (not learnt yet, learnt, due for review), level and register. Each word has its own page (`/words/<id>`) with everything about it, links to related words, and **Add to my reviews** for words you'd like to learn now. The search and filters live in the URL, so Back takes you to the same results.
- **Spaced-repetition reviews (SM-2)**: words you've learnt come back just before you'd forget them: tomorrow, then in about 6 days, then at growing intervals. Grade each one Again, Hard, Good or Easy (or press 1–4); each button shows when you'll see the word next. Words you struggle with get another go at the end of the session. Today shows reviews first, plus your 🔥 streak.
- **Word Rush** ⚡: a 60-second arcade game. Tap the word that matches a definition or fills a gap; combos multiply your points (×2, ×3, ×4), right answers add time, and three wrong answers end the round. Personal bests and titles from "Spelling Bee" to "Lexicographer Royal". Uses your own words first and counts towards your streak.
- **Spelling Bee** 🐝: hear a word in a British voice (slowly, if you like) and spell it on the app's own keyboard, so autocorrect can't help. The meaning is on show, a sentence is free and a revealed letter costs a quarter of the points. Three rounds, _A Doddle_, _Bit Tricky_ and _Fiendish_, and three lives. Mistakes show you exactly which letters went wrong, American spellings get a polite second chance, and misspelt words wait in _Tricky Words_ until you get them right. Works without speech too, using the meaning, a sentence and the letter count.
- **Progress, XP and badges** 🏆: everything you do earns XP (learning, reviews, practice, Word Rush and the Spelling Bee), and levels come with British titles from _Fresh Face_ and _Keen Bean_ to _Dab Hand_ and _Lexicon Legend_ (each one explained). The Progress tab shows your level, streaks, a 12-week activity calendar (tap a day to see what you did), how well you know your words (learning, familiar, mastered) and your progress by topic. Twenty-two badges to collect, from _A Century_ (100 words) to _Stiff Upper Lip_ (a 30-day streak) and _Night Owl_, each with a bit of British wit; locked ones show how close you are. New badges and level-ups are celebrated when you're back on a main screen, never mid-session. It's all worked out from your existing history, so nothing extra is stored.
- **Practice**: five quick games using your own words (shakiest first), plus a mixed bag. _What does it mean?_, _Fill the gap_, _Choose the better word_ (affect/effect, practice/practise…), _Upgrade this sentence_ (type a rewrite using the word) and _Register switch_ (posh, polite or pub: pick the right way to say it). Every answer is explained, and wrong choices say why they're wrong. Practice counts towards your streak but doesn't change your review schedule.
- **Your progress stays on your device**: words you've learnt are saved in IndexedDB (via Dexie), so they never reappear in a new daily set and are scheduled for review. Nothing is sent anywhere. Settings → Reset progress clears it.
- **Install it like an app**: on Android, tap **Install** on Today (or in Settings); on iPhone, Share → **Add to Home Screen** (the app shows you how). Once installed it opens full-screen, works offline, and long-pressing the icon jumps straight to Learn, Review or Practice. When an update is ready, you're asked before it reloads.
- **Share to WhatsApp**: share the Word of the Day or your progress from the app (it opens your phone's share sheet, or WhatsApp on a computer). Links to WordWise show a rich preview card.
- **Mobile-first**: full-screen sessions, thumb-reach buttons, tap to reveal, swipe to move on.
- **Pronunciation**: tap the speaker (or press <kbd>S</kbd>) to hear the word in a British English voice.
- **Playful, quick sessions**: reveal each card, then finish with a short "done for today" celebration and a small challenge.
- **Five colour themes**, each with a light and a dark version: WordWise (indigo), Oxford (navy and gold), Sage, Slate and Plum. Pick one in Settings; light, dark or match-your-device is chosen separately. Every text colour meets WCAG AA contrast in all ten variants (tested).
- Keyboard shortcuts and screen-reader labels throughout.

## Adding words

See [docs/ADDING_WORDS.md](docs/ADDING_WORDS.md). In short: add an entry to `src/data/words.json` and run `npm test`; the dataset test tells you if anything is missing.

## Project structure

```
src/
  data/        seed content (words.json) and typed loaders
  types/       content and user-data types
  lib/         pure logic: SM-2 scheduling, XP/levels/badges (achievements/), practice questions, daily selection, search, text matching, speech, dates
  db/          IndexedDB (Dexie) schema, progress writes and selectors
  hooks/       React hooks, including live progress queries
  state/       settings (localStorage)
  components/  shared UI (layout, buttons, word cards)
  features/    one folder per screen (onboarding, today, browse, review, practice, play, progress, settings)
```

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · React Router · Dexie (IndexedDB) · Vitest + React Testing Library · ESLint + Prettier.

## Deployment

Live at **https://wordwise-daily.vercel.app**. Vercel builds from GitHub:

- Every merge to `main` deploys to production.
- Every pull request gets its own preview URL (posted on the PR by the Vercel bot).

[`vercel.json`](vercel.json) runs `npm run build`, serves `dist/`, sends every route to `index.html` (so links like `/practice` work on refresh), caches hashed assets for a year and adds basic security headers. There's no backend: each visitor's progress stays in their own browser.

## Contributing

`main` is protected: all changes go through a pull request and must pass CI (`npm run check` + build).
