"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import type { StreamPlaylistListItem } from "@/lib/streaming-api";

export const PROGRAM_DETAIL_TRIGGER_ATTR = "data-program-playlist-detail";

/** Overrides Thryon / display fonts from global CSS for this dialog subtree. */
const READABLE_FONT_STACK = `Inter, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;

type Props = {
  playlist: StreamPlaylistListItem | null;
  onClose: () => void;
};

function isAllCapsHeadingLine(line: string): boolean {
  const t = line.trim();
  if (t.length < 3 || t.length > 96) return false;
  if (t.split(/\s+/).filter(Boolean).length > 14) return false;
  return /^[A-Z0-9\s\-'",.\[\]:/&!?]+$/.test(t);
}

function isBracketHeadingLine(line: string): boolean {
  return /^\s*\[[^\]]+\]\s*$/.test(line);
}

function colonHeadingInner(line: string): string | null {
  const t = line.trim();
  if (!t.endsWith(":") || t.length < 3 || t.length > 72) return null;
  const inner = t.slice(0, -1).trim();
  if (inner.length < 2) return null;
  if (!/^[A-Z]/.test(inner)) return null;
  return inner;
}

/** "The Hook", "What You Will Learn", … (not ending in .) */
function isLikelyTitleCaseHeading(line: string): boolean {
  const t = line.trim();
  if (t.length < 4 || t.length > 72) return false;
  if (t.endsWith(".") || t.endsWith("?") || t.endsWith("!")) return false;
  if (/\d{3,}/.test(t)) return false;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 10) return false;
  const small = new Set([
    "and",
    "or",
    "the",
    "of",
    "for",
    "a",
    "an",
    "to",
    "in",
    "on",
    "at",
    "by",
    "as",
    "is",
    "it",
    "we",
    "you",
    "your",
    "with",
    "from",
    "into",
    "that",
    "this",
    "will",
    "our",
    "are",
    "be",
  ]);
  for (const w of words) {
    if (small.has(w.toLowerCase())) continue;
    if (/^[A-Z][a-zA-Z0-9'-]*$/.test(w)) continue;
    if (/^[A-Z]{2,4}$/.test(w)) continue;
    return false;
  }
  return true;
}

/** "The Publishing Fortress: Architecting…" → heading + body */
function splitInlineHeadingBody(line: string): { head: string; body: string } | null {
  const t = line.trim();
  const idx = t.indexOf(":");
  if (idx < 6 || idx > 52) return null;
  const head = t.slice(0, idx).trim();
  const body = t.slice(idx + 1).trim();
  if (!body || body.length < 20) return null;
  if (!/^[A-Z]/.test(head)) return null;
  if (head.split(/\s+/).length > 12) return null;
  return { head, body };
}

/** Few newlines: break common course sections and list intros */
function preprocessDenseDescription(raw: string): string {
  let t = raw.replace(/\r\n/g, "\n").trim();
  const newlineCount = (t.match(/\n/g) || []).length;
  if (newlineCount >= 5) return t;

  const inject: [RegExp, string][] = [
    [/\s+(The Publishing Fortress:\s*)/gi, "\n\n$1\n\n"],
    [/\s+(The Hook)\s+/gi, "\n\n$1\n\n"],
    [/\s+(The Core Protocol)\s+/gi, "\n\n$1\n\n"],
    [/\s+(What You Will Learn)\s+/gi, "\n\n$1\n\n"],
  ];
  for (const [re, rep] of inject) {
    t = t.replace(re, rep);
  }
  t = t.replace(/(What You Will Learn)\s+(Intro,)/gi, "$1\n\n$2");
  return t;
}

function tryCommaTopicList(text: string, keyBase: number): ReactNode | null {
  const t = text.trim();
  if (!t.includes(",")) return null;
  const parts = t.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 4) return null;
  if (parts.some((p) => p.length > 85)) return null;
  const avg = t.length / parts.length;
  if (avg > 52) return null;
  if (parts.some((p) => /\b(?:however|therefore|because|although|which|that)\b/i.test(p) && p.length > 40)) return null;
  return (
    <ul
      key={`ul-comma-${keyBase}`}
      className="my-1 list-disc space-y-2.5 pl-5 text-[15px] leading-relaxed text-white/90 marker:text-[#e8c547] sm:text-[16px]"
    >
      {parts.map((p, i) => (
        <li key={i} className="pl-1">
          {p}
        </li>
      ))}
    </ul>
  );
}

function tryShortLinesAsList(text: string, keyBase: number): ReactNode | null {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 4) return null;
  if (!lines.every((l) => l.length >= 2 && l.length <= 72)) return null;
  if (lines.some((l) => /\.\s/.test(l))) return null;
  if (lines.some((l) => /\b(?:the|and|but|you are|it is|we strip)\s+[a-z]{4,}\b/.test(l))) return null;
  return (
    <ul
      key={`ul-lines-${keyBase}`}
      className="my-1 list-disc space-y-2.5 pl-5 text-[15px] leading-relaxed text-white/90 marker:text-[#e8c547] sm:text-[16px]"
    >
      {lines.map((l, i) => (
        <li key={i} className="pl-1">
          {l}
        </li>
      ))}
    </ul>
  );
}

function parseDescriptionToBlocks(text: string): ReactNode {
  const normalized = preprocessDenseDescription(text);
  const lines = normalized.split("\n");
  const out: ReactNode[] = [];
  let para: string[] = [];
  let bulletBuf: string[] = [];
  let k = 0;

  const flushBulletList = () => {
    if (bulletBuf.length === 0) return;
    out.push(
      <ul
        key={`ul-${k++}`}
        className="my-1 list-disc space-y-2.5 pl-5 text-[15px] leading-relaxed text-white/90 marker:text-[#e8c547] sm:text-[16px]"
      >
        {bulletBuf.map((item, i) => (
          <li key={i} className="pl-1">
            {item}
          </li>
        ))}
      </ul>
    );
    bulletBuf = [];
  };

  const flushPara = () => {
    if (para.length === 0) return;
    const content = para.join("\n").trimEnd();
    para = [];
    if (!content) return;

    const commaList = tryCommaTopicList(content, k);
    if (commaList) {
      out.push(commaList);
      k++;
      return;
    }
    const lineList = tryShortLinesAsList(content, k);
    if (lineList) {
      out.push(lineList);
      k++;
      return;
    }

    out.push(
      <p
        key={`p-${k++}`}
        className="text-[15px] font-normal leading-[1.85] tracking-normal text-white/90 antialiased sm:text-[16px] sm:leading-[1.9]"
      >
        {content}
      </p>
    );
  };

  const pushHeading = (title: string, variant: "large" | "medium" | "small") => {
    const cls =
      variant === "large"
        ? "text-[1.125rem] font-bold leading-snug text-[#f5c814] sm:text-[1.35rem]"
        : variant === "medium"
          ? "text-[1.05rem] font-bold leading-snug text-[#e8c547] sm:text-[1.2rem]"
          : "text-[0.98rem] font-bold leading-snug text-[#fde68a] sm:text-[1.05rem]";
    out.push(
      <h3 key={`h-${k++}`} className={cls}>
        {title}
      </h3>
    );
  };

  const mdHeading = /^\s*(#{1,3})\s+(.+)$/;
  const bulletLine = /^\s*[-*•·]\s+(.+)$/;

  for (const line of lines) {
    const bulletM = line.match(bulletLine);
    if (bulletM) {
      flushPara();
      bulletBuf.push(bulletM[1].trim());
      continue;
    }
    if (bulletBuf.length && line.trim() !== "") {
      flushBulletList();
    }

    const md = line.match(mdHeading);
    if (md) {
      flushPara();
      flushBulletList();
      const level = md[1].length;
      const title = md[2].trim();
      pushHeading(title, level === 1 ? "large" : level === 2 ? "medium" : "small");
      continue;
    }
    if (line.trim() === "") {
      flushPara();
      flushBulletList();
      continue;
    }

    const hb = splitInlineHeadingBody(line);
    if (hb) {
      flushPara();
      flushBulletList();
      pushHeading(hb.head, "large");
      para.push(hb.body);
      flushPara();
      continue;
    }

    if (isBracketHeadingLine(line)) {
      flushPara();
      flushBulletList();
      pushHeading(line.trim(), "small");
      continue;
    }
    const colonInner = colonHeadingInner(line);
    if (colonInner) {
      flushPara();
      flushBulletList();
      pushHeading(colonInner, "medium");
      continue;
    }
    if (isAllCapsHeadingLine(line)) {
      flushPara();
      flushBulletList();
      out.push(
        <h3
          key={`ac-${k++}`}
          className="text-[1rem] font-bold uppercase leading-snug tracking-[0.04em] text-[#f5c814] sm:text-[1.1rem] sm:tracking-[0.05em]"
        >
          {line.trim()}
        </h3>
      );
      continue;
    }
    if (isLikelyTitleCaseHeading(line)) {
      flushPara();
      flushBulletList();
      pushHeading(line.trim(), "medium");
      continue;
    }
    para.push(line);
  }
  flushPara();
  flushBulletList();
  return (
    <div className="flex flex-col gap-5 sm:gap-6" role="document">
      {out}
    </div>
  );
}

export function ProgramPlaylistDescriptionModal({ playlist, onClose }: Props) {
  useEffect(() => {
    if (!playlist || typeof document === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [playlist, onClose]);

  const body = (playlist?.description || "").trim();
  const blocks = useMemo(() => (body ? parseDescriptionToBlocks(body) : null), [body]);

  if (!playlist || typeof document === "undefined") return null;

  const readableShell = {
    fontFamily: READABLE_FONT_STACK,
  } as const;

  const tree = (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="program-desc-modal-title"
      style={readableShell}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close description"
      />
      <div
        className={cn(
          "relative z-[1] flex max-h-[min(90vh,820px)] w-full max-w-[min(96vw,960px)] flex-col overflow-hidden rounded-2xl border-2 border-[#f5c814]/50 sm:max-w-[min(94vw,1040px)]",
          "bg-[linear-gradient(180deg,rgba(18,18,18,0.98),rgba(6,6,8,0.99))] shadow-[0_0_40px_rgba(245,200,20,0.25),0_24px_80px_rgba(0,0,0,0.85)]",
          "[&_h3]:scroll-mt-4"
        )}
        style={readableShell}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-6 py-5 sm:px-10 sm:py-6">
          <h2
            id="program-desc-modal-title"
            className="min-w-0 flex-1 text-left text-[1.125rem] font-bold leading-snug tracking-normal text-[#f5c814] sm:text-[1.35rem] sm:leading-tight"
          >
            {playlist.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-white/20 bg-black/50 p-2 text-white/80 transition hover:border-[#f5c814]/60 hover:text-[#f5c814]"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div
          className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-10 sm:py-9 [&_strong]:font-semibold [&_strong]:text-[#fde68a]"
          style={readableShell}
        >
          {blocks ? (
            <div className="max-w-none pb-1">{blocks}</div>
          ) : (
            <p className="text-[15px] leading-relaxed text-white/55 sm:text-[16px]">
              No description has been added for this program yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(tree, document.body);
}
