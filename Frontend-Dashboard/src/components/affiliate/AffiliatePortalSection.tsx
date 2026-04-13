"use client";

import { useCallback, useEffect, useState } from "react";
import AffiliatePortal from "./AffiliatePortal";
import { AffiliatePortalLoginForm } from "./AffiliatePortalLoginForm";
import type { AuthLoginResponse } from "@/lib/affiliateTypes";

const TOKEN_KEY = "affiliate_token";
const USER_KEY = "affiliate_user";

type StoredUser = AuthLoginResponse["user"];

export function AffiliatePortalSection() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const token = window.localStorage.getItem(TOKEN_KEY);
      const raw = window.localStorage.getItem(USER_KEY);
      if (token && raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const u = parsed as Record<string, unknown>;
          const referralIds = u.referral_ids;
          if (
            referralIds &&
            typeof referralIds === "object" &&
            typeof (referralIds as Record<string, unknown>).complete === "string"
          ) {
            setUser(u as StoredUser);
          }
        }
      }
    } catch {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    }
    setHydrated(true);
  }, []);

  const handleLoggedIn = useCallback((res: AuthLoginResponse) => {
    window.localStorage.setItem(TOKEN_KEY, res.token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
  }, []);

  const handleLogout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  if (!hydrated) {
    return (
      <section data-anim="in" className="mt-2 w-full min-w-0 shrink-0">
        <div className="cut-frame-sm border border-white/15 bg-black/35 p-8 text-center text-[13px] text-white/55">Loading…</div>
      </section>
    );
  }

  return (
    <section data-anim="in" className="mt-2 w-full min-w-0 shrink-0">
      <div className="syndicate-dystopia-enclosure syndicate-missions-shell cut-frame cyber-frame relative w-full overflow-hidden border border-[rgba(255,215,0,0.52)] bg-[#060606]/88 px-0 py-4 sm:py-6 [box-shadow:0_0_0_1px_rgba(255,215,0,0.30),0_0_18px_rgba(255,215,0,0.26),0_0_52px_rgba(255,215,0,0.14)]">
        <div className="syndicate-missions-shell-wash absolute inset-0 opacity-62 [background:radial-gradient(760px_220px_at_20%_0%,rgba(255,215,0,0.15),rgba(0,0,0,0)_65%)]" />
        <div className="absolute inset-0 opacity-30 [background:repeating-linear-gradient(0deg,rgba(255,255,255,0.015)_0px,rgba(255,255,255,0.015)_1px,transparent_8px,transparent_14px)]" />
        <div className="relative">
          {user ? (
            <AffiliatePortal
              embedded
              displayName={user.display_name}
              referralIds={user.referral_ids}
              onLogout={handleLogout}
            />
          ) : (
            <AffiliatePortalLoginForm onSuccess={handleLoggedIn} />
          )}
        </div>
      </div>
    </section>
  );
}
