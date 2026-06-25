# API Design

This document defines a **high‑level API contract** for the Eimaths Bounty Hunter platform.  It is not exhaustive but provides enough detail to begin implementing the backend services and frontend API client.  All endpoints should return JSON and require authentication unless explicitly stated.

## Authentication

### `POST /auth/register`

Registers a new parent account.

**Request body**

```json
{
  "email": "parent@example.com",
  "password": "MySecretPassword",
  "parentName": "คุณแม่สมศรี"
}
```

**Response**

* `201 Created` – New user created, returns a JWT or sets an HTTP‑only cookie.
* `400 Bad Request` – Validation failed (e.g. weak password, email already in use).

### `POST /auth/login`

Authenticates an existing user.  Returns a session token (JWT) or sets an HTTP‑only cookie.

**Request body**

```json
{
  "email": "parent@example.com",
  "password": "MySecretPassword"
}
```

**Response**

* `200 OK` – Returns user profile and authentication token.
* `401 Unauthorized` – Invalid credentials.

### `POST /auth/logout`

Invalidates the current session.  Returns `204 No Content` on success.

## Quests

### `GET /quests`

Returns a list of quests available to the authenticated user’s grade level.

**Response**

```json
[
  {
    "id": 1,
    "title": "ฝึกบวกเลขง่าย ๆ",
    "description": "ภารกิจบวกเลขสำหรับเด็กประถม",
    "grade": "ป.1",
    "coinReward": 10
  },
  ...
]
```

### `GET /quests/:id/questions`

Returns an ordered list of questions for a given quest.  Questions may be paginated to reduce payload size.

**Response**

```json
[
  {
    "questionId": 101,
    "text": "2 + 3 เท่ากับเท่าไหร่?",
    "options": ["4", "5", "6", "7"]
  },
  ...
]
```

## Answers

### `POST /answers`

Submits answers for grading.  Accepts an array of answered questions and returns the number of correct answers and coins awarded.

**Request body**

```json
{
  "questId": 1,
  "answers": [
    { "questionId": 101, "answer": "5" },
    { "questionId": 102, "answer": "7" }
  ]
}
```

**Response**

```json
{
  "correct": 2,
  "total": 2,
  "coinsAwarded": 20
}
```

## Wallet

### `GET /wallet`

Returns the current coin balance and a list of recent transactions.

**Response**

```json
{
  "balance": 120,
  "transactions": [
    { "id": 901, "type": "earn", "amount": 10, "description": "Completed quest 1", "timestamp": "2026-06-24T12:00:00Z" },
    { "id": 902, "type": "spend", "amount": 50, "description": "Redeemed reward 2", "timestamp": "2026-06-25T10:00:00Z" }
  ]
}
```

### `POST /wallet/earn`

Manually awards coins to a user (e.g. for special promotions).  Requires admin privileges.

## Rewards

### `GET /rewards`

Returns a list of redeemable rewards.

### `POST /rewards/redeem`

Redeems a reward for the authenticated user and deducts the appropriate number of coins.

**Request body**

```json
{
  "rewardId": 2
}
```

**Response**

```json
{
  "success": true,
  "remainingBalance": 70
}
```

## Report

### `GET /report`

Returns aggregated statistics for the parent report.  May accept query parameters such as `range=last30days`.

**Response**

```json
{
  "questsCompleted": 12,
  "correctRate": 0.85,
  "coinsEarned": 250,
  "recommendations": [
    "ลองให้เด็กทำภารกิจเรื่องคูณเลขเพิ่มเติม",
    "ปรับระดับคำถามให้ยากขึ้นเมื่อเฉลี่ยถูกเกิน 90%"
  ]
}
```

## Errors

All error responses should include a machine‑readable error code and a human‑readable message.  For example:

```json
{
  "error": "INSUFFICIENT_COINS",
  "message": "เหรียญไม่เพียงพอสำหรับการแลกของรางวัลนี้"
}
```

---

This API design provides a foundation for the frontend and backend to evolve together.  As new features (e.g. leaderboards, badges, social sharing) are added, endpoints can be expanded or new resources introduced.