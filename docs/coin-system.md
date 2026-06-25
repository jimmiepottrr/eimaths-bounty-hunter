# Coin System

The **coin economy** is a core component of the Eimaths Bounty Hunter experience.  Coins motivate children to complete quests and quizzes, and they allow parents to reward positive behaviour with tangible benefits.  This document outlines how coins are earned, stored and spent.

## Earning coins

Coins can be awarded for a variety of actions:

| Action                               | Coins | Notes                                                  |
|--------------------------------------|------:|--------------------------------------------------------|
| Completing a quest                   |  5–20 | Varies based on difficulty and correctness.            |
| Achieving 100% on a quiz             | +5    | Bonus for perfect scores.                             |
| Daily login streak (3+ days)         | +10   | Encourages consistent practice.                       |
| Referral of a new student            | +50   | Given to both the referrer and the referred account.  |
| Completing a survey/feedback form    | +20   | Incentivises parent engagement.                       |
| Participating in special events      | varies| Promotions, seasonal events or sponsored activities.   |

Teachers and administrators can also manually adjust coin balances via the backend for exceptional achievements or as part of promotions.

## Spending coins

Coins can be redeemed for rewards managed by franchise owners.  Examples include:

* **Educational supplies** – pencils, notebooks, colouring books.
* **Digital perks** – custom avatar items, additional quests or access to mini games.
* **Discounts** – apply coins towards tuition fees or purchase of additional classes.
* **Gift cards or vouchers** – e.g. bookstore or toy shop vouchers (subject to partner agreements).

When a parent redeems a reward, the required number of coins is deducted from the child’s wallet.  Redemption requests are processed through the backend which verifies coin balances, records the transaction and notifies the CRM (see `crm-integration.md`).

## Balances and transactions

Coin balances are stored per child account in the `coins` table and can never be negative.  Every change to the balance must be recorded in the `transactions` table with the following fields:

* `id` – unique identifier.
* `userId` – the child’s account ID.
* `type` – `earn` or `spend`.
* `amount` – positive integer representing the number of coins.
* `description` – human‑readable description (e.g. “Completed quest 3”).
* `timestamp` – when the transaction occurred.

This ledger enables transparency and auditing of coin activities.  It also allows the backend to reconstruct balances if necessary.

## Economy balancing

To maintain a healthy coin economy:

* **Set earning rates** such that coins have meaningful value (e.g. 10–20 coins per quest if rewards cost 50+).
* **Introduce sinks** (expensive rewards, one‑time purchases) to prevent inflation.
* **Run promotions** sparingly and announce them through LINE OA campaigns to boost engagement without devaluing coins.
* **Monitor metrics** such as average balance, earn/spend ratio and redemption rate via the CRM dashboard.

Franchise owners can adjust coin values and reward costs in the admin panel without redeploying the platform, enabling experiments and targeted campaigns.

---

By combining a clear earning structure with desirable rewards, the coin system encourages continuous learning while giving parents a flexible tool to motivate their children.