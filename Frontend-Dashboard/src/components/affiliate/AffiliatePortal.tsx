"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getAffiliateFunnel,
  getAffiliateStats,
  getAffiliateVisitors,
  getRecentReferrals
} from "@/lib/affiliateApi";
import type { AffiliateStats, AffiliateVisitor } from "@/lib/affiliateTypes";

type ProgramKind = "complete" | "single" | "pawn" | "king";
type ToastTone = "good" | "warn" | "bad" | "info";

function formatWhen(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function formatAgo(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const diff = Date.now() - d.getTime();
  const sec = Math.max(0, Math.floor(diff / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

type ReferralIds = {
  complete: string;
  single: string;
  pawn: string;
  king: string;
  exclusive?: string;
};

type AffiliatePortalProps = {
  displayName?: string;
  referralIds?: ReferralIds;
  onLogout?: () => void;
  /** When true, fits inside the main dashboard shell (sidebar layout) instead of a standalone full viewport page. */
  embedded?: boolean;
};

export default function AffiliatePortal({ displayName, referralIds, onLogout, embedded = false }: AffiliatePortalProps) {
  const [affiliateId, setAffiliateId] = useState(() => referralIds?.complete?.trim() || "subhan-x91");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [visitors, setVisitors] = useState<AffiliateVisitor[]>([]);
  const [funnel, setFunnel] = useState<Array<{ stage: string; value: number }>>([]);
  const [funnelHover, setFunnelHover] = useState<{ stage: string; value: number } | null>(null);
  const [recentReferrals, setRecentReferrals] = useState<Array<{ visitor_id: string; status: "joined" | "purchased"; at: string | null }>>([]);
  const [programKind, setProgramKind] = useState<ProgramKind>("complete");
  const [generatedLinks, setGeneratedLinks] = useState<Record<ProgramKind, string>>({
    complete: "",
    single: "",
    pawn: "",
    king: "",
  });
  const [showProgramOptions, setShowProgramOptions] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const overallStats = useMemo(() => {
    if (!stats) return null;
    return (
      stats.overall ?? {
        click_count: stats.click_count ?? 0,
        lead_count: stats.lead_count ?? 0,
        sale_count: stats.sale_count ?? 0,
        conversion_rate: stats.click_count
          ? Math.round(
              ((((stats.lead_count ?? 0) / stats.click_count) + ((stats.sale_count ?? 0) / stats.click_count)) / 2) * 100
            )
          : 0,
        point_total: stats.point_total ?? 0,
        earnings_total: stats.earnings_total ?? "0.00",
        last_click_at: stats.last_click_at ?? null,
        last_lead_at: stats.last_lead_at ?? null,
        last_sale_at: stats.last_sale_at ?? null,
        lead_emails: stats.lead_emails ?? [],
      }
    );
  }, [stats]);

  const conversionRate = useMemo(() => {
    if (!overallStats) return 0;
    return Math.min(100, Math.max(0, Math.round(overallStats.conversion_rate ?? 0)));
  }, [overallStats]);

  const dashboardSignal = useMemo(() => {
    const clicks = overallStats?.click_count ?? 0;
    const leads = overallStats?.lead_count ?? 0;
    const sales = overallStats?.sale_count ?? 0;
    const earnings = Number(overallStats?.earnings_total ?? "0") || 0;

    if (earnings >= 200) return { label: "High Momentum", tone: "good" as const };
    if (earnings > 0) return { label: "Revenue Live", tone: "good" as const };
    if (clicks > 0 && leads > 0 && sales === 0) return { label: "Effort Mode", tone: "warn" as const };
    return { label: "Cold Start", tone: "bad" as const };
  }, [overallStats]);
  const earningsValue = Number(overallStats?.earnings_total ?? "0") || 0;
  const earningsCardToneClass =
    earningsValue <= 0
      ? "border-red-400/85 bg-[linear-gradient(180deg,rgba(255,59,59,0.14),rgba(0,0,0,0.3))] shadow-[0_0_0_1px_rgba(248,113,113,0.9),0_0_22px_rgba(248,113,113,0.86),0_0_56px_rgba(248,113,113,0.72),0_0_108px_rgba(248,113,113,0.56),inset_0_0_20px_rgba(248,113,113,0.27)]"
      : earningsValue < 100
        ? "border-amber-300/85 bg-[linear-gradient(180deg,rgba(255,215,0,0.14),rgba(0,0,0,0.3))] shadow-[0_0_0_1px_rgba(252,211,77,0.9),0_0_22px_rgba(252,211,77,0.86),0_0_56px_rgba(252,211,77,0.72),0_0_108px_rgba(252,211,77,0.56),inset_0_0_20px_rgba(252,211,77,0.27)]"
        : "border-lime-300/85 bg-[linear-gradient(180deg,rgba(0,255,122,0.14),rgba(0,0,0,0.3))] shadow-[0_0_0_1px_rgba(163,230,53,0.9),0_0_22px_rgba(163,230,53,0.86),0_0_56px_rgba(163,230,53,0.72),0_0_108px_rgba(163,230,53,0.56),inset_0_0_20px_rgba(163,230,53,0.27)]";

  const [conversionRing, setConversionRing] = useState(0);
  useEffect(() => {
    const c = referralIds?.complete?.trim();
    if (c) setAffiliateId(c);
  }, [referralIds?.complete, referralIds?.single, referralIds?.pawn, referralIds?.king, referralIds?.exclusive]);

  useEffect(() => {
    // Smoothly animate ring to new value.
    setConversionRing(0);
    const t = window.setTimeout(() => setConversionRing(conversionRate), 120);
    return () => window.clearTimeout(t);
  }, [conversionRate]);

  useEffect(() => {}, [displayName]);

  const linkTemplateMap = useMemo<Record<ProgramKind, string>>(() => {
    const base = "http://localhost:3000";
    const completeId = encodeURIComponent((referralIds?.complete ?? affiliateId).trim() || "affiliate");
    const singleId = encodeURIComponent((referralIds?.single ?? affiliateId).trim() || "affiliate");
    const pawnId = encodeURIComponent((referralIds?.pawn ?? referralIds?.single ?? affiliateId).trim() || "affiliate");
    const kingId = encodeURIComponent((referralIds?.king ?? referralIds?.exclusive ?? affiliateId).trim() || "affiliate");
    return {
      complete: `${base}/affiliate/${completeId}?offer=fullbundle`,
      single: `${base}/affiliate/${singleId}?offer=singleprogram`,
      pawn: `${base}/affiliate/${pawnId}?offer=thepawn`,
      king: `${base}/affiliate/${kingId}?offer=theking`,
    };
  }, [affiliateId, referralIds]);
  const activeReferralLink = generatedLinks[programKind];

  function showToast(_message: string, _tone: ToastTone = "info") {}

  useEffect(() => {
    if (!referralIds) return;
    const next = referralIds[programKind];
    if (next) setAffiliateId(next);
  }, [programKind, referralIds]);

  function selectProgramAndGenerate(kind: ProgramKind) {
    const isExisting = Boolean(generatedLinks[kind]);
    setProgramKind(kind);
    setCopiedLink(null);
    setGeneratedLinks((prev) => {
      if (prev[kind]) return prev;
      return { ...prev, [kind]: linkTemplateMap[kind] };
    });
    showToast(
      isExisting ? `${kind.toUpperCase()} referral already generated.` : `${kind.toUpperCase()} referral generated.`,
      isExisting ? "warn" : "good",
    );
    setShowProgramOptions(false);
  }

  async function copyLink(link: string) {
    if (!link) {
      showToast("No referral link to copy yet.", "warn");
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(link);
      showToast("Referral copied.", "good");
      window.setTimeout(() => setCopiedLink(null), 900);
    } catch {
      setCopiedLink(null);
      showToast("Could not copy referral link.", "bad");
    }
  }

  async function shareLink(link: string) {
    if (!link) {
      showToast("No referral link to share yet.", "warn");
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({ title: "Referral link", text: "Join via my referral link", url: link });
        showToast("Referral shared.", "good");
      } else {
        await copyLink(link);
      }
    } catch {
      showToast("Share cancelled or failed.", "warn");
    }
  }

  const refreshData = useCallback(async (silent = false) => {
    if (!affiliateId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const [statsResult, visitorsResult, funnelResult, recentResult] = await Promise.all([
        getAffiliateStats(affiliateId.trim()),
        getAffiliateVisitors(affiliateId.trim(), 25),
        getAffiliateFunnel(affiliateId.trim()),
        getRecentReferrals(affiliateId.trim(), 8),
      ]);
      setStats(statsResult);
      setVisitors(visitorsResult.visitors);
      setFunnel(funnelResult.stages);
      setRecentReferrals(recentResult.items);
      if (!silent) showToast("Data loaded.", "good");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not fetch affiliate data.";
      if (/affiliate_id not found/i.test(message)) {
        setError("This referral ID is not on this server (new database or stale login). Log in again to refresh.");
        if (!silent) showToast("Affiliate session out of date — logging out.", "warn");
        window.setTimeout(() => onLogout?.(), 400);
        return;
      }
      if (message.toLowerCase().includes("failed to fetch")) {
        setError(
          "Failed to fetch. Run the unified Django backend (same service as Syndicate API), set NEXT_PUBLIC_SYNDICATE_API_URL, and ensure CORS allows this origin if you use a LAN IP."
        );
        if (!silent) showToast("Could not load data from backend.", "bad");
      } else {
        setError(message);
        if (!silent) showToast(message, "bad");
      }
    } finally {
      setLoading(false);
    }
  }, [affiliateId, onLogout]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      // Poll for latest backend stats so UI stays live without page reload.
      void refreshData(true);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [refreshData]);

  function handleLogout() {
    showToast("Logging out...", "warn");
    window.setTimeout(() => onLogout?.(), 320);
  }

  return (
    <div
      className={
        embedded
          ? "affiliate-portal-embed w-full bg-transparent p-0 text-white"
          : "font-thryon min-h-screen w-full bg-[#090909] p-3 text-white md:p-5"
      }
    >
      <main
        className={
          embedded
            ? "cut-frame glass-dark premium-gold-border gold-stroke mx-auto flex h-auto min-h-[min(58vh,560px)] max-h-[min(82vh,920px)] w-full max-w-none flex-col overflow-hidden p-4 sm:p-5"
            : "cut-frame glass-dark premium-gold-border gold-stroke mx-auto flex h-[calc(100vh-1.5rem)] w-full max-w-[1800px] flex-col overflow-hidden p-4 sm:h-[calc(100vh-2.5rem)] sm:p-5"
        }
      >
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-[#f7d774] drop-shadow-[0_0_12px_rgba(247,215,116,0.55)] sm:text-3xl">Affiliate Dashboard</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-black uppercase tracking-[0.18em] drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] ${
                dashboardSignal.tone === "good" ? "badge-live" : dashboardSignal.tone === "warn" ? "badge-warn" : "badge-danger"
              }`}
            >
              <span
                className={`inline-flex h-2.5 w-2.5 animate-pulse rounded-full ${
                  dashboardSignal.tone === "good"
                    ? "bg-[#00ff7a] shadow-[0_0_10px_rgba(0,255,122,0.85)]"
                    : dashboardSignal.tone === "warn"
                      ? "bg-[#ffd74d] shadow-[0_0_10px_rgba(212,175,55,0.8)]"
                      : "bg-[#ff3b3b] shadow-[0_0_10px_rgba(255,59,59,0.85)]"
                }`}
              />
              {dashboardSignal.label}
            </div>
            {onLogout ? (
              <button
                type="button"
                onClick={handleLogout}
                className="cut-frame-sm hud-hover-glow border border-[rgba(255,59,59,0.55)] bg-[linear-gradient(180deg,rgba(255,70,70,0.16),rgba(110,10,10,0.24))] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#ffd8d8]"
              >
                Logout
              </button>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto pr-1 pb-16 no-scrollbar">
          {error ? null : null}

          <div className="cut-frame-sm border border-cyan-300/75 bg-black/45 p-4 shadow-[0_0_0_1px_rgba(34,211,238,0.9),0_0_22px_rgba(34,211,238,0.86),0_0_56px_rgba(34,211,238,0.72),0_0_108px_rgba(34,211,238,0.56),inset_0_0_20px_rgba(34,211,238,0.27)]">
            <div className="mx-auto w-full max-w-[1720px] cut-frame-sm border border-violet-300/65 bg-black/30 p-3 shadow-[0_0_0_1px_rgba(193,120,255,0.9),0_0_22px_rgba(193,120,255,0.86),0_0_56px_rgba(193,120,255,0.72),0_0_108px_rgba(193,120,255,0.56),inset_0_0_20px_rgba(193,120,255,0.27)]">
              <div className="flex flex-col gap-2 md:flex-row md:items-end">
                <div className="flex-1">
                  <div className="mb-1 h-[25px] text-xs font-black uppercase tracking-[0.16em] text-white/80 drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]">Referral Link</div>
                  <input
                    value={activeReferralLink}
                    placeholder="Generate a referral link"
                    readOnly
                    className={`cut-frame-sm focus-ring-gold w-full border px-3 py-3 text-base font-semibold text-white/90 drop-shadow-[0_0_6px_rgba(255,255,255,0.2)] outline-none placeholder:text-white/35 ${
                      copiedLink === activeReferralLink && activeReferralLink
                        ? "border-[rgba(0,255,122,0.75)] bg-[rgba(0,60,30,0.5)] shadow-[0_0_16px_rgba(0,255,122,0.35)]"
                        : "border-[rgba(255,215,0,0.38)] bg-black/70"
                    }`}
                  />
                </div>
                {activeReferralLink ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowProgramOptions((prev) => !prev)}
                    className="cut-frame-sm hud-hover-glow border border-amber-300/80 bg-[linear-gradient(180deg,rgba(255,198,64,0.2),rgba(38,22,0,0.45))] px-4 py-2 text-sm font-black uppercase tracking-[0.16em] text-amber-100 shadow-[0_0_0_1px_rgba(255,198,64,0.7),0_0_24px_rgba(255,198,64,0.35)] transition duration-300 hover:scale-[1.02] hover:border-amber-200/95 hover:shadow-[0_0_0_1px_rgba(255,220,115,0.9),0_0_34px_rgba(255,210,90,0.5)]"
                    >
                      Get Referral
                    </button>
                    <button
                      type="button"
                      onClick={() => copyLink(activeReferralLink)}
                    className="cut-frame-sm hud-hover-glow border border-cyan-300/80 bg-[linear-gradient(180deg,rgba(56,236,255,0.2),rgba(0,24,34,0.45))] px-4 py-2 text-sm font-black uppercase tracking-[0.16em] text-cyan-100 shadow-[0_0_0_1px_rgba(56,236,255,0.7),0_0_24px_rgba(56,236,255,0.35)] transition duration-300 hover:scale-[1.02] hover:border-cyan-200/95 hover:shadow-[0_0_0_1px_rgba(130,245,255,0.9),0_0_34px_rgba(56,236,255,0.5)]"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => shareLink(activeReferralLink)}
                    className="cut-frame-sm hud-hover-glow border border-violet-300/80 bg-[linear-gradient(180deg,rgba(193,120,255,0.2),rgba(25,6,38,0.45))] px-4 py-2 text-sm font-black uppercase tracking-[0.16em] text-violet-100 shadow-[0_0_0_1px_rgba(193,120,255,0.7),0_0_24px_rgba(193,120,255,0.35)] transition duration-300 hover:scale-[1.02] hover:border-violet-200/95 hover:shadow-[0_0_0_1px_rgba(221,173,255,0.9),0_0_34px_rgba(193,120,255,0.5)]"
                    >
                      Share
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowProgramOptions((prev) => !prev)}
                    className="cut-frame-sm hud-hover-glow border border-amber-300/85 bg-[linear-gradient(180deg,rgba(255,198,64,0.22),rgba(38,22,0,0.5))] px-4 py-2 text-sm font-bold uppercase tracking-[0.14em] text-amber-100 shadow-[0_0_0_1px_rgba(255,198,64,0.72),0_0_26px_rgba(255,198,64,0.38)] transition duration-300 hover:scale-[1.02] hover:border-amber-200/95 hover:shadow-[0_0_0_1px_rgba(255,220,115,0.9),0_0_36px_rgba(255,210,90,0.52)]"
                  >
                    Get Referral
                  </button>
                )}
              </div>
            </div>

            {showProgramOptions ? (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <button
                  type="button"
                  onClick={() => selectProgramAndGenerate("complete")}
                  className={`cut-frame-sm border px-3 py-3 text-left text-[12px] font-black uppercase tracking-[0.16em] ${
                    programKind === "complete"
                      ? "border-amber-300/95 bg-amber-300/10 text-amber-100 shadow-[0_0_0_1px_rgba(255,198,64,0.85),0_0_26px_rgba(255,198,64,0.55),0_0_70px_rgba(255,198,64,0.24)]"
                      : "border-amber-300/55 bg-[linear-gradient(180deg,rgba(255,198,64,0.08),rgba(0,0,0,0.35))] text-amber-100/85 shadow-[0_0_16px_rgba(255,198,64,0.18)]"
                  }`}
                >
                  Full Bundle
                </button>
                <button
                  type="button"
                  onClick={() => selectProgramAndGenerate("single")}
                  className={`cut-frame-sm border px-3 py-3 text-left text-[12px] font-black uppercase tracking-[0.16em] ${
                    programKind === "single"
                      ? "border-cyan-300/95 bg-cyan-300/10 text-cyan-100 shadow-[0_0_0_1px_rgba(56,236,255,0.85),0_0_26px_rgba(56,236,255,0.55),0_0_70px_rgba(56,236,255,0.24)]"
                      : "border-cyan-300/55 bg-[linear-gradient(180deg,rgba(56,236,255,0.08),rgba(0,0,0,0.35))] text-cyan-100/85 shadow-[0_0_16px_rgba(56,236,255,0.18)]"
                  }`}
                >
                  Single Program
                </button>
                <button
                  type="button"
                  onClick={() => selectProgramAndGenerate("pawn")}
                  className={`cut-frame-sm border px-3 py-3 text-left text-[12px] font-black uppercase tracking-[0.16em] ${
                    programKind === "pawn"
                      ? "border-lime-300/95 bg-lime-300/10 text-lime-100 shadow-[0_0_0_1px_rgba(120,255,90,0.85),0_0_26px_rgba(120,255,90,0.55),0_0_70px_rgba(120,255,90,0.24)]"
                      : "border-lime-300/55 bg-[linear-gradient(180deg,rgba(120,255,90,0.08),rgba(0,0,0,0.35))] text-lime-100/85 shadow-[0_0_16px_rgba(120,255,90,0.18)]"
                  }`}
                >
                  The Pawn
                </button>
                <button
                  type="button"
                  onClick={() => selectProgramAndGenerate("king")}
                  className={`cut-frame-sm border px-3 py-3 text-left text-[12px] font-black uppercase tracking-[0.16em] ${
                    programKind === "king"
                      ? "border-violet-300/95 bg-violet-300/10 text-violet-100 shadow-[0_0_0_1px_rgba(193,120,255,0.85),0_0_26px_rgba(193,120,255,0.55),0_0_70px_rgba(193,120,255,0.24)]"
                      : "border-violet-300/55 bg-[linear-gradient(180deg,rgba(193,120,255,0.08),rgba(0,0,0,0.35))] text-violet-100/85 shadow-[0_0_16px_rgba(193,120,255,0.18)]"
                  }`}
                >
                  The King
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-4 cut-frame-sm border border-violet-300/75 bg-black/45 p-3 shadow-[0_0_0_1px_rgba(193,120,255,0.9),0_0_22px_rgba(193,120,255,0.86),0_0_56px_rgba(193,120,255,0.72),0_0_108px_rgba(193,120,255,0.56),inset_0_0_20px_rgba(193,120,255,0.27)] sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-sm font-black uppercase tracking-[0.2em] text-white/80 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Performance Snapshot</div>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
              {[
                { label: "Clicks", value: overallStats?.click_count ?? "-", tone: "border-cyan-300/75 bg-[linear-gradient(180deg,rgba(56,236,255,0.12),rgba(0,0,0,0.3))] shadow-[0_0_0_1px_rgba(34,211,238,0.9),0_0_22px_rgba(34,211,238,0.86),0_0_56px_rgba(34,211,238,0.72),0_0_108px_rgba(34,211,238,0.56),inset_0_0_20px_rgba(34,211,238,0.27)]" },
                { label: "Leads", value: overallStats?.lead_count ?? "-", tone: "border-violet-300/75 bg-[linear-gradient(180deg,rgba(193,120,255,0.12),rgba(0,0,0,0.3))] shadow-[0_0_0_1px_rgba(193,120,255,0.9),0_0_22px_rgba(193,120,255,0.86),0_0_56px_rgba(193,120,255,0.72),0_0_108px_rgba(193,120,255,0.56),inset_0_0_20px_rgba(193,120,255,0.27)]" },
                { label: "Sales", value: overallStats?.sale_count ?? 0, tone: "border-lime-300/75 bg-[linear-gradient(180deg,rgba(120,255,90,0.12),rgba(0,0,0,0.3))] shadow-[0_0_0_1px_rgba(163,230,53,0.9),0_0_22px_rgba(163,230,53,0.86),0_0_56px_rgba(163,230,53,0.72),0_0_108px_rgba(163,230,53,0.56),inset_0_0_20px_rgba(163,230,53,0.27)]" },
                { label: "Rate", value: `${conversionRing}%`, tone: "border-amber-300/75 bg-[linear-gradient(180deg,rgba(255,198,64,0.14),rgba(0,0,0,0.3))] shadow-[0_0_0_1px_rgba(252,211,77,0.9),0_0_22px_rgba(252,211,77,0.86),0_0_56px_rgba(252,211,77,0.72),0_0_108px_rgba(252,211,77,0.56),inset_0_0_20px_rgba(252,211,77,0.27)]" },
                { label: "Points", value: overallStats?.point_total ?? 0, tone: "border-fuchsia-300/75 bg-[linear-gradient(180deg,rgba(232,121,249,0.12),rgba(0,0,0,0.3))] shadow-[0_0_0_1px_rgba(232,121,249,0.9),0_0_22px_rgba(232,121,249,0.86),0_0_56px_rgba(232,121,249,0.72),0_0_108px_rgba(232,121,249,0.56),inset_0_0_20px_rgba(232,121,249,0.27)]" },
                { label: "Earnings", value: `$${overallStats?.earnings_total ?? "0.00"}`, tone: earningsCardToneClass },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`cut-frame-sm border px-3 py-2 ${item.tone ?? "border-[rgba(255,215,0,0.28)] bg-black/35"}`}
                >
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-white/68 drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]">{item.label}</div>
                  <div className="mt-1 text-2xl font-black text-[#f8d778] drop-shadow-[0_0_12px_rgba(248,215,120,0.5)]">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 relative cut-frame-sm border border-cyan-300/65 bg-black/30 p-3 shadow-[0_0_0_1px_rgba(34,211,238,0.9),0_0_22px_rgba(34,211,238,0.86),0_0_56px_rgba(34,211,238,0.72),0_0_108px_rgba(34,211,238,0.56),inset_0_0_20px_rgba(34,211,238,0.27)]">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-white/70 drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]">Revenue Flow</div>
              </div>
              <div className="grid grid-cols-[74px_1fr] gap-x-2 gap-y-2">
                {(funnel.length
                  ? funnel
                  : [
                      { stage: "Clicks", value: 0 },
                      { stage: "Leads", value: 0 },
                      { stage: "Conversions", value: 0 },
                    ]).map((row) => {
                  const max = Math.max(...(funnel.map((s) => s.value) || [0]), 1);
                  const pct = Math.max(2, Math.round((row.value / max) * 100));
                  return (
                    <div key={row.stage} className="contents">
                      <div className="pt-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white/72">{row.stage}</div>
                      <div className="relative overflow-visible pt-4">
                        <div className="h-7 rounded border border-cyan-300/25 bg-black/38" />
                        <div
                          className="absolute left-0 top-0 h-7 rounded bg-[linear-gradient(90deg,rgba(56,236,255,0.9),rgba(193,120,255,0.82),rgba(255,198,64,0.82))] shadow-[0_0_14px_rgba(56,236,255,0.24)] transition-[width] duration-500"
                          style={{ width: `${pct}%` }}
                          onMouseEnter={() => setFunnelHover(row)}
                          onMouseLeave={() => setFunnelHover(null)}
                        />
                        {funnelHover?.stage === row.stage ? (
                          <div className="pointer-events-none absolute -top-0.5 right-0 cut-frame-sm border border-violet-200/60 bg-black/80 px-2 py-0.5 text-sm font-black uppercase tracking-[0.1em] text-violet-100 shadow-[0_0_14px_rgba(193,120,255,0.32)]">
                            {row.value.toLocaleString()}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-5 cut-frame-sm border border-amber-300/75 bg-black/45 p-4 shadow-[0_0_0_1px_rgba(252,211,77,0.9),0_0_22px_rgba(252,211,77,0.86),0_0_56px_rgba(252,211,77,0.72),0_0_108px_rgba(252,211,77,0.56),inset_0_0_20px_rgba(252,211,77,0.27)]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-sm font-black uppercase tracking-[0.2em] text-white/80 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Recent Referrals</div>
            </div>
            <div className="space-y-3">
              {recentReferrals.length ? (
                recentReferrals.map((r) => (
                  <div
                    key={r.visitor_id}
                    className="cut-frame-sm hud-hover-glow flex items-center justify-between gap-3 border border-[rgba(255,215,0,0.22)] bg-black/40 px-3 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[rgba(0,191,255,0.35)] bg-black/55 text-sm font-black text-[#bfefff]">
                        {(r.visitor_id || "U").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-base font-bold text-white/90">{r.visitor_id}</div>
                        <div className={`text-[11px] font-black uppercase tracking-[0.16em] ${r.status === "purchased" ? "text-[#86ffbf]" : "text-white/55"}`}>
                          {r.status}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-xs font-bold uppercase tracking-[0.14em] text-white/65">{formatAgo(r.at)}</div>
                  </div>
                ))
              ) : (
                <div className="text-base text-white/65">No referral activity yet.</div>
              )}
            </div>
          </div>

          <div className="mt-5 cut-frame-sm border border-cyan-300/75 bg-black/45 p-4 shadow-[0_0_0_1px_rgba(34,211,238,0.9),0_0_22px_rgba(34,211,238,0.86),0_0_56px_rgba(34,211,238,0.72),0_0_108px_rgba(34,211,238,0.56),inset_0_0_20px_rgba(34,211,238,0.27)]">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/80 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Affiliate Visitors</h3>
            <div className="mt-3 overflow-auto no-scrollbar">
              <table className="w-full min-w-[700px] text-left text-base">
                <thead className="text-xs uppercase tracking-[0.14em] text-white/70">
                  <tr className="border-b border-[rgba(255,215,0,0.2)]">
                    <th className="px-2 py-2">Visitor</th>
                    <th className="px-2 py-2">Clicked At</th>
                    <th className="px-2 py-2">Lead Email</th>
                    <th className="px-2 py-2">Lead At</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.length > 0 ? (
                    visitors.map((v) => (
                      <tr key={v.visitor_id} className="border-b border-white/10 text-white/85">
                        <td className="px-2 py-2 font-semibold">{v.visitor_id}</td>
                        <td className="px-2 py-2">{formatWhen(v.clicked_at)}</td>
                        <td className="px-2 py-2">{v.lead_email ?? "-"}</td>
                        <td className="px-2 py-2">{formatWhen(v.lead_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-2 py-5 text-center text-white/45">
                        No visitor activity yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


