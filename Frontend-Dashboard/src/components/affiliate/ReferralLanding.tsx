"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { trackClick, trackLead, trackSale } from "@/lib/affiliateApi";
import {
  resolveAffiliateDestination,
  saveAffiliateAttribution,
} from "@/lib/affiliateAttribution";

function getVisitorId(): string {
  const key = "affiliate_test_visitor_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const id = `v-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(key, id);
  return id;
}

export function ReferralLanding() {
  const params = useParams<{ affiliateId: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const [visitorId, setVisitorId] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const affiliateId = decodeURIComponent(params?.affiliateId ?? "");
  const offer = search.get("offer") ?? "affiliate-offer";
  const tier = search.get("tier") ?? undefined;
  const program = search.get("program") ?? undefined;

  const contextText = useMemo(() => {
    return offer.replace(/-/g, " ");
  }, [offer]);

  useEffect(() => {
    let isCancelled = false;
    const vid = getVisitorId();
    setVisitorId(vid);
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
        if (!isCancelled) setMessage("Click tracked for this visitor.");
      } catch {
        if (!isCancelled) setMessage("Could not auto-track click.");
      } finally {
        if (!isCancelled) {
          router.replace(destination);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [affiliateId, offer, program, router, tier]);

  async function submitLead() {
    if (!email.trim()) return setMessage("Enter email first.");
    try {
      await trackLead(affiliateId, visitorId, email.trim());
      setMessage("Lead tracked. Open Affiliate Portal in the dashboard and press Sync Core.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Lead tracking failed.");
    }
  }

  async function submitSale() {
    if (!email.trim() || !amount.trim()) return setMessage("Enter email and amount.");
    try {
      await trackSale(affiliateId, visitorId, email.trim(), amount.trim());
      setMessage("Sale tracked. Earnings update after Sync Core in the portal.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Sale tracking failed.");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#070707] px-4 py-8 text-white">
      <div className="cut-frame cyber-frame glass-dark premium-gold-border gold-stroke w-full max-w-2xl p-6">
        <h1 className="text-3xl font-black uppercase tracking-[0.08em] text-[#f8d878]">The Syndicate Offer</h1>
        <p className="mt-1 text-sm text-white/75">You opened: {contextText}</p>

        <div className="mt-4 rounded border border-[rgba(255,215,0,0.35)] bg-black/45 px-3 py-2 text-sm">
          <div className="text-white/65">Affiliate ID</div>
          <div className="font-bold text-[#f8d778]">{affiliateId}</div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            value={visitorId}
            readOnly
            className="cut-frame-sm border border-[rgba(255,215,0,0.35)] bg-black/60 px-3 py-2 text-sm outline-none"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email for lead/sale"
            className="cut-frame-sm focus-ring-gold border border-[rgba(255,215,0,0.35)] bg-black/60 px-3 py-2 text-sm outline-none"
          />
        </div>

        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="sale amount"
            className="cut-frame-sm focus-ring-gold border border-[rgba(255,215,0,0.35)] bg-black/60 px-3 py-2 text-sm outline-none"
          />
          <button
            type="button"
            onClick={submitLead}
            className="cut-frame-sm hud-hover-glow btn-cyan px-4 py-2 text-xs font-black uppercase tracking-[0.14em]"
          >
            Submit Lead
          </button>
          <button
            type="button"
            onClick={submitSale}
            className="cut-frame-sm hud-hover-glow btn-green px-4 py-2 text-xs font-black uppercase tracking-[0.14em]"
          >
            Submit Sale
          </button>
        </div>

        {message ? <div className="mt-3 text-sm text-[#bfefff]">{message}</div> : null}
      </div>
    </div>
  );
}
