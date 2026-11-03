# WordWise

A calm, playful, offline-first vocabulary app for fluent English speakers who want a richer, more precise everyday vocabulary — in British English.

## Getting started

Requires Node 22+ (Node 24 recommended; see `.nvmrc`).

```bash
npm install
npm run dev        # start the dev server at http://localhost:5173
```

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

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Vitest + React Testing Library · ESLint + Prettier.

## Contributing

`main` is protected: all changes go through a pull request and must pass CI (`npm run check` + build).
