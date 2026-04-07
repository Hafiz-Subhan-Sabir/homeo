# Syndicate: missions, scoring, streaks, and roles

This document explains **how missions are generated**, **how scoring works**, **who performs each step** (human vs automated agents), **how streaks and points behave**, and **where staff can inspect a user** in Django admin.

For deeper detail, see also:

- `CHALLENGE_RESPONSE_SCORING.md` — numeric rubric, validation agent, time bonus, two-part responses (linked from here).
- `MISSION_TWO_FIELD_RESPONSE_AND_SCORING.md` — completion + learning fields and API merge.

---

## 1. Who does what (high level)

| Responsibility | Where it runs | Technology |
|----------------|---------------|------------|
| Store uploaded documents & mindset JSON | Django `api` app | DB + optional OpenAI **ingest** |
| **Generate daily missions** (15-cell grid: 5 categories × 3 moods) | Django `apps.challenges` + `api.services.openai_client` | **OpenAI** chat completions (JSON), prompts in `Backend/api/services/prompts.py` |
| **Validate** a written mission response before points | Same | **OpenAI** “evaluation agent” (`MISSION_RESPONSE_VALIDATION_SYSTEM`) — outputs `is_valid` |
| **Score** points (accuracy + time bonus) | Django `apps.challenges/services.py` | **Deterministic Python** (no LLM) — runs **only if** `is_valid` |
| **Attest** (optional qualitative pass/partial/needs_work) | Same | **OpenAI** (`MISSION_RESPONSE_ATTEST_SYSTEM`) — **does not change points** |
| **Streaks**, **points_total**, **level** on the server | `SyndicateUserProgress` + `views.syndicate_*` | Django ORM + JSON `state` sync from the dashboard |
| **Pounds balance** (display / conversion UX) | Primarily in **synced client state** | Value stored under `pounds_balance_v1` in `SyndicateUserProgress.state` (string synced from the browser) |

**Humans:** Django **staff** create **admin / bonus (“mega”) tasks**, review submissions, and award points in admin. **Users** complete missions in the Next.js dashboard.

---

## 2. How missions are generated (agent pipeline)

1. **Ingest (optional but typical in production)**  
   A document is uploaded → text extracted → OpenAI produces a **mindset graph** (`MindsetKnowledge.payload`) — not raw text for missions.

2. **Daily batch**  
   For each user/device day, the backend builds up to **15 missions**: one per **(category, mood)** with  
   `category ∈ {business, money, fitness, power, grooming}` and  
   `mood ∈ {energetic, happy, tired}`.

3. **OpenAI calls**  
   Prompts such as `daily_category_moods_system_prompt`, `daily_category_energetic_one_system_prompt`, and `daily_category_happy_tired_system_prompt` (see `prompts.py`) instruct the model to output **structured JSON** (title, description, example tasks, benefits, difficulty, etc.).  
   Mood is treated as **internal state** (effort, pacing, emotional aim), not keyword stuffing — see `_DAILY_MOOD_LOGIC` in `prompts.py`.

4. **Persistence**  
   Rows are stored as `GeneratedChallenge` (and related pruning rules apply for old calendar days).

**“Agent”** here means the **LLM** following those system prompts — not a separate autonomous process outside OpenAI + your Django code.

---

## 3. How scoring works (process & actors)

1. **User submits** two fields (`completion_how`, `completion_learned`) → merged server-side (see `resolve_mission_response_text` in `apps/challenges/services.py`).

2. **Evaluation agent (OpenAI)**  
   Runs **first**. If `OPENAI_API_KEY` is missing or the call fails → treated as **invalid** → **0 points**, no rubric.

3. **If `is_valid` is true**  
   - **Accuracy** is computed in Python from the combined text (relevance to title keywords, length, uniqueness, syndicate bonus, repetition penalty).  
   - **Time** applies only as a **secondary multiplier** on top of accuracy (it cannot “rescue” a zero-accuracy response).

4. **Attestation agent (OpenAI)**  
   Optional narrative; **does not** change `awarded_points`.

**Who “does” scoring:**  
- **Gate + narrative:** OpenAI models (with prompts in `prompts.py`).  
- **Numbers:** your **backend code** (`score_mission_response_after_validation`).

Full formulas: `CHALLENGE_RESPONSE_SCORING.md`.

---

## 4. Streaks (server rules)

Data lives on **`SyndicateUserProgress`**: `streak_count`, `last_activity_date`, plus JSON `state` for break hints.

| Mechanism | Behavior |
|-----------|----------|
| **First completion of a calendar day** | Frontend calls `POST /api/challenges/me/streak_record/` (usually once per day when the first mission completes). |
| **Same calendar day again** | Idempotent: streak unchanged. |
| **Consecutive calendar days** | `streak_count` increments. |
| **Gap of 2+ days** since `last_activity_date` | Streak **resets to 1** for the new day (chain restarted). |
| **Read path** | `GET syndicate_progress` runs `_normalize_streak_on_read`: if the user missed **at least one** full calendar day of activity (`(today - last).days >= 2`), streak is set to **0** and hints (`streak_before_break`, `streak_break_date`) may be written into `state`. |
| **Referral restore** | `POST me/streak_restore/` can set streak after a referral flow (see `views.py`). |

Exact logic: `Backend/apps/challenges/views.py` — `syndicate_streak_record`, `_normalize_streak_on_read`, `syndicate_streak_restore`.

---

## 5. Points, level, and pounds

| Field | Meaning |
|-------|---------|
| **`points_total`** | Stored on `SyndicateUserProgress`; also mirrored in synced `state` from the client. |
| **`level`** | Derived on PATCH: `level = floor(points_total / 20)` (backend-safe; UI may show richer tiers). |
| **`pounds_balance_v1`** | String in `state` (synced from the dashboard “points to pounds” UX). **Not** a separate DB column. |

Leaderboard rows (`LeaderboardEntry`) may reflect synced totals for display; authoritative progression for a logged-in user is **`SyndicateUserProgress`**.

---

## 6. Django admin: viewing a user’s Syndicate stats

Staff can see **streak**, **total points**, **level**, **pounds (from synced state)**, and **last activity date** in two ways:

1. **Users** → open a user → **“Syndicate (read-only)”** section on the change form.  
2. **Syndicate user progress** → list/search all `SyndicateUserProgress` rows (same numbers; useful for support without opening the user first).

Pounds show as **£x.xx** when `pounds_balance_v1` parses as a number; otherwise the raw string is shown.

---

## 7. Related code paths (quick reference)

| Topic | Primary files |
|-------|----------------|
| Prompts | `Backend/api/services/prompts.py` |
| OpenAI wrappers | `Backend/api/services/openai_client.py` |
| Scoring & validation orchestration | `Backend/apps/challenges/services.py`, `views.py` (`mission_score_response`) |
| Streak & progress API | `Backend/apps/challenges/views.py` |
| Models | `Backend/apps/challenges/models.py` (`SyndicateUserProgress`) |
| Admin | `Backend/apps/challenges/admin.py` (User + `SyndicateUserProgress`) |
