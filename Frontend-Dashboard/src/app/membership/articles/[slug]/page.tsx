"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { fetchAuthenticatedPdfBlob, portalFetch } from "@/lib/portal-api";
import type { ArticleDto } from "@/components/membership/ArticleCard";
import { MembershipArticleReader, type ArticleReaderState } from "@/components/membership/MembershipArticleReader";

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
      setArticle(data as ArticleDto);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] p-6 text-[17px] text-neutral-400">
        <div className="mx-auto max-w-4xl">Loading article…</div>
      </div>
    );
  }

  if (err || !article) {
    return (
      <div className="min-h-screen bg-[#080808] p-6 text-neutral-100">
        <div className="shell-neon-yellow cut-frame cyber-frame gold-stroke mx-auto max-w-4xl border border-white/12 bg-[#0c0c0c] p-8">
          <p className="text-[16px] leading-relaxed text-red-200/95">{err || "Not found."}</p>
          <Link href="/membership/content" className="mt-5 inline-block text-[15px] font-semibold text-amber-300 underline">
            Back to articles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] p-6 text-neutral-100">
      <div className="shell-neon-yellow cut-frame cyber-frame gold-stroke relative mx-auto max-w-4xl border border-white/12 bg-[#0c0c0c] p-8 sm:p-10">
        <div className="absolute inset-0 opacity-70 [background:radial-gradient(820px_520px_at_40%_0%,rgba(250,204,21,0.09),rgba(0,0,0,0)_64%)]" />
        <article className="relative space-y-6">
          <Link
            href="/membership/content"
            className="text-[13px] font-bold uppercase tracking-[0.14em] text-amber-300 hover:text-amber-200"
          >
            ← Back to articles
          </Link>

          {article.thumbnail?.trim() ? (
            <div className="aspect-[16/9] w-full overflow-hidden rounded-lg border border-white/10">
              <img src={article.thumbnail.trim()} alt="" className="h-full w-full object-cover" />
            </div>
          ) : null}

          <header>
            <h1 className="text-[clamp(1.65rem,4vw+0.6rem,2.35rem)] font-bold leading-[1.15] text-neutral-50">
              {article.title}
            </h1>
            <p className="mt-3 text-[17px] font-medium leading-[1.65] text-neutral-100 sm:mt-4 sm:text-[18px]">
              {article.description}
            </p>
          </header>

          {article.content?.trim() ? (
            <div className="prose prose-invert max-w-none border-t border-white/10 pt-8 text-[17px] leading-[1.85] text-neutral-50 sm:text-[18px]">
              {article.content.split("\n\n").map((block, i) => (
                <p key={i} className="mb-5 whitespace-pre-wrap last:mb-0">
                  {block}
                </p>
              ))}
            </div>
          ) : null}

          <div className="flex flex-col gap-2 border-t border-white/10 pt-6 sm:flex-row sm:gap-3">
            {article.pdf_url?.trim() ? (
              <button
                type="button"
                onClick={() => void openPdf()}
                className="cut-frame-sm cyber-frame gold-stroke premium-gold-border rounded-lg bg-black/40 px-5 py-3.5 text-[13px] font-black uppercase tracking-[0.18em] text-[color:var(--gold-neon)]/92"
              >
                View PDF
              </button>
            ) : null}
            {article.source_url?.trim() ? (
              <button
                type="button"
                onClick={openWeb}
                className="cut-frame-sm cyber-frame rounded-lg border border-white/20 bg-black/40 px-5 py-3.5 text-[13px] font-black uppercase tracking-[0.18em] text-neutral-200"
              >
                Read online
              </button>
            ) : null}
          </div>
        </article>
      </div>

      <MembershipArticleReader state={reader} onClose={closeReader} />
    </div>
  );
}
