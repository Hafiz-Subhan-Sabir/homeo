"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AffiliatePortal from "@/components/affiliate/AffiliatePortal";
import { readStoredAffiliateReferralIds } from "@/lib/affiliateReferralIds";
import {
  AFFILIATE_LOGIN_HREF,
  clearAffiliateSession,
  hasAffiliateSession,
  readAffiliateUserDisplayName,
} from "@/lib/affiliateSession";

export default function AffiliatePortalPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [displayName, setDisplayName] = useState("Affiliate");
  const [referralIds, setReferralIds] = useState(() => readStoredAffiliateReferralIds());

  useEffect(() => {
    if (!hasAffiliateSession()) {
      router.replace(AFFILIATE_LOGIN_HREF);
      return;
    }
    const ids = readStoredAffiliateReferralIds();
    if (!ids?.complete?.trim()) {
      clearAffiliateSession();
      router.replace(AFFILIATE_LOGIN_HREF);
      return;
    }
    setDisplayName(readAffiliateUserDisplayName());
    setReferralIds(ids);
    setReady(true);
  }, [router]);

  function handleLogout() {
    clearAffiliateSession();
    router.replace(AFFILIATE_LOGIN_HREF);
  }

  if (!ready || !referralIds?.complete) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#090909] px-4 text-center text-sm font-semibold uppercase tracking-[0.14em] text-white/70">
        Loading partner dashboard…
      </div>
    );
  }

  return (
    <AffiliatePortal
      displayName={displayName}
      referralIds={referralIds}
      onLogout={handleLogout}
      embedded={false}
    />
  );
}
