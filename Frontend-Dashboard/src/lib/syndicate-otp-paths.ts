/**
 * URL prefix for the OTP + Stripe member onboarding UI.
 * Defaults to the root auth routes (`/login`, `/signup`, `/verify-otp`).
 * Set NEXT_PUBLIC_SYNDICATE_OTP_UI_BASE=/syndicate-otp if you want to keep it namespaced.
 */
export function syndicateOtpUiBase(): string {
  return (process.env.NEXT_PUBLIC_SYNDICATE_OTP_UI_BASE || "").replace(/\/$/, "");
}

export function syndicateOtpLoginHref(prefillEmail = "", next = ""): string {
  const params = new URLSearchParams();
  if (prefillEmail) params.set("email", prefillEmail);
  if (next) params.set("next", next);
  const q = params.toString();
  return q ? `/login?${q}` : "/login";
}

export function syndicateOtpSignupHref(prefillEmail = ""): string {
  const b = syndicateOtpUiBase();
  return prefillEmail ? `${b}/signup?email=${encodeURIComponent(prefillEmail)}` : `${b}/signup`;
}

export function syndicateOtpVerifyHref(email: string, flow: "login" | "signup", next = ""): string {
  const b = syndicateOtpUiBase();
  const params = new URLSearchParams();
  params.set("email", email);
  params.set("flow", flow);
  if (next) params.set("next", next);
  return `${b}/verify-otp?${params.toString()}`;
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function isSameAppHost(apiHostname: string, pageHostname: string): boolean {
  if (apiHostname === pageHostname) return true;
  return LOOPBACK_HOSTS.has(apiHostname) && LOOPBACK_HOSTS.has(pageHostname);
}

/**
 * Django returns `POST_LOGIN_REDIRECT_URL` as-is (often `https://localhost:3000/`) while
 * `next dev` is `http://localhost:3000`. A cross-scheme jump drops the session cookie and
 * can load a blank page. When the redirect targets this app on the same host, keep the
 * current origin (scheme + host + port).
 */
export function resolvePostOtpAppRedirect(redirectFromApi: string | undefined): string {
  if (typeof window === "undefined") return "/dashboard";
  const origin = window.location.origin;
  const pageHost = window.location.hostname;
  const trimmed = (redirectFromApi ?? "").trim();
  if (!trimmed) return `${origin}/dashboard`;
  try {
    const target = new URL(trimmed);
    if (!isSameAppHost(target.hostname, pageHost)) return target.href;
    const path = target.pathname === "/" ? "/dashboard" : target.pathname || "/dashboard";
    return `${origin}${path}${target.search}${target.hash}`;
  } catch {
    return `${origin}/dashboard`;
  }
}
