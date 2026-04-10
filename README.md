# Syndicate

Full-stack **Syndicate** dashboard (portal, membership, gold HUD UI) plus an **AI agent** that creates daily missions, scores responses, and syncs streaks, leaderboard, and admin tasks.

This repo merges the upstream challenges stack described in [Smart AI Agent — Creates & Evaluates Challenges](https://github.com/HammadAli64/Smart-AI-Agent-That-Creates-Evaluates-Challenges) with the Syndicate portal and dashboard.

## What it does

- **Dashboard** — Programs, Syndicate mode, membership hub, affiliate areas (Next.js + GSAP).
- **Portal auth** — JWT at `/api/auth/login/` (used with `/api/portal-proxy/` from the Next app).
- **Syndicate missions** — DRF Token auth at `/api/syndicate-auth/login/` (signup, login, logout, me) for the missions panel; OpenAI generates and evaluates missions.
- **Progress & sync** — Authenticated users persist streaks and points; leaderboard and admin-assigned tasks are supported.

## Tech stack

| Layer | Stack |
|--------|--------|
| API | Django 4.2, DRF, Simple JWT (portal) + Token auth (Syndicate) |
| AI | OpenAI (`OPENAI_MODEL`, default `gpt-4o-mini`) |
| UI | Next.js (App Router), React, Tailwind |

## Layout

- `Backend/` — Django (`syndicate_backend`, `api`, `apps/challenges`, `apps/portal`, `apps/membership`)
- `Frontend-Dashboard/` — Next.js

## Backend setup

```bash
cd Backend
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Copy `Backend/.env.example` to `Backend/.env`, set secrets as needed, then:

```bash
python manage.py migrate
python manage.py runserver
```

## Frontend setup

```bash
cd Frontend-Dashboard
npm install
```

Copy `Frontend-Dashboard/.env.local.example` to `.env.local`. Use `BACKEND_INTERNAL_URL` for the portal proxy and `NEXT_PUBLIC_SYNDICATE_API_URL` for direct Syndicate API calls (must end with `/api`).

```bash
npm run dev
```

## License

Add your license if you publish publicly.
