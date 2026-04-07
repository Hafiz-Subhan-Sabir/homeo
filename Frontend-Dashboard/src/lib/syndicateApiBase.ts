/**
 * Django mounts REST under /api/. Env may be set to origin only on Railway — normalize so
 * auth and challenges hit /api/auth/..., /api/challenges/...
 */
export function getSyndicateApiBase(): string {
  let u = (process.env.NEXT_PUBLIC_SYNDICATE_API_URL ?? "").trim();
  if (!u) {
    u = "http://127.0.0.1:8000/api";
  }
  u = u.replace(/\/+$/, "");
  if (!u.endsWith("/api")) {
    u = `${u}/api`;
  }
  return u;
}

/** Turns generic browser "Failed to fetch" into a local-dev hint (Django URL + runserver). */
export function syndicateFetchFailureMessage(
  err: unknown,
  apiBase: string,
  fallback = "Request failed"
): string {
  const msg = err instanceof Error ? err.message : typeof err === "string" ? err : fallback;
  if (
    err instanceof TypeError ||
    /failed to fetch|networkerror|load failed|network request failed/i.test(msg)
  ) {
    return `Cannot reach ${apiBase}. For local testing, run Django from the Backend folder: python manage.py runserver 0.0.0.0:8000 (ensure NEXT_PUBLIC_SYNDICATE_API_URL matches, default http://127.0.0.1:8000/api).`;
  }
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}
