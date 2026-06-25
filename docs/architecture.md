# System Architecture

This document outlines the **high‑level architecture** for a production‑ready version of the **Eimaths Bounty Hunter** platform.  The goal of this system is to deliver an engaging learning experience for children while giving parents and administrators the tools to monitor progress, manage content and automate communication via CRM.

## Overview

The system consists of three primary layers:

1. **Client** – A responsive single‑page application built with React and TypeScript.  It is responsible for rendering the user interface, handling local state (e.g. current question, coin balance) and communicating with the backend via a REST or GraphQL API.
2. **Backend** – A set of serverless functions or a traditional Node.js/Express server that exposes APIs for authentication, user management, quizzes, coin transactions and reward redemption.  It also integrates with external services such as the Eimaths CRM (LINE OA + Google Sheets) and payment gateways if necessary.
3. **Data storage** – A managed database (e.g. PostgreSQL via Supabase) that stores users, quests, questions, transaction logs and redemption history.  A document store (e.g. Firestore) may be used to store dynamic content such as quiz metadata or CMS pages.

## Components

### Client (Web)

The client is implemented as a progressive web application (PWA) to support both desktop and mobile usage.  It provides several flows:

* **Authentication** – Secure login/registration for parents and children via email/password or social login.  Access tokens are stored in secure HTTP‑only cookies to prevent XSS attacks.
* **Grade selection** – Parents choose the child’s grade level which determines the set of available quests and questions.
* **Quests and quizzes** – The client fetches a list of quests from the backend and renders them.  When a quest is started it requests a sequence of questions, records answers and sends results back to the backend for grading.
* **Wallet and rewards** – Displays the coin balance and available rewards.  Users can redeem coins for rewards via API calls.  Redemption triggers updates to the coin balance and CRM notifications.
* **Parent report** – Queries aggregated statistics from the backend and renders charts or tables summarising the child’s performance.

### Backend

The backend provides a stateless API that the client consumes.  Key endpoints include:

| Endpoint               | Method | Description                                                     |
|-----------------------|--------|-----------------------------------------------------------------|
| `/auth/login`         | POST   | Authenticate a user and return a JWT/session token.             |
| `/auth/register`      | POST   | Create a new user account.                                      |
| `/quests`             | GET    | Retrieve the list of available quests for the current grade.     |
| `/quests/:id/questions`| GET   | Retrieve a set of questions for a specific quest.               |
| `/answers`            | POST   | Submit answers for grading; returns score and awarded coins.     |
| `/wallet`             | GET    | Retrieve the current coin balance and transaction history.       |
| `/wallet/earn`        | POST   | Award coins for completing actions such as quests.              |
| `/rewards`            | GET    | List available rewards with their coin cost.                    |
| `/rewards/redeem`     | POST   | Redeem a reward and deduct coins.                               |
| `/report`             | GET    | Return aggregated performance statistics for the parent report.  |

All endpoints enforce authentication and authorisation.  The backend also publishes events (e.g. `questCompleted`, `rewardRedeemed`) that can trigger CRM notifications via LINE OA.

### Data model

Entities can be normalised into relational tables.  A simplified schema might include:

* **users** – stores parent and child accounts, role information and authentication data.
* **grades** – enumerates grade levels and maps them to quests and questions.
* **quests** – defines missions with metadata such as title, description, difficulty and associated grade.
* **questions** – stores individual quiz questions with possible answers, correct answer and coin value.
* **attempts** – logs each time a user attempts a question or completes a quest along with score and time.
* **coins** – ledger of coin transactions (earn and spend) for each user.
* **rewards** – list of redeemable items with cost and availability.
* **redemptions** – records of reward redemption by users.

### Integration with CRM

The CRM integration is handled by a separate service (see `crm-integration.md`) that listens for events from the backend and updates customer data in LINE OA/Google Sheets.  This decouples the learning platform from the CRM and allows administrators to configure messaging flows (welcome messages, reminders, win‑back campaigns) independently.

## Deployment

*Client* – Can be deployed to a static hosting service such as Vercel, Netlify or Firebase Hosting.  Because it is a SPA served over HTTPS it scales easily and can be cached by CDNs.

*Backend* – Can be implemented as serverless functions (AWS Lambda, Google Cloud Functions, Vercel Functions) or as a containerised Node.js application deployed to a platform like Google Cloud Run or Heroku.

*Database* – Use a managed relational database like PostgreSQL with connection pooling (e.g. via Supabase).  For realtime updates, websockets or Supabase’s realtime API can be used to push updates to the client.

## Security considerations

* Use HTTPS throughout.
* Store authentication tokens securely (HTTP‑only cookies).
* Validate all user input on both client and server.
* Rate‑limit APIs to prevent abuse.
* Implement proper access control to ensure parents can view only their own children’s data.

---

The above architecture is intentionally modular.  It allows the frontend to remain decoupled from the backend implementation and the CRM integration layer.  Changes to the CRM or the rewards catalogue can be made without redeploying the client.