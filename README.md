# Syndicate

Full-stack **Syndicate** dashboard (portal, membership, gold HUD UI) plus an **AI agent** that creates daily missions, scores responses, and syncs streaks, leaderboard, and admin tasks.

This repo merges the upstream challenges stack described in [Smart AI Agent — Creates & Evaluates Challenges](https://github.com/HammadAli64/Smart-AI-Agent-That-Creates-Evaluates-Challenges) with the Syndicate portal and dashboard.

## Home branch — marketing site

The **`frontend/`** folder contains the **Home** marketing / landing Next.js app (App Router). Run it from `frontend/` with `npm install` and `npm run dev`. It sits beside **`Frontend-Dashboard/`** (the main Syndicate dashboard app).

## What it does

- **Dashboard** — Programs, Syndicate mode, membership hub, affiliate portal (Next.js + GSAP).
- **Portal auth** — JWT at `/api/auth/login/` (used with `/api/portal-proxy/` from the Next app).
- **Syndicate missions** — DRF Token auth at `/api/syndicate-auth/login/` (signup, login, logout, me) for the missions panel; OpenAI generates and evaluates missions.
- **Progress & sync** — Authenticated users persist streaks and points; leaderboard and admin-assigned tasks are supported.
- **Affiliate tracking** — Same Django service: `/api/track/*` and `/api/affiliate/auth/*` (OTP). The Next.js app calls these via `NEXT_PUBLIC_SYNDICATE_API_URL` (or optional `NEXT_PUBLIC_AFFILIATE_API_BASE_URL` override).
- **Member OTP + Stripe** — Public onboarding UI lives in **`Frontend-Dashboard`** under **`/syndicate-otp/*`** (login, signup, verify OTP). **`/checkout`** and **`/checkout/success`** stay at the site root for Stripe return URLs. Set `NEXT_PUBLIC_SYNDICATE_OTP_UI_BASE` if you need a different prefix.

## Tech stack

| Layer | Stack |
|--------|--------|
| API | Django 4.2, DRF, Simple JWT (portal) + Token auth (Syndicate) |
| AI | OpenAI (`OPENAI_MODEL`, default `gpt-4o-mini`) |
| UI | Next.js (App Router), React, Tailwind |

## Layout (this branch)

| Folder | Role |
|--------|------|
| **`Frontend-Dashboard/`** | Next.js app: dashboard, portal proxy usage, streaming UI, and the member OTP + Stripe flow. |
| **`frontend/`** | Home marketing / landing site (Next.js). |

**Django `Backend/`** is not included on this branch. The API still powers **`Frontend-Dashboard`** when you set `NEXT_PUBLIC_SYNDICATE_API_URL` (and related env) to a running Django instance—for example from the [`main` branch of Syndicate_real1](https://github.com/HammadAli64/Syndicate_real1/tree/main/Backend) or a deployed URL.

The marketing app in **`frontend/`** is mostly static pages and does not bundle the Backend folder; it does not need a local `Backend/` checkout unless you later add API calls.

## Frontend setup (dashboard)

```bash
cd Frontend-Dashboard
npm install
```

Copy `Frontend-Dashboard/.env.example` to `Frontend-Dashboard/.env.local` and adjust. Use `BACKEND_INTERNAL_URL` for the portal proxy and `NEXT_PUBLIC_SYNDICATE_API_URL` for direct API calls (must end with `/api`). Affiliate features use the **same** base URL unless `NEXT_PUBLIC_AFFILIATE_API_BASE_URL` is set.

```bash
npm run dev
```

## Home marketing site (`frontend/`)

```bash
cd frontend
npm install
npm run dev
```

## License

Add your license if you publish publicly.
