"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { fetchAuthenticatedPdfBlob, portalFetch } from "@/lib/portal-api";
import { ArticleCard, type ArticleDto } from "./ArticleCard";
import { MembershipArticleReader, type ArticleReaderState } from "./MembershipArticleReader";
import { VideoCard, type VideoDto } from "./VideoCard";

type Tab = "articles" | "videos";

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  search_source?: string;
  tokens?: string[];
};

const DEMO_VIDEOS: VideoDto[] = [
  {
    id: -101,
    title: "Night Ops Focus Loop",
    description: "Ambient tactical soundtrack for deep work sprints and mission planning.",
    video_url: "https://www.youtube.com/watch?v=DWcJFNfaw9c",
    thumbnail: "",
    duration: "45:10",
    created_at: "",
  },
  {
    id: -102,
    title: "Strategic Thinking Under Pressure",
    description: "Decision framework drills you can run before high-stakes calls.",
    video_url: "https://www.youtube.com/watch?v=8x0fY6YJxQ4",
    thumbnail: "",
    duration: "18:24",
    created_at: "",
  },
  {
    id: -103,
    title: "Executive Presence Micro-Habits",
    description: "Short training on voice pace, posture, and command presence.",
    video_url: "https://www.youtube.com/watch?v=VbfpW0pbvaU",
    thumbnail: "",
    duration: "12:08",
    created_at: "",
  },
  {
    id: -104,
    title: "Money Systems for Operators",
    description: "Build a zero-noise weekly money review and execution cadence.",
    video_url: "https://www.youtube.com/watch?v=HQzoZfc3GwQ",
    thumbnail: "",
    duration: "22:41",
    created_at: "",
  },
];

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}

function parseYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?(?:[^#]*&)?v=))([\w-]{11})/);
  return m?.[1] ?? null;
}

function parseVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m?.[1] ?? null;
}

function embedUrlForVideo(url: string): string | null {
  const y = parseYoutubeId(url);
  if (y) return `https://www.youtube.com/embed/${y}?autoplay=1&rel=0`;
  const v = parseVimeoId(url);
  if (v) return `https://player.vimeo.com/video/${v}?autoplay=1`;
  return null;
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function apiErrorMessage(status: number, data: unknown, fallback: string): string {
  if (status === 401) {
    return "Unable to load this content right now.";
  }
  if (status === 404) {
    return "API not found on this origin. Leave NEXT_PUBLIC_API_BASE empty to use the Next.js proxy to Django, or set it to your Django URL (e.g. http://127.0.0.1:8000).";
  }
  if (typeof data === "object" && data && "detail" in data) return String((data as { detail?: string }).detail);
  return fallback;
}

function MembershipHudCorners() {
  return (
    <div className="pointer-events-none absolute inset-2 z-[4] rounded-md sm:inset-3" aria-hidden>
      <span className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-amber-400/60 shadow-[0_0_14px_rgba(251,191,36,0.25)] sm:h-7 sm:w-7" />
      <span className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-amber-400/60 shadow-[0_0_14px_rgba(251,191,36,0.25)] sm:h-7 sm:w-7" />
      <span className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.2)] sm:h-7 sm:w-7" />
      <span className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.2)] sm:h-7 sm:w-7" />
    </div>
  );
}

export function MembershipContentHub() {
  const [tab, setTab] = useState<Tab>("articles");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [titleSearch, setTitleSearch] = useState("");
  const debouncedTitleSearch = useDebounced(titleSearch, 300);

  const [articles, setArticles] = useState<ArticleDto[]>([]);
  const [videos, setVideos] = useState<VideoDto[]>([]);
  const [videoPage, setVideoPage] = useState(1);
  const [videoNext, setVideoNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoDto | null>(null);
  const [articleReader, setArticleReader] = useState<ArticleReaderState>(null);
  const [articleCount, setArticleCount] = useState<number | null>(null);
  const [videoCount, setVideoCount] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  const hasAutoGeneratedRef = useRef(false);
  const embed = activeVideo ? embedUrlForVideo(activeVideo.video_url) : null;

  const closeArticleReader = useCallback(() => {
    setArticleReader((prev) => {
      if (prev?.kind === "pdf") URL.revokeObjectURL(prev.blobUrl);
      return null;
    });
  }, []);

  const handleOpenArticlePdf = useCallback(async (article: ArticleDto) => {
    const path = article.pdf_url?.trim();
    if (!path) return;
    const blob = await fetchAuthenticatedPdfBlob(path);
    const blobUrl = URL.createObjectURL(blob);
    setArticleReader({ kind: "pdf", title: article.title, blobUrl });
  }, []);

  const handleOpenArticleWeb = useCallback((article: ArticleDto) => {
    const url = article.source_url?.trim();
    if (!url) return;
    setArticleReader({ kind: "web", title: article.title, url });
  }, []);

  const loadArticles = useCallback(
    async (page: number, append: boolean) => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("sort", sort);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      const q = debouncedTitleSearch.trim();
      if (q) {
        params.set("q", q);
        params.set("search_in", "title");
      }
      const { ok, data, status } = await portalFetch<Paginated<ArticleDto>>(
        `/api/portal/membership/articles/?${params.toString()}`
      );
      if (!ok) {
        setError(apiErrorMessage(status, data, "Could not load articles."));
        setLoading(false);
        return;
      }
      const body = data as Paginated<ArticleDto>;
      setArticles((prev) => (append ? [...prev, ...body.results] : body.results));
      setArticleCount(typeof body.count === "number" ? body.count : null);
      setLoading(false);
      setError(null);
    },
    [sort, dateFrom, dateTo, debouncedTitleSearch]
  );

  const loadVideos = useCallback(async (page: number, append: boolean) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    const { ok, data, status } = await portalFetch<Paginated<VideoDto>>(`/api/portal/membership/videos/?${params.toString()}`);
    if (!ok) {
      setError(apiErrorMessage(status, data, "Could not load videos."));
      setLoading(false);
      return;
    }
    const body = data as Paginated<VideoDto>;
    setVideoNext(body.next);
    setVideos((prev) => (append ? [...prev, ...body.results] : body.results));
    setVideoCount(typeof body.count === "number" ? body.count : null);
    setLoading(false);
    setError(null);
  }, []);

  const autoGenerateBrief = useCallback(async () => {
    if (hasAutoGeneratedRef.current) return;
    hasAutoGeneratedRef.current = true;
    await portalFetch("/api/portal/membership/generated-article/", {
      method: "POST",
      body: JSON.stringify({ category: "all", avoid_titles: [] })
    });
  }, []);

  useEffect(() => {
    setError(null);
  }, [tab]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (tab !== "articles") return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      if (sort === "newest" && !dateFrom && !dateTo && !debouncedTitleSearch.trim()) {
        await autoGenerateBrief();
      }
      if (!cancelled) {
        await loadArticles(1, false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [tab, sort, dateFrom, dateTo, debouncedTitleSearch, autoGenerateBrief, loadArticles]);

  useEffect(() => {
    if (tab !== "videos") return;
    setLoading(true);
    setVideoPage(1);
    void loadVideos(1, false);
  }, [tab, loadVideos]);

  const sortedFeaturedFirst = useMemo(() => {
    const copy = [...articles];
    copy.sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
    return copy;
  }, [articles]);
  const videosToRender = videos.length ? videos : DEMO_VIDEOS;

  const loadMoreVideos = () => {
    if (!videoNext) return;
    const next = videoPage + 1;
    setVideoPage(next);
    void loadVideos(next, true);
  };

  const filtersActive = Boolean(titleSearch.trim() || dateFrom || dateTo);
  const localTime = useMemo(
    () =>
      new Date().toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
    [tick]
  );

  const resetFilters = useCallback(() => {
    setTitleSearch("");
    setDateFrom("");
    setDateTo("");
  }, []);

  return (
    <div
      className={cx(
        "membership-dystopia-shell relative w-full max-w-none overflow-visible rounded-xl pr-[clamp(0.15rem,0.5vw+0.05rem,0.35rem)]",
        "border border-[color:var(--gold-neon-border-mid)] shadow-[inset_0_0_100px_rgba(0,0,0,0.88),0_0_60px_rgba(250,204,21,0.08)]"
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 z-[1] rounded-xl bg-[radial-gradient(ellipse_110%_70%_at_50%_-15%,rgba(250,204,21,0.08),transparent_52%),radial-gradient(ellipse_80%_55%_at_100%_110%,rgba(220,38,38,0.14),transparent_48%),radial-gradient(ellipse_60%_50%_at_0%_100%,rgba(34,197,94,0.06),transparent_45%),linear-gradient(180deg,#0c0b0d,#050508_45%,#080706)]"
        aria-hidden
      />
      <div className="membership-dystopia-crt rounded-xl" aria-hidden />
      <div className="engine-scanline rounded-xl" aria-hidden />
      <div className="relative z-[3] h-1.5 w-full bg-[linear-gradient(90deg,transparent,rgba(250,204,21,0.7),transparent)] opacity-90" aria-hidden />
      <MembershipHudCorners />

      <div className="relative z-[5] px-4 pb-6 pt-5 sm:px-6 sm:pb-8 sm:pt-6">
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[color:var(--gold-neon-border-mid)]/35 bg-black/55 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--gold-neon)]/85 shadow-[inset_0_1px_0_rgba(250,204,21,0.08)] sm:text-[11px] sm:tracking-[0.14em]">
          <span className="text-[color:var(--gold-neon)]/90">Sector // Intel mesh</span>
          <span className="hidden text-neutral-600 sm:inline">|</span>
          <span className="flex items-center gap-1.5 text-[color:var(--gold-neon)]/90">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--gold-neon)] shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
            Uplink
          </span>
          <span className="hidden text-neutral-600 md:inline">|</span>
          <span className="text-neutral-400">{localTime}</span>
          <span className="ml-auto text-amber-100/80">
            {tab === "articles" ? (
              <>Archive <span className="text-[color:var(--gold-neon)]">{articleCount ?? "—"}</span> entries</>
            ) : (
              <>Feed <span className="text-[color:var(--gold-neon)]">{videoCount ?? videos.length}</span> channels</>
            )}
          </span>
        </div>

        <div className="mb-[clamp(1rem,2.5vw+0.35rem,1.5rem)] border-b border-[color:var(--gold-neon-border-mid)]/60 pb-[clamp(0.85rem,2vw+0.25rem,1.15rem)]">
          <div className="flex flex-wrap items-start gap-3">
            <motion.h2
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[clamp(1.35rem,3vw,2rem)] font-black italic tracking-[0.02em] text-[color:var(--gold-neon)] drop-shadow-[0_0_28px_rgba(250,204,21,0.32)]"
            >
              Member Intelligence
            </motion.h2>
            <span className="mt-1 rounded border border-[color:var(--gold-neon-border-mid)] bg-[rgba(250,204,21,0.08)] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--gold-neon)] shadow-[0_0_16px_rgba(250,204,21,0.12)]">
              Classified
            </span>
          </div>
          <p className="mt-3 max-w-2xl text-[15px] leading-[1.65] text-neutral-300 sm:text-[16px]">
            Curated press, field notes, and video briefings — routed through a degraded network. Search, sort, and survive the
            noise.
          </p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--gold-neon)]/65">
            // Protocol: read-only · No corporate filler · Auto-sync active
          </p>
        </div>

        <div className="mb-[clamp(1rem,2.5vw+0.35rem,1.5rem)] flex flex-wrap fluid-membership-gap border-b border-[color:var(--gold-neon-border-mid)]/35 pb-[clamp(0.85rem,2vw+0.25rem,1.15rem)]">
          {(
            [
              { id: "articles" as const, label: "Articles", sub: "Text archive" },
              { id: "videos" as const, label: "Videos", sub: "Visual feed" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cx(
                "group relative overflow-hidden rounded-lg border px-5 py-3 text-left transition",
                "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[rgba(250,204,21,0.55)] before:to-transparent before:opacity-0 before:transition before:content-['']",
                "hover:before:opacity-100",
                tab === t.id
                  ? "border-[color:var(--gold-neon-border-mid)] bg-[linear-gradient(180deg,rgba(250,204,21,0.14),rgba(0,0,0,0.35))] text-[color:var(--gold-neon)] shadow-[0_0_26px_rgba(250,204,21,0.2),inset_0_0_22px_rgba(250,204,21,0.06)]"
                  : "border-white/15 bg-black/55 text-neutral-400 hover:border-[color:var(--gold-neon-border-mid)] hover:text-[color:var(--gold-neon)]/90 hover:shadow-[0_0_20px_rgba(250,204,21,0.1)]"
              )}
            >
              <span className="block text-[13px] font-black uppercase tracking-[0.16em]">{t.label}</span>
              <span className="mt-0.5 block text-[10px] font-mono uppercase tracking-wider text-neutral-500 group-hover:text-neutral-400">
                {t.sub}
              </span>
            </button>
          ))}
        </div>

        {tab === "articles" ? (
        <div className="space-y-[clamp(1rem,2.5vw+0.35rem,1.5rem)]">
          <div className="relative overflow-hidden rounded-2xl border border-[color:var(--gold-neon-border-mid)]/35 bg-[linear-gradient(180deg,rgba(20,15,5,0.55),rgba(4,4,4,0.94))] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(250,204,21,0.08)] sm:p-5">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_100%_at_0%_0%,rgba(250,204,21,0.08),transparent_52%)]" />
            <div className="relative flex flex-col gap-4">
              <div className="grid gap-2 sm:grid-cols-[88px_minmax(0,1fr)] sm:items-center">
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200/80">Query</span>
                <input
                  type="search"
                  value={titleSearch}
                  onChange={(e) => setTitleSearch(e.target.value)}
                  placeholder="Search by title…"
                  autoComplete="off"
                  className="w-full rounded-xl border border-cyan-300/30 bg-black/60 px-4 py-3 text-[15px] font-semibold text-neutral-100 placeholder:text-neutral-500 outline-none ring-0 transition focus:border-cyan-300/65 focus:shadow-[0_0_20px_rgba(34,211,238,0.14)]"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-[88px_minmax(0,180px)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200/80">Sort</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
                  className="rounded-xl border border-cyan-300/30 bg-black/60 px-4 py-3 text-[14px] font-semibold text-neutral-100 outline-none transition focus:border-cyan-300/65"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded-xl border border-cyan-300/30 bg-black/60 px-3 py-3 text-[14px] font-semibold text-neutral-100 outline-none transition focus:border-cyan-300/65"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded-xl border border-cyan-300/30 bg-black/60 px-3 py-3 text-[14px] font-semibold text-neutral-100 outline-none transition focus:border-cyan-300/65"
                />
                {filtersActive ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="rounded-xl border border-cyan-300/35 bg-cyan-400/10 px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:border-cyan-200/65 hover:bg-cyan-400/20"
                  >
                    Reset
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/35 bg-red-950/25 p-5 text-[15px] leading-relaxed text-red-100 sm:text-[16px]">
              <p>{error}</p>
            </div>
          ) : null}

          {loading && !articles.length ? (
            <div className="relative overflow-hidden rounded-xl border border-amber-500/15 bg-black/40 py-16 text-center">
              <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(34,211,238,0.03)_3px,rgba(34,211,238,0.03)_4px)]" />
              <p className="relative font-mono text-[13px] uppercase tracking-[0.2em] text-cyan-200/70">Decrypting archive…</p>
              <p className="relative mt-2 text-[15px] text-neutral-500">Stand by</p>
            </div>
          ) : articles.length > 0 ? (
            <div
              className={cx(
                "grid gap-6",
                "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
                sortedFeaturedFirst.some((a) => a.is_featured) && "xl:grid-flow-dense"
              )}
            >
              {sortedFeaturedFirst.map((article, i) => {
                const featured = article.is_featured && i === 0;
                return (
                  <div key={article.id} className={cx(featured && "md:col-span-2 xl:col-span-2")}>
                    <ArticleCard
                      article={article}
                      featured={featured}
                      index={i}
                      onOpenPdf={handleOpenArticlePdf}
                      onOpenWeb={handleOpenArticleWeb}
                    />
                  </div>
                );
              })}
            </div>
          ) : !error ? (
            <div className="relative overflow-hidden rounded-xl border border-red-900/35 bg-black/50 px-6 py-14 text-center shadow-[inset_0_0_48px_rgba(220,38,38,0.06)]">
              <div className="pointer-events-none absolute left-0 right-0 top-0 h-1 membership-hazard-stripe opacity-70" />
              <p className="text-[18px] font-semibold text-red-100/90 sm:text-[19px]">Signal lost — empty archive</p>
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-[1.65] text-neutral-400 sm:text-[16px]">
                No <span className="font-mono text-amber-200/80">membership.Article</span> rows in the database. Feed the mesh from
                Django admin.
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-xl border border-cyan-300/35 border-t-red-500/30 bg-[radial-gradient(circle_at_20%_0%,rgba(0,255,255,0.12),rgba(0,0,0,0.1)_55%),linear-gradient(180deg,rgba(8,14,16,0.95),rgba(3,5,8,0.98))] p-5 shadow-[inset_0_1px_0_rgba(248,113,113,0.15)]">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_92%,rgba(34,211,238,0.15)_100%)] bg-[length:100%_7px] opacity-35" />
            <p className="relative text-[12px] font-black uppercase tracking-[0.18em] text-cyan-200">Video arcade // hazard feed</p>
            <p className="relative mt-2 text-[15px] leading-relaxed text-neutral-300 sm:text-[16px]">
              Full-screen playback. Neural thumbnails. When the grid runs dry, demo signals keep the sector online.
            </p>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/35 bg-red-950/25 p-5 text-[15px] leading-relaxed text-red-100 sm:text-[16px]">
              <p>{error}</p>
            </div>
          ) : null}

          {loading && !videos.length ? (
            <div className="relative overflow-hidden rounded-xl border border-cyan-500/20 py-[clamp(3rem,10vh,4.5rem)] text-center">
              <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,rgba(220,38,38,0.04)_4px,rgba(220,38,38,0.04)_5px)]" />
              <p className="relative font-mono text-[13px] uppercase tracking-[0.2em] text-cyan-200/75">Buffering visual feed…</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-[clamp(1rem,2.5vw+0.35rem,1.5rem)] md:grid-cols-2 xl:grid-cols-3">
              {videosToRender.map((v, i) => (
                <VideoCard key={v.id} video={v} onPlay={setActiveVideo} index={i} />
              ))}
            </div>
          )}
          {!loading && !videos.length && !error ? (
            <div className="rounded-xl border border-cyan-300/25 bg-black/40 px-6 py-14 text-center">
              <p className="text-[18px] font-semibold text-cyan-100 sm:text-[19px]">Showing demo videos</p>
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-[1.65] text-neutral-300 sm:text-[16px]">
                Add real videos in <span className="text-cyan-200/85">Django admin</span> under{" "}
                <span className="text-neutral-100">Membership - Videos</span>. These demo cards auto-hide once real rows exist.
              </p>
            </div>
          ) : null}
          

          {videoNext ? (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={loadMoreVideos}
                className="cut-frame-sm cyber-frame rounded-lg border border-cyan-300/40 bg-cyan-400/10 px-7 py-3.5 text-[13px] font-black uppercase tracking-[0.16em] text-cyan-100 transition hover:border-cyan-200/70 hover:bg-cyan-400/20"
              >
                Load more videos
              </button>
            </div>
          ) : null}
        </div>
        )}
      </div>

      <MembershipArticleReader state={articleReader} onClose={closeArticleReader} />

      <AnimatePresence>
        {activeVideo ? (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Video player"
            onClick={() => setActiveVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative w-full max-w-4xl overflow-hidden rounded-xl border border-cyan-300/50 bg-black shadow-[0_0_72px_rgba(34,211,238,0.22),0_0_40px_rgba(220,38,38,0.12),inset_0_0_0_1px_rgba(251,191,36,0.12)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pointer-events-none absolute inset-0 opacity-[0.07] membership-hazard-stripe" aria-hidden />
              <div className="relative flex items-center justify-between gap-3 border-b border-cyan-300/25 bg-black/80 px-4 py-3">
                <div className="min-w-0 line-clamp-1 text-[13px] font-bold text-cyan-100">{activeVideo.title}</div>
                <button
                  type="button"
                  onClick={() => setActiveVideo(null)}
                  className="shrink-0 rounded-lg border border-cyan-300/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-100 hover:border-red-400/40 hover:text-red-200"
                >
                  Close
                </button>
              </div>
              <div className="aspect-video w-full bg-black">
                {embed ? (
                  <iframe
                    title={activeVideo.title}
                    src={embed}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-[13px] text-neutral-300">
                    <p>Embed not available for this URL. Open in a new tab instead.</p>
                    <a
                      href={activeVideo.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-200 underline"
                    >
                      Open video
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
