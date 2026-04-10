# Mega mission (bonus track) — video upload limits

This describes **admin-reviewed bonus tasks** (“Mega mission” / **Admin review** in the Syndicate dashboard): live **Record video**, **Choose file**, written response, and **Submit for admin review**.

## What is actually limited in code

| Limit | Value | Where |
|--------|--------|--------|
| **Maximum attachment size** | **50 MB** per submission | Backend: `ADMIN_TASK_MAX_ATTACHMENT_BYTES` in `Backend/apps/challenges/views.py`; UI copy mentions “max 50MB attachment”. |
| **Maximum video length (minutes)** | **Not set** | There is **no** `max_duration` or timer that stops recording. You stop when you tap **Stop recording**. |
| **Written response** | **Required** — at least **3 characters** | Same API as the attachment check. |

So: **there is no fixed “X minutes” cap** in the app. The practical ceiling is whatever fits in **one file under 50 MB** and what your browser/device can record or upload reliably.

## How “minutes” relate to 50 MB (rough guide only)

Length in **minutes** is **not** fixed because file size depends on **resolution, codec, bitrate, and content** (motion, light).

Very rough order-of-magnitude (not a guarantee):

- At about **1 Mbps** average video bitrate, **50 MB** is on the order of **~7 minutes** of video.
- At about **0.5 Mbps**, on the order of **~13 minutes**.
- **High quality / 1080p / high motion** clips use more MB per minute, so the same 50 MB might only cover **a few minutes**.

If your file is **over 50 MB**, the API returns **400** with a message like attachment too large — shorten the recording, lower quality, or compress before upload.

## In-browser recording vs file upload

- **Record video**: Records until you press **Stop**; the result is a `.webm` (or `.mp4` where supported) and must still be **≤ 50 MB** when submitted.
- **Choose file**: Same **50 MB** limit applies to the file you pick.

## Server / deployment (operators)

- The **50 MB** check is enforced in the **admin task submit** view after the upload is received.
- If uploads fail **before** Django (e.g. proxy or platform body size), increase the limit there to at least **50 MB** and align with Django settings (e.g. `DATA_UPLOAD_MAX_MB` / request size limits in `Backend/syndicate_backend/settings.py` and your host’s reverse proxy).

## Related doc

- High-level Syndicate flow: `SYNDICATE_SYSTEM_OVERVIEW.md`.
