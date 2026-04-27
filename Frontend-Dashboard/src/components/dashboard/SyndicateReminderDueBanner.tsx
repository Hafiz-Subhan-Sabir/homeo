"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";
import {
  acknowledgeDueSyndicateReminder,
  getDueSyndicateReminders,
  markDueReminderChimePlayed,
  playSyndicateReminderChime,
  shouldPlayDueReminderChime,
  snoozeSyndicateReminderMinutes,
  type DueSyndicateReminder
} from "@/lib/syndicateReminderDueAlert";
import { SYNDICATE_DASHBOARD_REFRESH_EVENT } from "@/lib/syndicateProgressSync";
import type { DashboardNavKey } from "./types";

export function SyndicateReminderDueBanner({ onNavigate }: { onNavigate: (nav: DashboardNavKey) => void }) {
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);
  const [due, setDue] = useState<DueSyndicateReminder[]>([]);
  const dueRef = useRef<DueSyndicateReminder[]>([]);
  dueRef.current = due;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    const id = window.setInterval(bump, 5000);
    window.addEventListener(SYNDICATE_DASHBOARD_REFRESH_EVENT, bump);
    window.addEventListener("focus", bump);
    window.addEventListener("storage", bump);
    return () => {
      window.clearInterval(id);
      window.removeEventListener(SYNDICATE_DASHBOARD_REFRESH_EVENT, bump);
      window.removeEventListener("focus", bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  useEffect(() => {
    const list = getDueSyndicateReminders(Date.now());
    setDue(list);
    if (list.length === 0) return;
    const top = list[0]!;
    if (shouldPlayDueReminderChime(top.id, top.atIso)) {
      playSyndicateReminderChime();
      markDueReminderChimePlayed(top.id, top.atIso);
    }
  }, [tick]);

  const onStop = useCallback(() => {
    const d = dueRef.current[0];
    if (!d) return;
    acknowledgeDueSyndicateReminder(d.id, d.atIso);
    setTick((t) => t + 1);
  }, []);

  const onSnooze = useCallback((mins: number) => {
    const d = dueRef.current[0];
    if (!d) return;
    snoozeSyndicateReminderMinutes(d.id, mins);
    setTick((t) => t + 1);
  }, []);

  if (!mounted || typeof document === "undefined") return null;

  const primary = due[0];
  const more = due.length - 1;

  if (!primary) return null;

  return createPortal(
    <AnimatePresence mode="sync">
      <motion.div
        key={`${primary.id}-${primary.atIso}`}
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -14 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="pointer-events-auto fixed left-3 right-3 z-[200] max-w-3xl sm:left-1/2 sm:right-auto sm:w-[calc(100%-1.5rem)] sm:max-w-3xl sm:-translate-x-1/2"
        style={{ top: "calc(var(--topbarH, 4.5rem) + 10px + env(safe-area-inset-top, 0px))" }}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex flex-col gap-3 rounded-lg border border-cyan-400/45 bg-[#05080a]/96 px-4 py-3 shadow-[0_12px_48px_rgba(0,0,0,0.55),0_0_0_1px_rgba(34,211,238,0.15)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-cyan-400/50 bg-cyan-500/20">
              <Bell className="h-5 w-5 text-cyan-100" aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-black uppercase tracking-[0.18em] text-cyan-200/95">Syndicate reminder due</div>
              <div className="mt-1.5 text-[17px] font-bold leading-snug text-white/96">{primary.title}</div>
              <div className="mt-1 font-mono text-[13px] leading-snug text-white/52">
                Mission #{primary.id} · scheduled{" "}
                {new Date(primary.atIso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </div>
              {more > 0 ? <div className="mt-1.5 text-[12px] font-semibold text-amber-200/85">+{more} more overdue</div> : null}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:shrink-0 sm:items-end">
            <div className="flex flex-wrap gap-2">
              {[5, 10, 15].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onSnooze(m)}
                  className="rounded-md border border-cyan-400/40 bg-cyan-500/18 px-3 py-2.5 text-[12px] font-black uppercase tracking-[0.12em] text-cyan-50/95 hover:border-cyan-300/55"
                >
                  Snooze {m}m
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onStop}
                className="rounded-md border border-white/20 bg-black/45 px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.12em] text-white/88 hover:bg-black/60"
              >
                Stop
              </button>
              <button
                type="button"
                onClick={() => onNavigate("monk")}
                className="rounded-md border border-[rgba(255,215,0,0.48)] bg-[rgba(255,215,0,0.12)] px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.12em] text-[color:var(--gold)]/95 hover:border-[rgba(255,215,0,0.7)]"
              >
                Open Syndicate
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
