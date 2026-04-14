"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { portalFetch } from "@/lib/portal-api";
import { getLatestOperatorBriefMeta, saveOperatorBrief } from "@/lib/operator-brief-storage";

type Meta = {
  active: boolean;
  categories: Record<string, number>;
  total: number;
};

type GeneratedArticle = {
  title: string;
  key_points: string[];
  paragraphs: string[];
  keyword_used?: string;
  category_used?: string;
  article_id?: number;
  article_slug?: string;
  detail?: string;
};

type BriefCardMeta = { id: string; title: string; excerpt: string; articleSlug?: string };

const CATEGORY_OPTIONS: { id: string; label: string }[] = [
  { id: "all", label: "All topics" },
  { id: "business", label: "Business" },
  { id: "money", label: "Money" },
  { id: "power", label: "Power" },
  { id: "grooming", label: "Grooming" },
  { id: "others", label: "Others" }
];

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function MembershipAiBriefs() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [metaErr, setMetaErr] = useState<string | null>(null);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avoidTitles, setAvoidTitles] = useState<string[]>([]);
  const [briefCard, setBriefCard] = useState<BriefCardMeta | null>(null);

  const syncLatestCard = useCallback(() => {
    const latest = getLatestOperatorBriefMeta();
    if (latest) {
      setBriefCard({
        id: latest.id,
        title: latest.title,
        excerpt: latest.excerpt,
        articleSlug: latest.article_slug
      });
    }
  }, []);

  const loadMeta = useCallback(async () => {
    setMetaErr(null);
    const { ok, data, status } = await portalFetch<Meta & { detail?: string }>(
      "/api/portal/membership/generated-article/meta/"
    );
    if (!ok) {
      setMeta(null);
      setMetaErr(
        status === 401
          ? "Unable to load operator briefs right now."
          : typeof data === "object" && data && "detail" in data
            ? String((data as { detail?: string }).detail)
            : "Could not load brief settings."
      );
      return;
    }
    setMeta(data as Meta);
  }, []);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    syncLatestCard();
  }, [syncLatestCard]);

  const generate = async () => {
    setLoading(true);
    setError(null);
    const { ok, data, status } = await portalFetch<GeneratedArticle>("/api/portal/membership/generated-article/", {
      method: "POST",
      body: JSON.stringify({
        category,
        avoid_titles: avoidTitles
      })
    });
    setLoading(false);
    if (!ok) {
      const msg =
        status === 401
          ? "Unable to generate a brief right now."
          : typeof data === "object" && data && "detail" in data
            ? String((data as { detail?: string }).detail)
            : "Generation failed.";
      setError(msg);
      return;
    }
    const body = data as GeneratedArticle;
    const t = (body.title || "").trim();
    if (t) {
      setAvoidTitles((prev) => {
        const next = [t, ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase())];
        return next.slice(0, 16);
      });
    }
    const excerpt =
      (body.key_points || []).find((p) => p?.trim()) ||
      (body.paragraphs || []).find((p) => p?.trim()) ||
      "";
    const id = saveOperatorBrief({
      title: body.title || "Operator brief",
      key_points: body.key_points || [],
      paragraphs: body.paragraphs || [],
      keyword_used: body.keyword_used,
      category_used: body.category_used,
      article_slug: body.article_slug
    });
    setBriefCard({
      id,
      title: body.title || "Operator brief",
      excerpt: excerpt.trim().slice(0, 180),
      articleSlug: body.article_slug
    });
  };

  return (
    <div className="space-y-[clamp(1rem,2.5vw+0.35rem,1.5rem)]">
      <p className="max-w-2xl text-[15px] leading-[1.65] text-neutral-300 sm:text-[16px]">
        Each brief is generated from the active keyword dataset in Django admin (CSV or prose PDF/DOCX — long documents
        are scanned and keywords are extracted automatically). Each run is{" "}
        <span className="font-medium text-neutral-100">saved as a membership article</span> (Articles tab + admin). Click{" "}
        <span className="text-[color:var(--gold-neon)]/90">Generate brief</span> for a new angle — open the card for
        the full read.
      </p>

      {metaErr ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-5 text-[15px] leading-relaxed text-amber-50 sm:text-[16px]">
          <p>{metaErr}</p>
        </div>
      ) : null}

      {meta && !meta.active ? (
        <div className="rounded-xl border border-white/15 bg-black/35 p-5 text-[15px] leading-relaxed text-neutral-300 sm:text-[16px]">
          No active keyword dataset yet. In <span className="text-cyan-200/80">Django admin</span>, add an{" "}
          <span className="font-semibold text-white/80">Article keyword dataset</span>, upload a CSV, and check{" "}
          <span className="font-semibold text-white/80">Is active</span>.
        </div>
      ) : null}

      {meta?.active ? (
        <div className="flex flex-col gap-4 rounded-xl border border-[color:var(--gold-neon-border-mid)] bg-black/35 p-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-neutral-500">Topic bucket</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-w-[12rem] rounded-lg border border-[color:var(--gold-neon-border-mid)] bg-black/50 px-4 py-3 text-[15px] font-semibold text-neutral-100 outline-none focus:border-[rgba(250,204,21,0.5)]"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                  {meta.categories && c.id !== "all" && typeof meta.categories[c.id] === "number"
                    ? ` (${meta.categories[c.id]})`
                    : ""}
                </option>
              ))}
            </select>
          </div>
          <motion.button
            type="button"
            disabled={loading}
            onClick={() => void generate()}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className={cx(
              "cut-frame-sm cyber-frame gold-stroke rounded-lg px-7 py-3.5 text-[14px] font-black uppercase tracking-[0.16em]",
              loading
                ? "cursor-wait border-white/20 text-white/40"
                : "border-[rgba(250,204,21,0.5)] bg-[rgba(250,204,21,0.12)] text-[color:var(--gold-neon)] hover:border-[rgba(250,204,21,0.7)]"
            )}
          >
            {loading ? "Generating…" : "Generate brief"}
          </motion.button>
          <span className="text-[14px] leading-snug text-neutral-400">
            {meta.total} keywords in dataset · repeats avoided vs your last {avoidTitles.length} titles this session
          </span>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-500/35 bg-red-950/25 p-5 text-[15px] leading-relaxed text-red-100 sm:text-[16px]">
          {error}
        </div>
      ) : null}

      {briefCard ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl border border-[rgba(250,204,21,0.22)] bg-[#070707]/85 p-[clamp(1rem,2.5vw+0.5rem,1.35rem)] shadow-[0_0_40px_rgba(250,204,21,0.06)]"
        >
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[color:var(--gold-neon)]">
            Latest operator brief
          </p>
          <h3 className="mt-3 line-clamp-2 text-[clamp(1.2rem,2.2vw+0.5rem,1.55rem)] font-bold leading-snug text-neutral-50">
            {briefCard.title}
          </h3>
          {briefCard.excerpt ? (
            <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-neutral-300 sm:text-[16px]">{briefCard.excerpt}</p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/membership/brief/${encodeURIComponent(briefCard.id)}`}
              className="inline-flex rounded-lg border border-[rgba(250,204,21,0.45)] bg-black/40 px-5 py-3 text-[13px] font-black uppercase tracking-[0.14em] text-[color:var(--gold-neon)] transition hover:border-[rgba(250,204,21,0.65)]"
            >
              Open articles
            </Link>
          </div>
        </motion.div>
      ) : meta?.active && !metaErr ? (
        <p className="text-[15px] leading-relaxed text-neutral-400 sm:text-[16px]">
          Generate a brief to see it as a card here. Full text opens on its own page.
        </p>
      ) : null}
    </div>
  );
}
