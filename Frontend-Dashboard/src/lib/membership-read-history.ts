const STORAGE_KEY = "syndicate:membership-read-slugs";
const MAX_SLUGS = 40;

export function recordMembershipArticleRead(slug: string): void {
  if (typeof window === "undefined" || !slug?.trim()) return;
  try {
    const cur = getMembershipReadSlugs();
    const next = [slug.trim(), ...cur.filter((s) => s !== slug.trim())].slice(0, MAX_SLUGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
}

export function getMembershipReadSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(String).map((s) => s.trim()).filter(Boolean).slice(0, MAX_SLUGS);
  } catch {
    return [];
  }
}
