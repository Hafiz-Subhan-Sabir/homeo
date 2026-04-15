# Membership article generation — how it works

This document describes how AI-generated membership articles are produced, where keywords come from, how a keyword is chosen for each run, and whether results are persisted in the database.

---

## Summary

| Question | Answer |
|----------|--------|
| **Are articles saved in the database?** | **Yes.** Each successful generation creates a row in the Django `Article` model and returns `article_id` and `article_slug` in the API response. |
| **Where do keywords come from?** | From the **active** `ArticleKeywordDataset` in Django admin: a JSON `rows` list of `{ "category", "keyword" }` objects (optional **`level`**: beginner \| intermediate \| advanced), usually populated by uploading CSV, DOCX, or PDF (with optional AI extraction for unstructured files). |
| **How is one keyword selected?** | After optional category filtering, the backend **weights** rows by **usage count**, **last-used date**, optional **level progression**, and **de-duplication** (fingerprints of recent `operator-brief` seeds + optional client `read_slugs`). Unused / stale keywords are preferred. |
| **What calls the generator?** | The dashboard membership hub calls `POST /api/portal/membership/generated-article/` once when the Articles tab loads (subject to a daily limit). |

---

## 1. Keyword dataset (admin → database)

### Model

- **`ArticleKeywordDataset`** stores uploaded material and parsed **`rows`**: a list of dictionaries like `{ "category": "business", "keyword": "negotiating retainers", "level": "intermediate" }`. The **`level`** field is optional; when present it drives beginner → intermediate → advanced progression per category.
- Exactly **one** dataset should be marked **`is_active=True`** at a time. The generator uses:

  ```text
  ArticleKeywordDataset.objects.filter(is_active=True).first()
  ```

### How `rows` get into the dataset

1. **Structured upload (CSV)**  
   - Expected columns include **`category`** and **`keyword`** (aliases like `topic`, `phrase` are also supported by the parser).  
   - Categories are normalized to: `business`, `money`, `power`, `grooming`, `others` (see `normalize_category` in `apps/membership/keyword_dataset.py`).

2. **DOCX / PDF (and similar)**  
   - The ingestion pipeline tries structured parsing first.  
   - If no structured rows are found, **plain text** is extracted and, when long enough, **OpenAI** can extract `{ category, keyword }` rows (`extract_membership_keywords_from_document` in `api/services/openai_client.py`), controlled by `MEMBERSHIP_KEYWORD_EXTRACTION_SYSTEM` in `api/services/prompts.py`.  
   - This requires `OPENAI_API_KEY` in the backend environment.
  
3. **Saving in admin**  
   - Validated rows are stored on the dataset; the active dataset is what generation reads at runtime.

---

## 2. API: generated article endpoint

- **URL (relative to portal API base):**  
  `POST /api/portal/membership/generated-article/`  
- **Implementation:** `MembershipGeneratedArticleView` in `apps/membership/views.py`.

### Request body (typical)

```json
{
  "category": "all",
  "avoid_titles": [],
  "read_slugs": ["my-article-slug"]
}
```

- **`category`:** `"all"` or one of `business`, `money`, `power`, `grooming`, `others`.  
  - If not `"all"`, only rows whose normalized category matches are used.
- **`avoid_titles`:** Optional list of titles (strings) passed to the model so it can try to avoid repeating those titles (trimmed, capped in code). The server also merges **recent titles** from `MembershipGenerationState`.
- **`read_slugs`:** Optional list of article slugs the member has already opened. Used to **exclude those keyword seeds** from selection and to **merge progression** when those articles store `generation_seed_level` (newer AI briefs).

### Daily limit (one article per calendar day)

Before doing any work, the view checks for an existing article **today** that has the tag **`operator-brief`** (by `published_at` date in the server’s local timezone):

- If one exists, the API returns **HTTP 200** with a payload that includes:
  - `already_generated_today: true`
  - `article_id`, `article_slug` of that article  
  - **No new** OpenAI call and **no new** DB row for that day.

---

## 3. How a keyword is selected

Implementation: `pick_keyword_row` in `apps/membership/generation.py`.

From the active dataset:

1. Load all `rows` that are objects with a non-empty **`keyword`**.
2. If `category != "all"`, keep only rows whose **`category`** matches (after `normalize_category`).
3. If the filtered list is empty → **400** / service error path.
4. Build a set of **fingerprints** to hard-avoid (recent `operator-brief` articles, `MembershipGenerationState.recent_keyword_fingerprints`, and articles whose **`slug`** appears in **`read_slugs`**). Each fingerprint hashes normalized `(category, keyword)`.
5. Merge **progression** per category: `MembershipGenerationState.progression_by_category` and, for each read article that has **`generation_seed_level`**, the maximum level seen (beginner < intermediate < advanced). The “next” preferred level is **one step** after that maximum (wrapping advanced → beginner).
6. **Weighted sample** over eligible rows: higher weight for **low `KeywordUsageStat.usage_count`**, **older `last_used_at`**, rows matching the **preferred level**, and slightly lower weight for levels **below** the preferred tier. Rows whose fingerprint is in the avoid set get weight **0**; if that eliminates everyone, a **soft** fallback down-weights avoided fingerprints instead of failing.

After a successful save, **`record_successful_generation`** increments usage stats, updates progression for the category, and prepends the new fingerprint and title to the rolling de-dupe lists.

---

## 4. How the “agent” writes the article (OpenAI)

### Function

- **`generate_membership_article`** in `Backend/api/services/openai_client.py`.

### Inputs sent to the model

- **`keyword`** — the chosen seed phrase.  
- **`category`** — normalized category.  
- **`titles_to_avoid`** — merged from the POST body and recent server-side titles.  
- **`keywords_to_avoid`** — seed phrases from recent `operator-brief` articles (and from **`read_slugs`**), passed so the model varies framing and does not retread the same topic phrasing.  
- **`creative_seed`** — short random hex string generated per request so outputs can vary.

### System behavior

- System prompt: **`MEMBERSHIP_ARTICLE_SYSTEM`** in `api/services/prompts.py`.  
- The model returns **JSON** with:
  - **`title`**
  - **`key_points`** — five items  
  - **`paragraphs`** — three items

### Post-processing

- **`_normalize_membership_article`** validates length and shape.  
- **`_normalize_membership_paragraphs`** ensures each paragraph has enough sentences (backend padding if the model returns short text).

---

## 5. Building the `Article` row (database save)

Still in `MembershipGeneratedArticleView.post`:

1. **Description** — built from the first two key points (or first paragraph fallback), truncated (~900 chars).
2. **`content`** — assembled as plain text:
   - A line `Seed: {keyword} - {category}`
   - A **Key points** section with `-` bullets
   - Blank lines, then the three paragraphs
3. **`tags`** — `["operator-brief", <category>]`.
4. **`Article`** instance created with:
   - `title`, `description`, `content`, `tags`
   - `generation_seed_keyword`, `generation_seed_category`, `generation_seed_level` (for progression, de-dupe, and API clients)
   - `source_url=""`, `thumbnail=""`, `is_featured=False` (unless you change this elsewhere)
5. **`article.save()`** — persists to the database (slug is typically generated on the model). **`record_successful_generation`** then updates **`KeywordUsageStat`** and **`MembershipGenerationState`**.

Response JSON includes the generation fields plus **`article_id`**, **`article_slug`**, and **`level_used`**.

**So: yes, successful generations that pass the daily check are saved as normal `Article` records** and appear in `GET /api/portal/membership/articles/`.

---

## 6. Frontend trigger (membership hub)

In `MembershipContentHub.tsx`:

- On the **Articles** tab, when loading the list (newest sort, no date filters, no title search), the client calls **`autoGenerateBrief` once per session** (guarded by a ref).
- That issues:

  ```http
  POST /api/portal/membership/generated-article/
  Content-Type: application/json

  {"category":"all","avoid_titles":[],"read_slugs":["..."]}
  ```

  **`read_slugs`** are read from **`localStorage`** (`src/lib/membership-read-history.ts`) when the member opens article detail pages.

- Then it loads articles as usual. If the daily limit already fired, the POST still succeeds but does not create a duplicate article for that day.

---

## 7. Related files (reference)

| Area | File(s) |
|------|---------|
| Generate endpoint + save | `backend/apps/membership/views.py` (`MembershipGeneratedArticleView`) |
| Weighted pick + state | `backend/apps/membership/generation.py`, `backend/apps/membership/keyword_levels.py` |
| Article list/detail | `backend/apps/membership/views.py` (`ArticleListView`, `ArticleDetailView`) |
| URLs | `backend/apps/membership/urls.py` |
| Keyword ingest / parse | `backend/apps/membership/keyword_dataset.py` |
| Admin dataset | `backend/apps/membership/admin.py` |
| OpenAI article JSON | `backend/api/services/openai_client.py` (`generate_membership_article`, `_normalize_membership_article`) |
| Prompts | `backend/api/services/prompts.py` (`MEMBERSHIP_ARTICLE_SYSTEM`, `MEMBERSHIP_KEYWORD_EXTRACTION_SYSTEM`) |
| Auto POST from UI | `Frontend-Dashboard/src/components/membership/MembershipContentHub.tsx` |

---

## 8. Operational checklist

1. Create/upload an **`ArticleKeywordDataset`**, ensure **`rows`** are populated and **`is_active`** is checked.  
2. Set **`OPENAI_API_KEY`** (and optionally `OPENAI_MODEL`) on the backend for generation (and for unstructured keyword extraction if you use PDF/DOCX without CSV-style data).  
3. Expect **at most one new operator-brief article per local calendar day** per the current daily guard.  
4. Articles are **normal `Article` records**; remove or edit them in Django admin or via your usual content tools.
