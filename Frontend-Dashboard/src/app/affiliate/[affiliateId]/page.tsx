import { Suspense } from "react";
import { ReferralLanding } from "@/components/affiliate/ReferralLanding";

export default function AffiliateReferralPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070707] p-8 text-center text-white/60">Loading…</div>}>
      <ReferralLanding />
    </Suspense>
  );
}
