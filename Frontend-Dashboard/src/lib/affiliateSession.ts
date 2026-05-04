import {
  AFFILIATE_REFERRAL_IDS_STORAGE_KEY,
  type StoredAffiliateReferralIds,
} from "@/lib/affiliateReferralIds";

export const AFFILIATE_TOKEN_KEY = "affiliate_token";
export const AFFILIATE_USER_KEY = "affiliate_user";

export const AFFILIATE_LOGIN_HREF = "/affiliate-login";
export const AFFILIATE_PORTAL_HREF = "/affiliate-portal";

export function affiliateVerifyHref(email: string): string {
  return `/affiliate-login/verify?email=${encodeURIComponent(email)}`;
}

export function mapApiReferralIdsToStored(
  refs: Record<string, string> | null | undefined,
): StoredAffiliateReferralIds | null {
  if (!refs || typeof refs !== "object") return null;
  const complete = String(refs.complete ?? "").trim();
  if (!complete) return null;
  const single = String(refs.single ?? "").trim() || complete;
  const pawn = String(refs.pawn ?? "").trim() || single;
  const king =
    String(refs.king ?? "").trim() ||
    String((refs as { exclusive?: string }).exclusive ?? "").trim() ||
    complete;
  return { complete, single, pawn, king };
}

export function readAffiliateUserDisplayName(): string {
  if (typeof window === "undefined") return "Affiliate";
  try {
    const raw = window.localStorage.getItem(AFFILIATE_USER_KEY);
    if (!raw) return "Affiliate";
    const j = JSON.parse(raw) as { displayName?: string; email?: string };
    const d = typeof j.displayName === "string" ? j.displayName.trim() : "";
    if (d) return d;
    const em = typeof j.email === "string" ? j.email.trim() : "";
    if (em.includes("@")) return em.split("@")[0] || "Affiliate";
    return "Affiliate";
  } catch {
    return "Affiliate";
  }
}

export function persistAffiliateSession(
  token: string,
  user: { display_name?: string; email: string; referral_ids?: Record<string, string> },
): void {
  if (typeof window === "undefined") return;
  const t = token.trim();
  if (!t) return;
  window.localStorage.setItem(AFFILIATE_TOKEN_KEY, t);
  const email = String(user.email || "").trim();
  window.localStorage.setItem(
    AFFILIATE_USER_KEY,
    JSON.stringify({
      displayName: String(user.display_name || "").trim(),
      email,
    }),
  );
  const stored = mapApiReferralIdsToStored(user.referral_ids);
  if (stored) {
    window.localStorage.setItem(AFFILIATE_REFERRAL_IDS_STORAGE_KEY, JSON.stringify(stored));
  }
}

export function clearAffiliateSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AFFILIATE_TOKEN_KEY);
  window.localStorage.removeItem(AFFILIATE_USER_KEY);
  window.localStorage.removeItem(AFFILIATE_REFERRAL_IDS_STORAGE_KEY);
}

export function hasAffiliateSession(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(AFFILIATE_TOKEN_KEY)?.trim());
}

export function affiliateAuthPostUrl(path: "request-otp" | "verify-otp"): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin.replace(/\/+$/, "") : "";
  return `${origin}/api/affiliate/auth/${path}/`;
}
