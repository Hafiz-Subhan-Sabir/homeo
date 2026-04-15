"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { recordMembershipArticleRead } from "@/lib/membership-read-history";
import { fetchAuthenticatedPdfBlob, portalFetch } from "@/lib/portal-api";
import type { ArticleDto } from "@/components/membership/ArticleCard";
import { MembershipArticleReader, type ArticleReaderState } from "@/components/membership/MembershipArticleReader";

const ARTICLES_HREF = "/?section=resources";

/** Turn a single very long paragraph into two for readability (sentence boundary near the middle). */
function splitLongProseForDisplay(text: string, minChars = 520): string[] {
  const t = text.trim();
  if (t.length < minChars) return [t];
  const target = Math.floor(t.length * 0.45);
  const windowStart = Math.max(0, target - 320);
  const windowEnd = Math.min(t.length, target + 320);
  const slice = t.slice(windowStart, windowEnd);
  const idx = slice.lastIndexOf(". ");
  if (idx === -1) return [t];
  const splitAt = windowStart + idx + 1;
  const a = t.slice(0, splitAt).trim();
  const b = t.slice(splitAt).trim();
  if (!a || !b) return [t];
  return [a, b];
}

function formatPublishedDate(iso: string): string | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function MembershipArticleDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const [article, setArticle] = useState<ArticleDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [reader, setReader] = useState<ArticleReaderState>(null);

  const closeReader = useCallback(() => {
    setReader((prev) => {
      if (prev?.kind === "pdf") URL.revokeObjectURL(prev.blobUrl);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setErr("Missing article.");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      const path = `/api/portal/membership/articles/${encodeURIComponent(slug)}/`;
      const { ok, data, status } = await portalFetch<ArticleDto & { detail?: string }>(path);
      if (cancelled) return;
      setLoading(false);
      if (!ok) {
        setArticle(null);
        setErr(
          status === 401
            ? "Unable to load this article right now."
            : typeof data === "object" && data && "detail" in data
              ? String(data.detail)
              : "Article could not be loaded."
        );
        return;
      }
      const loaded = data as ArticleDto;
      setArticle(loaded);
      recordMembershipArticleRead(slug);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const openPdf = async () => {
    if (!article?.pdf_url?.trim()) return;
    try {
      const blob = await fetchAuthenticatedPdfBlob(article.pdf_url.trim());
      const blobUrl = URL.createObjectURL(blob);
      setReader({ kind: "pdf", title: article.title, blobUrl });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open PDF.");
    }
  };

  const openWeb = () => {
    if (!article?.source_url?.trim()) return;
    setReader({ kind: "web", title: article.title, url: article.source_url.trim() });
  };

  const contentBlocks = useMemo(() => {
    if (!article?.content?.trim()) return [];
    return article.content.split("\n\n").map((b) => b.trim()).filter(Boolean);
  }, [article?.content]);

  if (loading) {
    return (
      <div className="min-h-dvh overflow-x-hidden bg-[#0b0b0c]">
        <div className="fluid-page-px mx-auto max-w-5xl py-12 sm:py-16">
          <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
          <div className="mt-10 h-10 max-w-2xl animate-pulse rounded bg-white/[0.07]" />
          <div className="mt-4 h-4 w-full animate-pulse rounded bg-white/[0.05]" />
          <div className="mt-3 h-4 max-w-[83%] animate-pulse rounded bg-white/[0.05]" />
          <div className="mt-12 space-y-3">
            <div className="h-3 w-full animate-pulse rounded bg-white/[0.04]" />
            <div className="h-3 w-full animate-pulse rounded bg-white/[0.04]" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-white/[0.04]" />
          </div>
        </div>
      </div>
    );
  }

  if (err || !article) {
    return (
      <div className="min-h-dvh overflow-x-hidden bg-[#0b0b0c] py-12 text-neutral-100 fluid-page-px">
        <div className="mx-auto max-w-lg rounded-2xl border border-white/[0.08] bg-[#141416] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <p className="text-[15px] leading-relaxed text-red-200/90">{err || "Not found."}</p>
          <Link
            href={ARTICLES_HREF}
            className="mt-6 inline-flex text-[14px] font-semibold text-[color:var(--gold-neon)] transition hover:text-amber-200"
          >
            ← Back to articles
          </Link>
        </div>
      </div>
    );
  }

  const publishedLabel = formatPublishedDate(article.published_at);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#0b0b0c] text-neutral-100">
      <div className="border-b border-white/[0.06] bg-[#0e0e10]/80">
        <div className="fluid-page-px mx-auto flex w-full min-w-0 max-w-5xl items-center justify-between gap-3 py-4 sm:gap-4">
          <Link
            href={ARTICLES_HREF}
            className="text-[13px] font-medium text-neutral-500 transition hover:text-[color:var(--gold-neon)]"
          >
            ← Articles
          </Link>
          {publishedLabel ? (
            <time dateTime={article.published_at} className="text-[12px] tabular-nums text-neutral-500">
              {publishedLabel}
            </time>
          ) : (
            <span className="text-[12px] text-neutral-600">Membership</span>
          )}
        </div>
      </div>

      <article className="fluid-page-px mx-auto w-full min-w-0 max-w-5xl pb-16 pt-8 sm:pb-20 sm:pt-12">
        <div className="membership-article-shiny-frame w-full min-w-0">
          <div className="membership-article-shiny-inner px-[clamp(0.875rem,3.5vw,1.75rem)] py-7 sm:px-6 sm:py-9 md:px-8 md:py-11">
            {article.thumbnail?.trim() ? (
              <figure className="mb-10 overflow-hidden rounded-xl border border-white/[0.08] bg-black/40 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <img src={article.thumbnail.trim()} alt="" className="aspect-[16/9] w-full object-cover" />
              </figure>
            ) : null}

            <header className="min-w-0 border-b border-white/[0.08] pb-8 sm:pb-10">
              <h1 className="membership-article-title w-full min-w-0 text-left text-[clamp(1.5rem,2.8vw+0.85rem,2.35rem)] font-semibold leading-[1.2] tracking-tight text-white sm:text-center">
                {article.title}
              </h1>
              {article.description?.trim() ? (
                <p className="membership-article-prose mt-5 w-full min-w-0 text-left text-[15px] leading-[1.72] text-neutral-400 sm:mt-6 sm:text-[17px] sm:leading-[1.8]">
                  {article.description}
                </p>
              ) : null}
            </header>

            {contentBlocks.length > 0 ? (
              <div className="membership-article-prose mt-8 w-full min-w-0 space-y-7 text-left text-[15px] leading-[1.82] text-neutral-300 sm:mt-10 sm:space-y-8 sm:text-[17px] sm:leading-[1.85]">
                {contentBlocks.map((block, i) => {
                  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
                  const isBulletBlock = lines.length > 0 && lines.every((line) => /^[-•*]\s/.test(line));
                  const isSeedLine = /^seed:\s/i.test(block.trim());

                  const sectionHeadingClass =
                    "w-full min-w-0 border-b border-white/[0.12] pb-3 text-left text-[13px] font-semibold uppercase leading-snug tracking-[0.16em] text-[color:var(--gold-neon)] sm:text-[15px] sm:pb-3.5 sm:tracking-[0.18em]";

                  if (block.toLowerCase() === "key points") {
                    return (
                      <h2 key={i} className={sectionHeadingClass}>
                        Key points
                      </h2>
                    );
                  }

                  if (isSeedLine) {
                    return (
                      <p key={i} className={sectionHeadingClass} role="note">
                        {block}
                      </p>
                    );
                  }

                  const isShortHeading =
                    block.length < 80 &&
                    !block.includes(".") &&
                    lines.length === 1 &&
                    /^[A-Za-z]/.test(block) &&
                    block.toLowerCase() !== "key points";

                  if (isShortHeading && !isBulletBlock) {
                    return (
                      <h2 key={i} className={sectionHeadingClass}>
                        {block}
                      </h2>
                    );
                  }

                  if (isBulletBlock) {
                    const items = block
                      .split("\n")
                      .map((l) => l.replace(/^\s*[-•*]\s*/, "").trim())
                      .filter(Boolean);
                    return (
                      <ul key={i} className="list-none space-y-3.5 pl-0 sm:space-y-4">
                        {items.map((item, j) => (
                          <li key={j} className="flex items-start gap-3 text-left text-neutral-200/95 sm:gap-3.5">
                            <span
                              className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--gold-neon)]/75 shadow-[0_0_10px_rgba(250,204,21,0.35)] sm:mt-[0.5em] sm:h-2 sm:w-2"
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1 text-pretty">{item}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  }

                  const subParas = block
                    .split(/\n{2,}/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                  if (subParas.length > 1) {
                    return (
                      <div key={i} className="space-y-5 sm:space-y-6">
                        {subParas.map((para, k) => (
                          <p key={k} className="min-w-0 text-pretty text-neutral-200/95" lang="en">
                            {para}
                          </p>
                        ))}
                      </div>
                    );
                  }

                  const longParts = splitLongProseForDisplay(block);
                  if (longParts.length > 1) {
                    return (
                      <div key={i} className="space-y-5 sm:space-y-6">
                        {longParts.map((para, k) => (
                          <p key={k} className="min-w-0 text-pretty text-neutral-200/95" lang="en">
                            {para}
                          </p>
                        ))}
                      </div>
                    );
                  }

                  return (
                    <p key={i} className="min-w-0 text-pretty text-neutral-200/95" lang="en">
                      {block}
                    </p>
                  );
                })}
              </div>
            ) : null}

            {(article.pdf_url?.trim() || article.source_url?.trim()) ? (
              <footer className="mt-12 flex w-full min-w-0 flex-col gap-3 border-t border-white/[0.08] pt-8 sm:mt-14 sm:flex-row sm:flex-wrap sm:pt-10">
                {article.pdf_url?.trim() ? (
                  <button
                    type="button"
                    onClick={() => void openPdf()}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-[color:var(--gold-neon-border-mid)] bg-[rgba(250,204,21,0.08)] px-6 py-3 text-[14px] font-semibold text-[color:var(--gold-neon)] transition hover:bg-[rgba(250,204,21,0.12)] sm:w-auto"
                  >
                    View PDF
                  </button>
                ) : null}
                {article.source_url?.trim() ? (
                  <button
                    type="button"
                    onClick={openWeb}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-white/15 bg-transparent px-6 py-3 text-[14px] font-semibold text-neutral-200 transition hover:border-white/25 hover:bg-white/[0.04] sm:w-auto"
                  >
                    Read online
                  </button>
                ) : null}
              </footer>
            ) : null}
          </div>
        </div>
      </article>

      <MembershipArticleReader state={reader} onClose={closeReader} />
    </div>
  );
}
