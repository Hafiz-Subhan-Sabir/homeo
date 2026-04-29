import type {
  AffiliateFunnelResponse,
  AffiliateStats,
  AffiliateVisitorsResponse,
  RecentReferralsResponse
} from "@/lib/affiliateTypes";
import { getSyndicateApiBase } from "@/lib/syndicateApiBase";

/**
 * Affiliate API lives on Django (`/api/track/...`, `/api/affiliate/auth/...`).
 * In the browser, use same-origin `/api/...` so Next.js rewrites forward to Django (see next.config.js).
 * Override with NEXT_PUBLIC_AFFILIATE_API_BASE_URL only for a separate tracking server.
 */
function affiliateApiRoot(): string {
  const override = (process.env.NEXT_PUBLIC_AFFILIATE_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
  if (override) {
    return override.endsWith("/api") ? override : `${override}/api`;
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin.replace(/\/+$/, "")}/api`;
  }
  return getSyndicateApiBase();
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    let message = "Request failed";
    try {
      const body = JSON.parse(text) as { error?: string; detail?: string };
      message = (typeof body?.error === "string" && body.error) || (typeof body?.detail === "string" && body.detail) || message;
    } catch {
      if (res.status === 404 && text.includes("<!DOCTYPE")) {
        message =
          "API route not found (404). Restart Next.js after next.config changes, run Django on BACKEND_INTERNAL_URL, and ensure /api/affiliate is proxied.";
      } else if (res.status === 404) {
        message = "Not found (404).";
      }
    }
    throw new Error(message);
  }
  return JSON.parse(text) as T;
}

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("affiliate_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const root = () => affiliateApiRoot();

export async function getAffiliateStats(affiliateId: string): Promise<AffiliateStats> {
  const res = await fetch(
    `${root()}/track/stats?affiliate_id=${encodeURIComponent(affiliateId)}`,
    { cache: "no-store", headers: authHeaders() }
  );
  return parseJson<AffiliateStats>(res);
}

export async function getAffiliateVisitors(affiliateId: string, limit = 20): Promise<AffiliateVisitorsResponse> {
  const res = await fetch(
    `${root()}/track/affiliate-visitors?affiliate_id=${encodeURIComponent(affiliateId)}&limit=${limit}`,
    { cache: "no-store", headers: authHeaders() }
  );
  return parseJson<AffiliateVisitorsResponse>(res);
}

export async function getAffiliateFunnel(affiliateId: string): Promise<AffiliateFunnelResponse> {
  const res = await fetch(
    `${root()}/track/funnel?affiliate_id=${encodeURIComponent(affiliateId)}`,
    { cache: "no-store", headers: authHeaders() }
  );
  return parseJson<AffiliateFunnelResponse>(res);
}

export async function getRecentReferrals(affiliateId: string, limit = 10): Promise<RecentReferralsResponse> {
  const res = await fetch(
    `${root()}/track/recent-referrals?affiliate_id=${encodeURIComponent(affiliateId)}&limit=${limit}`,
    { cache: "no-store", headers: authHeaders() }
  );
  return parseJson<RecentReferralsResponse>(res);
}

export async function trackClick(affiliateId: string, visitorId: string) {
  const res = await fetch(`${root()}/track/click`, {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ affiliate_id: affiliateId, visitor_id: visitorId })
  });
  return parseJson<{ success: boolean }>(res);
}

export async function trackLead(affiliateId: string, visitorId: string, email: string) {
  const res = await fetch(`${root()}/track/lead`, {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ affiliate_id: affiliateId, visitor_id: visitorId, email })
  });
  return parseJson<{ success: boolean }>(res);
}

export async function trackSale(
  affiliateId: string,
  visitorId: string,
  email: string,
  amount: string,
  extras?: { purchase_amount?: string; commission_rate?: number; offer?: string; tier?: string; program?: string }
) {
  const res = await fetch(`${root()}/track/sale`, {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      affiliate_id: affiliateId,
      visitor_id: visitorId,
      email,
      amount,
      ...extras,
    })
  });
  return parseJson<{ success: boolean }>(res);
}
