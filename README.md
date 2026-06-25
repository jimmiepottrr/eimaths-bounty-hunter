# Eimaths Bounty Hunter

> **Demo Project** — This repository contains a proof‑of‑concept front‑end for the *Eimaths Bounty Hunter* project.  It demonstrates a simple maths‑learning game that allows children to complete quests, take quizzes, earn coins and redeem rewards.  Parents can log in, choose a grade level and view a progress report.  The user interface is built with **React**, **TypeScript** and **Vite** and is designed to be responsive on both desktop and mobile devices.

## Getting started

Because this repository includes only source code and configuration files, you must install the dependencies and run the development server yourself.  Use the following commands:

```sh
# install dependencies
npm install

# start the development server
npm run dev

# open http://localhost:5173/ in your browser
```

To create a production build, run `npm run build` and deploy the contents of the `dist` folder.

## Project structure

The project is organised into a few top‑level folders:

| Path                 | Purpose                                                         |
|----------------------|-----------------------------------------------------------------|
| `src/`               | Application source code, pages and components.                  |
| `public/`            | Static assets served by Vite at the root of the project.        |
| `docs/`              | High‑level documentation, architecture and design notes.         |
| `package.json`       | NPM package definition with dependencies and scripts.            |
| `tsconfig.json`      | TypeScript compiler configuration.                               |
| `vite.config.ts`     | Build configuration for Vite.                                    |

### Pages

All user‑facing screens live in `src/pages`:

* **Login** – Users enter their email and password.  In this demo authentication is mocked and automatically redirects to the grade selection page.
* **Grade** – Parents choose the appropriate grade level (e.g. *อนุบาล*, *ป.1*, etc.) for their child.  After selection they are taken to the main dashboard.
* **Home** – The central hub that provides links to quests, quizzes, wallet, rewards and the parent report.
* **Quest** – Lists available learning missions.  Each mission contains a title, short description and a link to start a quiz.
* **Quiz** – Presents a single sample question with multiple choice answers and immediate feedback.  Extending this page to load real questions from a backend is straightforward.
* **Wallet** – Shows the current coin balance and includes a button to add coins (for demonstration purposes).
* **Rewards** – Displays a static list of items that can be redeemed with coins.  In a full implementation this would be backed by a database and redemption logic.
* **Parent Report** – Summarises the child’s progress with placeholder statistics and recommendations.

### Components

* **Header** – A simple top navigation bar that hides itself on the login page.  It shows links to all major sections of the app.

## Documentation

Additional design documents live in the `docs/` folder:

* `architecture.md` – Overview of the proposed system architecture.
* `api-design.md` – High‑level API contract for frontend/backend integration.
* `crm-integration.md` – Plan for integrating the application with the Eimaths CRM via LINE OA and Google Sheets.
* `coin-system.md` – Description of the coin economy and how coins can be earned and spent.

These documents provide guidance on how this demo could be expanded into a full‑featured product.

## Next steps

This repository contains only a frontend proof‑of‑concept.  To complete the project you will need to:

1. Implement real authentication, user management and data storage (e.g. using Firebase or Supabase).
2. Connect the quiz and quest pages to a backend to retrieve questions, validate answers and award coins.
3. Persist coin balances, reward redemptions and progress to a database so that parents can track progress over time.
4. Integrate with the Eimaths CRM (see `docs/crm-integration.md`) to sync user data and automate notifications via LINE OA.
5. Design and implement a proper coin economy (see `docs/coin-system.md`).

Contributions and pull requests are welcome!