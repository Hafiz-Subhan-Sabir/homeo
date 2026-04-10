export const SYNDICATE_AUTH_USER_KEY = "syndicate:auth_user_v1";
export const SYNDICATE_AUTH_SESSION_KEY = "syndicate:auth_session_until_v1";
export const SYNDICATE_AUTH_TOKEN_KEY = "syndicate:auth_token_v1";
export const SYNDICATE_USER_ID_KEY = "syndicate:auth_user_id_v1";

export type SyndicateAuthUser = {
  name: string;
  email: string;
};

const SESSION_DAYS = 7;

function sessionUntilMs(): number {
  return Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
}

export function getSyndicateUser(): SyndicateAuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SYNDICATE_AUTH_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SyndicateAuthUser>;
    const email = String(parsed.email ?? "").trim().toLowerCase();
    if (!email) return null;
    const name = String(parsed.name ?? "").trim();
    return { name: name || email, email };
  } catch {
    return null;
  }
}

export function isSyndicateSessionActive(): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(SYNDICATE_AUTH_SESSION_KEY);
  const until = raw ? Number(raw) : 0;
  if (!Number.isFinite(until) || until <= Date.now()) return false;
  return getSyndicateUser() !== null && !!getSyndicateAuthToken();
}

export function getSyndicateUserId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SYNDICATE_USER_ID_KEY);
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Deterministic avatar per logged-in account (matches leaderboard seed style). */
export function getSyndicateProfileAvatarUrl(): string {
  const u = getSyndicateUser();
  const id = getSyndicateUserId();
  const raw = (u?.email || "").trim().toLowerCase();
  const seed = encodeURIComponent(`u${id ?? 0}-${raw || "anon"}`);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

export function setSyndicateUserId(id: number) {
  if (typeof window === "undefined") return;
  if (!Number.isFinite(id) || id <= 0) return;
  window.localStorage.setItem(SYNDICATE_USER_ID_KEY, String(Math.floor(id)));
}

export function createSyndicateSession(user: SyndicateAuthUser, token: string, userId: number) {
  if (typeof window === "undefined") return;
  const email = user.email.trim().toLowerCase();
  const safeUser = { name: (user.name.trim() || email), email };
  window.localStorage.setItem(SYNDICATE_AUTH_USER_KEY, JSON.stringify(safeUser));
  window.localStorage.setItem(SYNDICATE_AUTH_SESSION_KEY, String(sessionUntilMs()));
  window.localStorage.setItem(SYNDICATE_AUTH_TOKEN_KEY, token);
  setSyndicateUserId(userId);
  // Display name is also namespaced via syndicateUserStorageKey in the panel; keep legacy key cleared
  window.localStorage.removeItem("syndicate:display_name");
}

export function getSyndicateAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  const t = (window.localStorage.getItem(SYNDICATE_AUTH_TOKEN_KEY) || "").trim();
  return t || null;
}

export function getSyndicateAuthHeaders(contentTypeJson = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (contentTypeJson) headers["Content-Type"] = "application/json";
  const token = getSyndicateAuthToken();
  if (token) headers.Authorization = `Token ${token}`;
  return headers;
}

/** Clears Syndicate login session (email + expiry). */
export function logoutSyndicateSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SYNDICATE_AUTH_SESSION_KEY);
  window.localStorage.removeItem(SYNDICATE_AUTH_USER_KEY);
  window.localStorage.removeItem(SYNDICATE_AUTH_TOKEN_KEY);
  window.localStorage.removeItem(SYNDICATE_USER_ID_KEY);
}
