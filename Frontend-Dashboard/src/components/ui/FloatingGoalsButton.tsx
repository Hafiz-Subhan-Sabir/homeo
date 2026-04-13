"use client";

import { Target } from "lucide-react";
import { useGoalsPanel } from "@/contexts/GoalsPanelContext";
import { cn } from "@/components/dashboard/dashboardPrimitives";

/** Sections where the FAB is shown (maps to SPA nav keys on `/`). */
const FAB_SECTION_KEYS = new Set(["dashboard", "programs", "affiliate", "resources", "monk"]);

/** Default FAB — cyan accent on most shell sections. */
const FAB_SHELL_DEFAULT =
  "cut-frame-sm hud-hover-glow glass-dark transition border border-white/14 bg-black/50 hover:border-cyan-400/35 hover:bg-black/60";

/** Syndicate / Affiliate — gold HUD to match nav and missions chrome. */
const FAB_SHELL_SYNDICATE =
  "cut-frame-sm hud-hover-glow glass-dark transition border border-[rgba(250,204,21,0.42)] bg-black/55 hover:border-[rgba(253,224,71,0.65)] hover:bg-black/62";

function prefetchOpsDeckChunks() {
  void import("@/features/productivity/control-center/QuickAccessGrid");
}

export function FloatingGoalsButton() {
  const { openGoalsPanel, isGoalsPanelOpen, shellSectionKey } = useGoalsPanel();
  const allowed = shellSectionKey != null && FAB_SECTION_KEYS.has(shellSectionKey);
  const syndicateGold = shellSectionKey === "monk" || shellSectionKey === "affiliate";

  if (!allowed || isGoalsPanelOpen) return null;

  return (
    <button
      type="button"
      onClick={openGoalsPanel}
      onPointerEnter={prefetchOpsDeckChunks}
      onFocus={prefetchOpsDeckChunks}
      className={cn(
        "group",
        syndicateGold ? FAB_SHELL_SYNDICATE : FAB_SHELL_DEFAULT,
        "fixed z-[195] flex items-center justify-center text-left",
        syndicateGold ? "text-[#fde047]" : "text-cyan-100/90",
        "motion-reduce:transition-none",
        /* Mobile: icon-only, minimal footprint + safe area */
        "bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] right-3 h-10 w-10 gap-0 p-0 sm:bottom-6 sm:right-5 sm:h-auto sm:w-auto sm:justify-start sm:gap-2.5 sm:px-3 sm:py-2.5",
        "md:bottom-6 md:right-6 md:max-w-[calc(100vw-1.5rem)]",
        syndicateGold
          ? "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(253,224,71,0.55)]"
          : "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/50"
      )}
      aria-label="Open Goals and Milestones"
      aria-haspopup="dialog"
      aria-expanded={false}
    >
      <span
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-md border bg-black/30 sm:h-7 sm:w-7",
          syndicateGold
            ? "border-[rgba(250,204,21,0.45)] text-[#fde047] [filter:drop-shadow(0_0_8px_rgba(250,204,21,0.35))]"
            : "border-white/12 text-cyan-200/90"
        )}
      >
        <Target className="h-[17px] w-[17px] sm:h-[18px] sm:w-[18px]" strokeWidth={2.2} aria-hidden />
      </span>
      <span
        className={cn(
          "hidden text-[12px] font-extrabold uppercase leading-tight tracking-[0.12em] sm:inline md:text-[13px] md:tracking-[0.14em]",
          syndicateGold
            ? "text-[#fde047] [text-shadow:0_0_14px_rgba(250,204,21,0.35),0_1px_0_rgba(0,0,0,0.85)]"
            : "text-white/88"
        )}
      >
        Goals &amp; Milestones
      </span>
      <span
        className={cn(
          "ml-auto hidden h-px w-[28px] opacity-0 transition group-hover:opacity-100 sm:block",
          syndicateGold
            ? "bg-[linear-gradient(90deg,transparent,rgba(253,224,71,0.5))]"
            : "bg-[linear-gradient(90deg,transparent,rgba(34,211,238,0.35))]"
        )}
      />
    </button>
  );
}
