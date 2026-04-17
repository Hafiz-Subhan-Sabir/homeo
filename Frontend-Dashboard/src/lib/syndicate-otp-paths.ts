/**
 * URL prefix for the OTP + Stripe member onboarding UI (merged from the old `frontend/` app).
 * Defaults to `/syndicate-otp` so it does not replace the dashboard email/password routes at `/login` and `/signup`.
 */
export function syndicateOtpUiBase(): string {
  return (process.env.NEXT_PUBLIC_SYNDICATE_OTP_UI_BASE || "/syndicate-otp").replace(/\/$/, "");
}

export function syndicateOtpLoginHref(prefillEmail = ""): string {
  const b = syndicateOtpUiBase();
  return prefillEmail ? `${b}/login?email=${encodeURIComponent(prefillEmail)}` : `${b}/login`;
}

export function syndicateOtpSignupHref(prefillEmail = ""): string {
  const b = syndicateOtpUiBase();
  return prefillEmail ? `${b}/signup?email=${encodeURIComponent(prefillEmail)}` : `${b}/signup`;
}

export function syndicateOtpVerifyHref(email: string, flow: "login" | "signup"): string {
  const b = syndicateOtpUiBase();
  return `${b}/verify-otp?email=${encodeURIComponent(email)}&flow=${flow}`;
}
