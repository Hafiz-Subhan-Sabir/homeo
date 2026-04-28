"use client";

import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  confirmPlaylistCheckoutSuccess,
  fetchStreamPlaylists,
  type StreamPlaylistListItem,
} from "@/lib/streaming-api";
import { resolveDjangoMediaUrl } from "@/lib/courses-api";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { hasSimpleAuthSessionClient } from "@/lib/portal-api";

const PROGRAM_CARD_BACKGROUNDS: readonly string[] = [
  "from-amber-600/85 via-orange-900/50 to-black",
  "from-rose-600/85 via-red-950/55 to-black",
  "from-violet-600/85 via-purple-950/50 to-black",
  "from-emerald-600/80 via-teal-950/50 to-black",
  "from-sky-600/85 via-blue-950/50 to-black",
  "from-fuchsia-600/80 via-pink-950/45 to-black",
];

const PLAYLIST_CARD_THEMES = [
  {
    glow: "shadow-[0_10px_34px_rgba(0,0,0,0.5),0_0_0_1px_rgba(196,181,253,0.4),0_0_44px_rgba(139,92,246,0.32)]",
    ring: "from-violet-300/95 via-purple-400/95 to-fuchsia-300/95",
    title: "text-white",
    infoPanel: "border-fuchsia-300/35 bg-fuchsia-950/28",
    dominantBorder: "border-fuchsia-300/75",
  },
  {
    glow: "shadow-[0_10px_34px_rgba(0,0,0,0.5),0_0_0_1px_rgba(103,232,249,0.4),0_0_44px_rgba(34,211,238,0.32)]",
    ring: "from-cyan-300/95 via-sky-400/95 to-blue-300/95",
    title: "text-white",
    infoPanel: "border-cyan-300/35 bg-cyan-950/28",
    dominantBorder: "border-cyan-300/75",
  },
  {
    glow: "shadow-[0_10px_34px_rgba(0,0,0,0.5),0_0_0_1px_rgba(110,231,183,0.4),0_0_44px_rgba(52,211,153,0.32)]",
    ring: "from-emerald-300/95 via-teal-400/95 to-lime-300/95",
    title: "text-white",
    infoPanel: "border-emerald-300/35 bg-emerald-950/28",
    dominantBorder: "border-emerald-300/75",
  },
  {
    glow: "shadow-[0_10px_34px_rgba(0,0,0,0.5),0_0_0_1px_rgba(251,191,36,0.4),0_0_44px_rgba(245,158,11,0.32)]",
    ring: "from-amber-300/95 via-yellow-400/95 to-orange-300/95",
    title: "text-white",
    infoPanel: "border-amber-300/35 bg-amber-950/28",
    dominantBorder: "border-amber-300/75",
  },
] as const;

function parseNumber(value: string | number | null | undefined): number {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

function roundedStarCount(rating: number): number {
  return Math.max(0, Math.min(5, Math.round(rating)));
}

type Props = {
  title?: string;
  subtitle?: string;
  className?: string;
};

const CATEGORY_LABELS: Record<"business_model" | "business_psychology", string> = {
  business_model: "Business Model",
  business_psychology: "Business Psychology",
};

export function PlaylistCardsSection({
  title = "Programs",
  subtitle = "All playlists added from admin are shown here. Open dashboard to continue learning.",
  className,
}: Props) {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<StreamPlaylistListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const list = await fetchStreamPlaylists();
        if (!cancelled) {
          setPlaylists(Array.isArray(list) ? list : []);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setPlaylists([]);
          setError("Could not load playlists right now.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = (params.get("playlist_checkout") || "").trim();
    const sessionId = (params.get("session_id") || "").trim();
    if (status !== "success" || !sessionId) return;
    if (!hasSimpleAuthSessionClient()) return;
    void (async () => {
      try {
        await confirmPlaylistCheckoutSuccess(sessionId);
        const list = await fetchStreamPlaylists();
        setPlaylists(Array.isArray(list) ? list : []);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Payment confirmation failed.");
      } finally {
        const clean = new URL(window.location.href);
        clean.searchParams.delete("playlist_checkout");
        clean.searchParams.delete("session_id");
        clean.searchParams.delete("playlist_id");
        window.history.replaceState({}, "", clean.toString());
      }
    })();
  }, []);

  const visiblePlaylists = useMemo(() => playlists.filter((pl) => !pl.is_coming_soon), [playlists]);
  const businessPsychologyPlaylists = useMemo(
    () => visiblePlaylists.filter((pl) => pl.category !== "business_model"),
    [visiblePlaylists]
  );
  const businessModelPlaylists = useMemo(
    () => visiblePlaylists.filter((pl) => pl.category === "business_model"),
    [visiblePlaylists]
  );

  const renderPlaylistCard = (pl: StreamPlaylistListItem, j: number) => {
    const grad = PROGRAM_CARD_BACKGROUNDS[j % PROGRAM_CARD_BACKGROUNDS.length];
    const coverSrc = resolveDjangoMediaUrl(pl.cover_image_url);
    const theme = PLAYLIST_CARD_THEMES[j % PLAYLIST_CARD_THEMES.length];
    const rating = Math.max(0, Math.min(5, parseNumber(pl.rating)));
    const price = parseNumber(pl.price);
    const unlocked = !!pl.is_unlocked;
    const locked = !unlocked;
    return (
      <article
        key={`playlist-${pl.id}`}
        className={cn(
          "group/card relative flex aspect-[3/5] w-full flex-col overflow-hidden text-left",
          "rounded-3xl border-2",
          theme.dominantBorder,
          theme.glow
        )}
      >
        <span
          className={cn(
            "pointer-events-none absolute left-1/2 top-1/2 z-0 aspect-square w-[185%] max-w-none -translate-x-1/2 -translate-y-1/2 will-change-transform animate-[spin_5.5s_linear_infinite] motion-reduce:animate-none bg-gradient-to-r",
            theme.ring
          )}
          style={{ animationDuration: `${5.3 + (j % 5) * 0.42}s` }}
          aria-hidden
        />
        <span className="relative z-[1] m-[1px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.45rem] bg-[#04060d] ring-1 ring-black/70">
          <div className="relative z-[3] flex h-full min-h-0 flex-col gap-2 p-3 sm:p-3.5">
            <div className="relative min-h-[9.6rem] overflow-hidden rounded-2xl border-2 border-white/20 sm:min-h-[14.2rem] sm:flex-1">
              {coverSrc ? (
                <>
                  <div className={cn("h-full w-full bg-gradient-to-t opacity-95", grad)} />
                  <img
                    src={coverSrc}
                    alt=""
                    loading={j < 2 ? "eager" : "lazy"}
                    decoding="async"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                    className="absolute inset-0 h-full w-full object-cover object-center [image-rendering:high-quality] [backface-visibility:hidden]"
                  />
                </>
              ) : (
                <div className={cn("h-full w-full bg-gradient-to-t opacity-95", grad)} />
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/45" />
              {locked ? <div className="pointer-events-none absolute inset-0 bg-black/50" /> : null}
            </div>
            <div className="absolute right-3 top-3 z-[4]">
              <span className="rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold tabular-nums text-neutral-900 shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
                {pl.video_count} videos
              </span>
            </div>
            <div
              className={cn(
                "flex flex-col overflow-hidden rounded-2xl border-2 px-2.5 py-2.5 sm:px-3.5 sm:py-3.5",
                theme.infoPanel,
                "bg-black/60 shadow-[0_10px_30px_rgba(0,0,0,0.62),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md"
              )}
            >
              <div className={cn("line-clamp-2 text-left text-[11px] font-extrabold uppercase leading-snug tracking-[0.05em] sm:text-[17px] sm:tracking-[0.07em]", theme.title)}>
                {pl.title}
              </div>
              <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5">
                <span className="inline-flex min-w-0 items-center gap-0.5 overflow-hidden rounded-full border border-amber-300/45 bg-[#130d03]/92 px-2 py-0.5 font-sans text-[11px] font-bold text-amber-50 sm:px-3 sm:py-1 sm:text-[13px]">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={`${pl.id}-star-${idx}`}
                      className={cn(
                        "h-2.5 w-2.5 sm:h-3 sm:w-3",
                        idx < roundedStarCount(rating) ? "fill-amber-300 text-amber-300" : "fill-transparent text-amber-100/35"
                      )}
                    />
                  ))}
                  <span className="ml-1 tabular-nums text-amber-50/95">{rating.toFixed(1)}</span>
                </span>
                <span
                  className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-emerald-300/50 bg-[#03140d]/95 px-2.5 py-0.5 tabular-nums text-[13px] font-black tracking-normal text-emerald-100 shadow-[0_0_16px_rgba(52,211,153,0.28)] sm:px-3.5 sm:py-1 sm:text-[17px]"
                  style={{ fontFamily: "Inter, Arial, Helvetica, sans-serif", fontFeatureSettings: '"tnum" 1, "lnum" 1' }}
                >
                  {`£${price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  router.push(`/signup?playlist_id=${encodeURIComponent(String(pl.id))}`);
                }}
                className="mt-2 rounded-xl border border-[#caa724]/90 bg-[linear-gradient(135deg,rgba(202,167,36,0.28),rgba(98,73,11,0.98))] px-3 py-2 text-[11px] font-black uppercase tracking-[0.15em] text-[#ffe9a3] shadow-[0_0_20px_rgba(202,167,36,0.6),inset_0_0_0_1px_rgba(202,167,36,0.35)] transition hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(202,167,36,0.9),0_0_52px_rgba(202,167,36,0.5),inset_0_0_0_1px_rgba(202,167,36,0.55)]"
              >
                Unlock
              </button>
            </div>
          </div>
        </span>
      </article>
    );
  };

  return (
    <section className={cn("space-y-5", className)}>
      {loading ? (
        <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-[13px] text-white/70">Loading playlists...</div>
      ) : null}
      {error ? <div className="rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-[13px] text-amber-100/90">{error}</div> : null}
      {!loading && !error && visiblePlaylists.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-[13px] text-white/70">No playlists are published yet.</div>
      ) : null}

      {visiblePlaylists.length > 0 ? (
        <div className="mx-auto grid max-w-[1800px] grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:items-start">
          <div className="space-y-3">
            <div className="text-center font-mono text-[15px] font-extrabold uppercase tracking-[0.2em] text-fuchsia-100 [text-shadow:0_0_10px_rgba(232,121,249,0.7),0_0_26px_rgba(232,121,249,0.82)] sm:text-[17px]">
              {CATEGORY_LABELS.business_psychology}
            </div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-fuchsia-300/90 to-transparent shadow-[0_0_14px_rgba(232,121,249,0.55)]" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              {businessPsychologyPlaylists.map((pl, j) => renderPlaylistCard(pl, j))}
            </div>
          </div>

          <div className="relative h-5 w-full xl:h-full xl:w-4" aria-hidden>
            <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-[#f5c814] to-transparent shadow-[0_0_14px_rgba(245,200,20,0.9),0_0_34px_rgba(245,200,20,0.65)] xl:hidden" />
            <div className="absolute left-1/2 top-0 hidden h-full w-[2px] -translate-x-1/2 bg-gradient-to-b from-transparent via-[#f5c814] to-transparent shadow-[0_0_16px_rgba(245,200,20,0.95),0_0_40px_rgba(245,200,20,0.7)] xl:block" />
          </div>

          <div className="space-y-3">
            <div className="text-center font-mono text-[15px] font-extrabold uppercase tracking-[0.2em] text-cyan-100 [text-shadow:0_0_10px_rgba(103,232,249,0.7),0_0_26px_rgba(103,232,249,0.82)] sm:text-[17px]">
              {CATEGORY_LABELS.business_model}
            </div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-300/90 to-transparent shadow-[0_0_14px_rgba(103,232,249,0.55)]" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              {businessModelPlaylists.map((pl, j) => renderPlaylistCard(pl, j + businessPsychologyPlaylists.length))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
