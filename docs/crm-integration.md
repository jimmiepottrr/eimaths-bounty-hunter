# CRM Integration

The **Eimaths CRM** combines LINE Official Account (OA) tagging, automated messaging and a centralised Google Sheet to manage leads, students and parents.  Integrating the Bounty Hunter learning platform with the CRM ensures a seamless user experience and improves retention and conversion.

## Objectives

* **Capture and enrich user data** – Automatically push new user sign‑ups, quest completions and reward redemptions from the learning platform into the CRM.
* **Segment audiences** – Apply LINE OA tags to parents based on status (trial, active, near expiry, expired), grade level and engagement to drive targeted messaging.
* **Automate communications** – Trigger welcome messages, progress updates, renewal reminders and win‑back campaigns through pre‑configured LINE OA automations.
* **Track KPIs** – Synchronise coin earnings, quest completion rates and renewal conversions with the Google Sheet dashboard used by admins.

## Data flow

1. **User creation** – When a parent registers a new account, the backend sends an event containing the parent’s LINE ID, email, selected grade and referral source.  A middleware service writes a new row in the Google Sheet under the `STUDENT_CRM` tab and applies the appropriate `ST_TRIAL` tag in LINE OA.
2. **Quest completion** – After a quest is completed, the backend emits a `questCompleted` event with the user ID, quest ID, score and coins earned.  The CRM middleware updates the `attempts` and `coins` values in Google Sheet and may apply tags such as `AC_STRONG` (เด็กเรียนไว) if the user consistently scores above a threshold.
3. **Coin redemptions** – When a reward is redeemed, the backend emits a `rewardRedeemed` event containing the reward ID and cost.  The middleware logs the redemption in the Google Sheet and deducts coins.  If the balance falls below a certain level, a `COINS_LOW` tag may be applied to encourage further activity.
4. **Plan expiry** – Periodically (e.g. daily) a script scans the `STUDENT_CRM` sheet for students with fewer than two remaining sessions (`ST_NEAR_END`).  It updates the tag in LINE OA and triggers a renewal reminder automation.
5. **Win‑back** – If a user has not logged in for 30 days, a `ST_WINBACK` tag is applied and a personalised message is sent via LINE OA offering incentives to return.

## Implementation

* **Middleware service** – Use a serverless function or lightweight API layer (e.g. built with Node.js) subscribed to events from the learning platform.  This service writes to Google Sheets using the Google Sheets API and applies tags via the LINE OA Messaging API.
* **Google Sheets** – The sheet is structured as described in the `STUDENT_CRM` section of the main documentation.  A separate `KPI_DASHBOARD` sheet uses formulas and charts to visualise conversion rates, coin economy and retention.
* **LINE OA automations** – Use the LINE OA Manager to set up the following flows:
  * **Welcome** – Triggered when `ST_TRIAL` tag is applied; sends a welcome message with a link to book a trial lesson.
  * **Post‑lesson follow‑up** – Triggered after the first quest/lesson is completed; sends feedback and invites the parent to subscribe.
  * **Renewal reminder** – Triggered when `ST_NEAR_END` tag is applied; encourages renewal before sessions expire.
  * **Win‑back** – Triggered when `ST_WINBACK` tag is applied; sends a comeback offer after a period of inactivity.

## Synchronisation strategies

* **Event‑driven** – For real‑time updates (e.g. quest completions) use webhook events emitted by the backend and processed by the middleware.
* **Scheduled jobs** – For periodic actions (e.g. renewal reminders, inactivity checks) use cron jobs or serverless scheduled functions to scan the Google Sheet and apply tags/messages as needed.

## Privacy and compliance

Parents must consent to their data being used for CRM purposes during registration.  All personal information should be stored securely and shared only via encrypted channels.  The CRM integration must comply with Thai PDPA regulations and any relevant educational data protection policies.

---

By centralising user activity data and automating communications through LINE OA, the CRM integration turns the Eimaths Bounty Hunter app into a powerful retention and marketing tool without manual effort from franchise owners.