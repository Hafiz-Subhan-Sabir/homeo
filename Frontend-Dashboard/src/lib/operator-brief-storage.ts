/** Session-persisted operator briefs (AI-generated; not stored on the server). */

export type StoredOperatorBrief = {
  title: string;
  key_points: string[];
  paragraphs: string[];
  keyword_used?: string;
  category_used?: string;
  /** Persisted membership Article slug (server) when generation saved to DB. */
  article_slug?: string;
  savedAt: string;
};

const KEY_PREFIX = "syndicate_operator_brief_";
const INDEX_KEY = "syndicate_operator_brief_ids";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveOperatorBrief(payload: Omit<StoredOperatorBrief, "savedAt">): string {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
  const full: StoredOperatorBrief = {
    ...payload,
    savedAt: new Date().toISOString()
  };
  if (typeof sessionStorage === "undefined") return id;
  sessionStorage.setItem(KEY_PREFIX + id, JSON.stringify(full));
  const ids = safeParse<string[]>(sessionStorage.getItem(INDEX_KEY)) ?? [];
  ids.unshift(id);
  sessionStorage.setItem(INDEX_KEY, JSON.stringify(ids.slice(0, 40)));
  return id;
}

export function loadOperatorBrief(id: string): StoredOperatorBrief | null {
  if (typeof sessionStorage === "undefined") return null;
  return safeParse<StoredOperatorBrief>(sessionStorage.getItem(KEY_PREFIX + id));
}

export function getLatestOperatorBriefMeta(): {
  id: string;
  title: string;
  excerpt: string;
  article_slug?: string;
} | null {
  if (typeof sessionStorage === "undefined") return null;
  const ids = safeParse<string[]>(sessionStorage.getItem(INDEX_KEY));
  if (!ids?.length) return null;
  const first = loadOperatorBrief(ids[0]);
  if (!first) return null;
  const excerpt =
    (first.key_points || []).find((p) => p?.trim()) ||
    (first.paragraphs || []).find((p) => p?.trim()) ||
    "";
  return {
    id: ids[0],
    title: first.title || "Operator brief",
    excerpt: excerpt.trim().slice(0, 160),
    article_slug: first.article_slug
  };
}
