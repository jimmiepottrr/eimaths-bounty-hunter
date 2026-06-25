# Eimaths Bounty Hunter

Eimaths Bounty Hunter is a playable React + TypeScript learning-game prototype for primary maths practice. It includes a complete local frontend flow for parents and students:

- parent/student login
- grade selection
- mission dashboard
- quest board
- multi-question quizzes
- coin rewards
- reward redemption
- parent progress report
- local progress persistence with `localStorage`

## Run Locally

```sh
npm install
npm run dev
```

Open `http://localhost:5173/`.

## Build

```sh
npm run build
```

The production files are generated in `dist/`.

## Project Structure

| Path | Purpose |
| --- | --- |
| `src/data.ts` | Quests, questions, grade levels, and reward catalog |
| `src/store.tsx` | App state, localStorage persistence, coins, quiz results, rewards |
| `src/pages/` | Login, grade, dashboard, quest, quiz, wallet, rewards, report |
| `src/components/Header.tsx` | Main app navigation |
| `src/styles.css` | Responsive application styling |
| `docs/` | Product and integration notes |

## Current Scope

This is a complete frontend prototype. It does not yet include a production backend, real authentication, CRM sync, or payment/reward fulfillment. Those can be connected later using the contracts in `docs/`.
