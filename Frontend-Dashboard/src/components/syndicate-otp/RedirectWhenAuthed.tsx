"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchPortalIdentity, hasSimpleAuthSessionClient, STORAGE_SIMPLE_AUTH } from "@/lib/portal-api";
import { AFFILIATE_REFERRAL_IDS_STORAGE_KEY } from "@/lib/affiliateReferralIds";
import { PROFILE_AVATAR_STORAGE_KEY, PROFILE_DISPLAY_NAME_KEY } from "@/lib/dashboardProfileStorage";
import { logoutSyndicateSession } from "@/lib/syndicateAuth";

/** Sends users who already have a session to the app so browser Back from `/` does not land on auth screens. */
export default function RedirectWhenAuthed() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!hasSimpleAuthSessionClient()) return;
      const identity = await fetchPortalIdentity().catch(() => null);
      if (cancelled) return;
      if (identity) {
        const rawNext = (searchParams.get("next") || "").trim();
        const safeNext =
          rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";
        router.replace(safeNext);
        return;
      }
      try {
        window.localStorage.removeItem(STORAGE_SIMPLE_AUTH);
        window.localStorage.removeItem(PROFILE_DISPLAY_NAME_KEY);
        window.localStorage.removeItem(PROFILE_AVATAR_STORAGE_KEY);
        window.localStorage.removeItem(AFFILIATE_REFERRAL_IDS_STORAGE_KEY);
        logoutSyndicateSession();
      } catch {
        /* ignore */
      }
      document.cookie = "simple_auth_session=; path=/; max-age=0; samesite=lax";
    })();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);
  return null;
}
