"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { trackClick } from "@/lib/affiliateApi";
import {
  resolveAffiliateDestination,
  saveAffiliateAttribution,
} from "@/lib/affiliateAttribution";

function getVisitorId(): string {
  // Generate a fresh visitor id per referral-link visit so one referral link
  // can track multiple distinct visitors correctly.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `v-${crypto.randomUUID()}`;
  }
  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ReferralLanding() {
  const params = useParams<{ affiliateId: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const affiliateId = decodeURIComponent(params?.affiliateId ?? "");
  const offer = search.get("offer") ?? "affiliate-offer";
  const tier = search.get("tier") ?? undefined;
  const program = search.get("program") ?? undefined;

  useEffect(() => {
    let isCancelled = false;
    const vid = getVisitorId();
    saveAffiliateAttribution({
      affiliateId,
      visitorId: vid,
      offer,
      tier,
      program,
    });
    const destination = resolveAffiliateDestination(offer);

    (async () => {
      try {
        await trackClick(affiliateId, vid);
      } catch {}
      if (!isCancelled) {
        router.replace(destination);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [affiliateId, offer, program, router, tier]);

  return null;
}
