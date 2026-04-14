"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useActivityTimeline } from "@/contexts/ActivityTimelineContext";
import type { ActivityCategory, ActivityItem, DashboardNavKey, DashboardSnapshots } from "./types";
import { useDashboardSnapshots, type DashboardCourseLike } from "./useDashboardSnapshots";
import { accentByKey, Card, cn, ProgressBar, themeAccent, type ThemeMode } from "./dashboardPrimitives";
import { PortalSessionControls } from "../auth/PortalSessionControls";
import { GoalPathSystem } from "./path/GoalPathSystem";
import { MissionCommandDeckCard } from "./MissionCommandDeckCard";
import { SyndicateReminderDueBanner } from "./SyndicateReminderDueBanner";
import {
  formatSyndicateReminderCountdown,
  useSyndicateMissionsPeek,
  type SyndicateMissionPeekRow
} from "./useSyndicateMissionsPeek";
import { Bell, Target } from "lucide-react";
export type { ThemeMode };

function pickPrimaryMission(rows: SyndicateMissionPeekRow[]): SyndicateMissionPeekRow | null {
  const missions = rows.filter((r) => r.mood !== "reminder");
  if (!missions.length) return null;
  return (
    missions.find((r) => !r.completed && r.onBoard) ??
    missions.find((r) => !r.completed) ??
    missions[0] ??
    null
  );
}

function pickPrimaryReminder(rows: SyndicateMissionPeekRow[], now: number): SyndicateMissionPeekRow | null {
  const withRem = rows.filter((r) => r.reminderAtMs != null && r.reminderAtMs > now);
  if (!withRem.length) return null;
  return withRem.reduce((a, b) => ((a.reminderAtMs ?? 0) <= (b.reminderAtMs ?? 0) ? a : b));
}

function formatSyndicateReminderWhen(ms: number) {
  try {
    return new Date(ms).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "";
  }
}

function syndicateDifficultyChipClass(d: string) {
  const x = d.toLowerCase();
  if (x === "easy") return "border-emerald-400/40 bg-emerald-500/14 text-emerald-100/90";
  if (x === "hard") return "border-rose-400/40 bg-rose-500/14 text-rose-100/88";
  return "border-amber-400/38 bg-amber-500/12 text-amber-100/88";
}

function SyndicateMissionsSnapshotCard({
  themeMode,
  onNavigate
}: {
  themeMode: ThemeMode;
  onNavigate: (nav: DashboardNavKey) => void;
}) {
  const { rows, loading, error, linkedAccount, apiReached, refresh } = useSyndicateMissionsPeek();
  const [reminderTick, setReminderTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setReminderTick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const primaryMission = useMemo(() => pickPrimaryMission(rows), [rows]);
  const primaryReminder = useMemo(() => pickPrimaryReminder(rows, Date.now()), [rows, reminderTick]);

  const headerActions = (
    <div className="flex items-center gap-2">
      <motion.button
        type="button"
        onClick={() => refresh()}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        className="text-[12px] font-black uppercase tracking-[0.12em] text-cyan-200/85 hover:text-cyan-100/95"
      >
        Refresh
      </motion.button>
      <motion.button
        type="button"
        onClick={() => onNavigate("monk")}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        className="text-[12px] font-black uppercase tracking-[0.12em] text-[color:var(--gold)]/92"
      >
        Syndicate →
      </motion.button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div
        className="cut-frame cyber-frame gold-stroke relative overflow-hidden rounded-lg border border-[rgba(197,179,88,0.28)] bg-[#060606]/80 px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6"
        style={{ boxShadow: `0 0 0 1px rgba(197,179,88,0.08), 0 0 40px ${themeAccent(themeMode).glow}` }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-80 [background:radial-gradient(720px_280px_at_12%_0%,rgba(0,255,255,0.09),rgba(0,0,0,0)_55%)]" />
        <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="font-mono text-[clamp(1.05rem,2.1vw+0.6rem,1.55rem)] font-black uppercase italic tracking-[0.06em] text-[color:var(--gold)]/95 drop-shadow-[0_0_18px_rgba(250,204,21,0.22)]">
              Syndicate Mode
            </h3>
            <p className="mt-2 max-w-[52rem] text-[clamp(0.9rem,1.2vw+0.65rem,1.15rem)] font-semibold leading-relaxed text-white/78">
              Build <span className="text-cyan-200/90">streaks</span>, unlock <span className="text-[color:var(--gold)]/90">levels</span>, and{" "}
              <span className="text-emerald-200/88">earn points</span> to unlock programs and keep your edge on the board.
            </p>
            {!apiReached && rows.length > 0 ? (
              <p className="mt-2 text-[13px] text-amber-200/75">Board sync limited — showing what’s saved on this device.</p>
            ) : null}
          </div>
          <div className="shrink-0 pt-1 sm:pt-0">{headerActions}</div>
        </div>
      </div>

      {loading && rows.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2" aria-busy>
          <div className="h-48 animate-pulse rounded-lg bg-white/8" />
          <div className="h-48 animate-pulse rounded-lg bg-white/8" />
        </div>
      ) : null}

      {!loading && error && rows.length === 0 ? (
        <div className="rounded-lg border border-red-500/25 bg-red-950/25 px-4 py-4 text-[15px] text-red-200/90">
          {error}
          <button
            type="button"
            onClick={() => refresh()}
            className="mt-3 block text-[13px] font-black uppercase tracking-[0.14em] text-[color:var(--gold)]/95 underline-offset-2 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : null}

      {!loading && (rows.length > 0 || (!error && rows.length === 0)) ? (
        <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
          <Card
            themeMode={themeMode}
            title="Mission"
            accentKey="monk"
            frameVariant="shell"
            right={<Target className="h-5 w-5 text-cyan-300/80" aria-hidden />}
          >
            {primaryMission ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[12px] font-bold text-white/40">#{primaryMission.id}</span>
                  {primaryMission.completed ? (
                    <span className="rounded border border-white/18 bg-white/8 px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.12em] text-white/55">
                      Completed
                    </span>
                  ) : null}
                </div>
                <h4
                  className={cn(
                    "text-[clamp(1.05rem,1.4vw+0.85rem,1.35rem)] font-bold leading-snug text-white/94",
                    primaryMission.completed && "line-through decoration-white/35"
                  )}
                >
                  {primaryMission.title}
                </h4>
                {primaryMission.subtitle ? (
                  <p className="text-[clamp(0.88rem,0.9vw+0.65rem,1.02rem)] leading-relaxed text-white/62">{primaryMission.subtitle}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-md border border-white/16 bg-black/40 px-2 py-1 text-[12px] font-bold uppercase tracking-[0.1em] text-white/60">
                    {primaryMission.mood}
                  </span>
                  <span className="rounded-md border border-white/16 bg-black/40 px-2 py-1 text-[12px] font-bold uppercase tracking-[0.1em] text-white/60">
                    {primaryMission.category}
                  </span>
                  {primaryMission.difficulty && primaryMission.difficulty !== "—" ? (
                    <span
                      className={cn(
                        "rounded-md border px-2 py-1 text-[12px] font-black uppercase tracking-[0.1em]",
                        syndicateDifficultyChipClass(primaryMission.difficulty)
                      )}
                    >
                      {primaryMission.difficulty}
                    </span>
                  ) : null}
                  {primaryMission.onBoard ? (
                    <span className="rounded-md border border-cyan-500/40 bg-cyan-500/14 px-2 py-1 text-[12px] font-black uppercase tracking-[0.1em] text-cyan-100/88">
                      On 24h board
                    </span>
                  ) : (
                    <span className="rounded-md border border-white/12 bg-black/30 px-2 py-1 text-[12px] font-black uppercase tracking-[0.1em] text-white/40">
                      Off board
                    </span>
                  )}
                  {primaryMission.points > 0 ? (
                    <span className="text-[13px] font-black uppercase tracking-[0.08em] text-[color:var(--gold)]/85">+{primaryMission.points} pts</span>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/14 bg-black/35 px-3 py-5 text-center">
                <p className="text-[clamp(0.95rem,1vw+0.7rem,1.08rem)] font-semibold text-white/65">No mission on your board right now.</p>
                <p className="mt-2 text-[15px] text-white/45">Open Syndicate Mode to load today’s missions.</p>
              </div>
            )}
          </Card>

          <Card
            themeMode={themeMode}
            title="Reminder"
            accentKey="monk"
            frameVariant="shell"
            right={<Bell className="h-5 w-5 text-cyan-300/85" aria-hidden />}
          >
            {primaryReminder && primaryReminder.reminderAtMs != null && primaryReminder.reminderAtMs > Date.now() ? (
              <div className="flex flex-col gap-4 rounded-lg border border-cyan-400/35 bg-gradient-to-b from-cyan-500/14 via-black/40 to-transparent px-4 py-5">
                <div>
                  <div className="text-[12px] font-black uppercase tracking-[0.18em] text-cyan-200/88">Next up</div>
                  <p className="mt-2 text-[clamp(1rem,1.2vw+0.75rem,1.2rem)] font-bold leading-snug text-white/90">{primaryReminder.title}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-cyan-400/45 bg-cyan-500/18">
                    <Bell className="h-6 w-6 text-cyan-100" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-black uppercase tracking-[0.14em] text-cyan-200/85">Rings in</div>
                    <div className="mt-1 font-mono text-[clamp(1.45rem,2.4vw+0.9rem,2.1rem)] font-black tabular-nums leading-none text-cyan-50">
                      {formatSyndicateReminderCountdown(primaryReminder.reminderAtMs, Date.now())}
                    </div>
                    <div className="mt-2 text-[clamp(0.9rem,0.85vw+0.65rem,1.05rem)] text-white/55">{formatSyndicateReminderWhen(primaryReminder.reminderAtMs)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/14 bg-black/35 px-3 py-5 text-center">
                <p className="text-[clamp(0.95rem,1vw+0.7rem,1.08rem)] font-semibold text-white/65">No reminder scheduled.</p>
                <p className="mt-2 text-[15px] text-white/45">Set one on a mission card in Syndicate Mode.</p>
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {!loading && rows.length === 0 && !error ? (
        <motion.button
          type="button"
          onClick={() => onNavigate("monk")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-lg border border-cyan-400/45 bg-cyan-500/16 py-3.5 text-[14px] font-black uppercase tracking-[0.16em] text-cyan-50/95 hover:border-cyan-300/60 md:w-auto md:px-10"
        >
          Open Syndicate Mode
        </motion.button>
      ) : null}

      {!loading && rows.length > 0 && !linkedAccount ? (
        <p className="text-[13px] leading-relaxed text-white/48">Sign in from Syndicate Mode to sync missions and reminders across devices.</p>
      ) : null}
    </div>
  );
}

function timeAgo(ts: number) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/** Timeline strip: uppercase compact relative time (matches HUD reference). */
function timeAgoCaps(ts: number) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}S AGO`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}M AGO`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}H AGO`;
  const d = Math.floor(h / 24);
  return `${d}D AGO`;
}

function formatActivityWhen(ts: number) {
  try {
    return new Date(ts).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "";
  }
}

const ACTIVITY_CAT_LABEL: Record<ActivityCategory, string> = {
  program: "PROGRAM",
  syndicate: "SYNDICATE",
  affiliate: "AFFILIATE",
  system: "SYSTEM"
};

const ACTIVITY_RECENT_WINDOW_MS = 2 * 60 * 1000;

function activityStructuredFields(a: ActivityItem) {
  const when = formatActivityWhen(a.ts);
  const rel = timeAgo(a.ts);
  const type = ACTIVITY_CAT_LABEL[a.category];
  const headline = a.detail?.trim() || null;
  const story = a.moreDetails?.trim() || null;
  const path = a.route?.trim() || null;
  return { when, rel, type, headline, story, path };
}

/** Concise labeled block for one event (timeline details + full log). */
function ActivityEventDetailBlock({ a }: { a: ActivityItem }) {
  const f = activityStructuredFields(a);
  const detailFallback =
    !f.story && !f.headline && !f.path ? "No extra description was stored for this entry." : null;
  return (
    <div className="rounded-md border border-[rgba(255,215,0,0.14)] bg-black/40 px-3 py-2.5">
      <div className="text-[12px] font-semibold leading-snug text-white/90">{a.title}</div>
      <dl className="mt-2 grid grid-cols-[minmax(0,4.5rem)_1fr] gap-x-3 gap-y-1.5 text-[11px] leading-snug">
        <dt className="font-bold uppercase tracking-[0.08em] text-white/38">When</dt>
        <dd className="text-white/72">
          {f.when}
          <span className="text-white/45"> · {f.rel}</span>
        </dd>
        <dt className="font-bold uppercase tracking-[0.08em] text-white/38">Type</dt>
        <dd className="text-[color:var(--goals-milestones-gold)]/88">{f.type}</dd>
        {f.headline ? (
          <>
            <dt className="font-bold uppercase tracking-[0.08em] text-white/38">Summary</dt>
            <dd className="text-white/65">{f.headline}</dd>
          </>
        ) : null}
        {f.path ? (
          <>
            <dt className="font-bold uppercase tracking-[0.08em] text-white/38">Path</dt>
            <dd className="break-all font-mono text-[10px] text-cyan-200/75">{f.path}</dd>
          </>
        ) : null}
        {f.story ? (
          <>
            <dt className="font-bold uppercase tracking-[0.08em] text-white/38">Details</dt>
            <dd className="whitespace-pre-wrap break-words text-white/62">{f.story}</dd>
          </>
        ) : detailFallback ? (
          <>
            <dt className="font-bold uppercase tracking-[0.08em] text-white/38">Details</dt>
            <dd className="text-white/50">{detailFallback}</dd>
          </>
        ) : null}
      </dl>
    </div>
  );
}

function HeroStatusPanel({
  themeMode,
  userName,
  userRole,
  profileAvatar,
  snapshots,
  onNavigate
}: {
  themeMode: ThemeMode;
  userName: string;
  userRole: string;
  profileAvatar: string;
  snapshots: DashboardSnapshots;
  onNavigate: (nav: DashboardNavKey) => void;
}) {
  const s = snapshots;
  const t = themeAccent(themeMode);
  const ongoingPrograms = s.programs.length;
  const programsAvgPct =
    s.programs.length > 0 ? Math.round(s.programs.reduce((acc, p) => acc + p.progressPct, 0) / s.programs.length) : 0;
  const activeMissionCount = s.syndicate.activeMissionTitle ? 1 : 0;
  const missionsPct = s.syndicate.activeMissionsPct;
  const missedPct = s.syndicate.missedChallengesPct;
  return (
    <div
      className="cut-frame cyber-frame gold-stroke relative w-full max-w-none overflow-hidden border border-[rgba(197,179,88,0.26)] bg-[#060606]/78 p-5 backdrop-blur-[10px] md:p-6 lg:p-7"
      style={{ borderColor: "rgba(197,179,88,0.28)", boxShadow: `0 0 0 1px rgba(197,179,88,0.08), 0 0 52px ${t.glow}` }}
    >
      <div className="absolute inset-0 opacity-[0.88] [background:radial-gradient(920px_560px_at_38%_0%,rgba(197,179,88,0.11),rgba(0,0,0,0)_64%)]" />
      <div className="absolute inset-0 opacity-35 [background:radial-gradient(800px_320px_at_90%_0%,rgba(196,126,255,0.10),rgba(0,0,0,0)_62%)]" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <img
            src={profileAvatar}
            alt="Profile avatar"
            className="h-14 w-14 rounded-lg border border-white/10 bg-black/30 object-cover p-0.5"
          />
          <div className="min-w-0">
            <div className="font-mono text-[14px] font-black uppercase tracking-[0.12em] text-[color:var(--gold)]/92">
              {userName}
            </div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
              {userRole} • Rank: <span className="text-white/80">{s.syndicate.rankLabel}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="group relative inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-2 py-1">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/22" fill="none" aria-hidden="true">
                  <path d="M12 3.8l6.2 3.6v7.2L12 18.2l-6.2-3.6V7.4L12 3.8Z" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M7.8 9.2h8.4M7.8 12h6.2M7.8 14.8h8.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
                </svg>
                <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Diamond</span>
                <div className="pointer-events-none absolute left-1/2 top-[calc(100%+10px)] z-50 hidden w-[260px] -translate-x-1/2 rounded-md border border-white/10 bg-black/90 p-2 text-[11px] text-white/70 shadow-[0_0_28px_rgba(168,85,247,0.18)] group-hover:block">
                  <div className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-200/85">Future state</div>
                  <div className="mt-1">Sync remaining <span className="font-mono font-black text-white/90">28%</span> XP to unlock Diamond-tier HUD.</div>
                </div>
              </div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Next rank preview</div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">
                <span>XP toward next rank</span>
                <span className="text-white/85">{s.syndicate.xpPct}%</span>
              </div>
              <div className="mt-2">
                <ProgressBar pct={s.syndicate.xpPct} tone={themeMode === "danger" ? "danger" : themeMode === "cyberpunk" ? "ice" : "gold"} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <button
              type="button"
              onClick={() => onNavigate("programs")}
              className="rounded-md border bg-black/40 px-3 py-2 text-left hover:bg-black/65"
              style={{
                borderColor: accentByKey("programs").border,
                boxShadow: `0 0 0 1px ${accentByKey("programs").glow}`
              }}
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">Active programs</div>
              <div className="mt-1 space-y-0.5">
                <div className="font-mono text-[14px] font-black tabular-nums text-white/92">
                  {ongoingPrograms}{" "}
                  <span className="text-[9px] font-bold tracking-[0.12em] text-white/45">ONGOING</span>
                </div>
                <div className="font-mono text-[12px] font-black tabular-nums text-white/78">{programsAvgPct}%</div>
              </div>
              <div className="mt-2">
                <ProgressBar pct={programsAvgPct} tone="gold" />
              </div>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("monk")}
              className="rounded-md border bg-black/40 px-3 py-2 text-left hover:bg-black/65"
              style={{
                borderColor: accentByKey("monk").border,
                boxShadow: `0 0 0 1px ${accentByKey("monk").glow}`
              }}
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">Active missions</div>
              <div className="mt-1 space-y-0.5">
                <div className="font-mono text-[14px] font-black tabular-nums text-white/92">{missionsPct}%</div>
                <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/45">{activeMissionCount} live</div>
              </div>
              <div className="mt-2">
                <ProgressBar pct={missionsPct} tone="ice" />
              </div>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("monk")}
              className="rounded-md border bg-black/40 px-3 py-2 text-left hover:bg-black/65"
              style={{
                borderColor: accentByKey("alerts").border,
                boxShadow: `0 0 0 1px ${accentByKey("alerts").glow}`
              }}
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">Missed challenges</div>
              <div className="mt-1 font-mono text-[14px] font-black tabular-nums text-white/92">{missedPct}%</div>
              <div className="mt-2">
                <ProgressBar pct={missedPct} tone="danger" />
              </div>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("affiliate")}
              className="rounded-md border bg-black/40 px-3 py-2 text-left hover:bg-black/65"
              style={{
                borderColor: accentByKey("affiliate").border,
                boxShadow: `0 0 0 1px ${accentByKey("affiliate").glow}`
              }}
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">Mission points</div>
              <div className="mt-1 font-mono text-[14px] font-black tabular-nums text-white/92">{s.affiliate.earnings}</div>
            </button>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 pl-1">
            <PortalSessionControls themeMode={themeMode} />
          </div>
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3">
        <div
          className="rounded-md border px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em]"
          style={{
            borderColor: accentByKey("alerts").border,
            background: accentByKey("alerts").fill,
            color: accentByKey("alerts").text,
            boxShadow: `0 0 22px ${accentByKey("alerts").glow}`
          }}
        >
          Streak: {s.syndicate.streakDays} days
        </div>
        <div className="flex flex-wrap gap-2">
          <motion.button
            type="button"
            onClick={() => onNavigate("programs")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-md border bg-black/30 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--gold)]/95 hover:bg-black/45"
            style={{ borderColor: accentByKey("energy").border, boxShadow: `0 0 20px ${accentByKey("energy").glow}` }}
          >
            Continue Program
          </motion.button>
          <motion.button
            type="button"
            onClick={() => onNavigate("monk")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-md border bg-black/30 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] hover:bg-black/45"
            style={{ borderColor: accentByKey("monk").border, color: accentByKey("monk").text, boxShadow: `0 0 20px ${accentByKey("monk").glow}` }}
          >
            Join Challenge
          </motion.button>
        </div>
      </div>

    </div>
  );
}

function AffiliateSnapshotCard({
  themeMode,
  snapshots,
  onNavigate
}: {
  themeMode: ThemeMode;
  snapshots: DashboardSnapshots;
  onNavigate: (nav: DashboardNavKey) => void;
}) {
  const a = snapshots.affiliate;
  const [hoverMetric, setHoverMetric] = useState<string | null>(null);
  return (
    <Card
      themeMode={themeMode}
      title="Affiliate Portal Snapshot"
      frameVariant="shell"
      headerImageSrc="/assets/dashboard/affiliate.svg"
      right={
        <motion.button
          type="button"
          onClick={() => onNavigate("affiliate")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className="text-[10px] font-black uppercase tracking-[0.14em] text-[color:var(--gold)]/90"
        >
          Open →
        </motion.button>
      }
    >
      <div className="rounded-md border border-white/10 bg-black/35 p-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Referral link</div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="min-w-0 truncate text-[12px] font-semibold text-white/70">{a.referralLink ?? "—"}</div>
          <motion.button
            type="button"
            onClick={() => {
              if (a.referralLink) navigator.clipboard?.writeText(a.referralLink);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-md border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/70 hover:border-[rgba(197,179,88,0.45)] hover:text-[color:var(--gold)]/95"
          >
            Copy
          </motion.button>
        </div>
      </div>

      {/* Mini funnel visualization (hoverable) */}
      <div className="mt-3 rounded-md border border-[rgba(197,179,88,0.2)] bg-black/30 p-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Funnel</div>
          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[color:var(--gold)]/90">
            {hoverMetric ? hoverMetric : "hover"}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { k: "Infiltrations", v: a.clicks, pct: 100, tone: "rgba(197,179,88,0.65)" },
            { k: "Operatives", v: a.conversions, pct: Math.max(4, Math.min(100, Math.round((a.conversions / Math.max(1, a.clicks)) * 100))), tone: "rgba(255,215,0,0.5)" },
            { k: "Credits", v: `${a.earnings}`, pct: Math.max(8, Math.min(100, Math.round((a.earnings / 1200) * 100))), tone: "rgba(197,179,88,0.42)" }
          ].map((m) => (
            <motion.div
              key={m.k}
              onMouseEnter={() => setHoverMetric(`${m.k}: ${m.v}`)}
              onMouseLeave={() => setHoverMetric(null)}
              whileHover={{ y: -2 }}
              className="rounded-md border border-white/10 bg-black/35 p-2"
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">{m.k}</div>
              <div className="mt-1 font-mono text-[13px] font-black tabular-nums text-white/90">{String(m.v)}</div>
              <div className="mt-2 h-2 overflow-hidden rounded-full border border-white/10 bg-black/50">
                <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.tone, boxShadow: `0 0 18px ${m.tone}` }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          ["System infiltrations", a.clicks],
          ["Operatives synced", a.conversions],
          ["Mission points", a.earnings]
        ].map(([k, v]) => (
          <motion.div
            key={String(k)}
            whileHover={{ y: -2 }}
            className="rounded-md border border-white/10 bg-black/35 px-3 py-2 transition hover:border-[rgba(197,179,88,0.35)] hover:bg-black/60"
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">{k}</div>
            <div className="mt-1 font-mono text-[14px] font-black tabular-nums text-white/92">{String(v)}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-3 rounded-md border border-white/10 bg-black/35 p-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Recent</div>
        <div className="mt-2 space-y-2">
          {a.recent.slice(0, 3).map((r) => (
            <motion.div
              key={r.who + r.ts}
              whileHover={{ y: -2 }}
              className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-black/30 px-3 py-2 transition hover:border-[rgba(197,179,88,0.35)] hover:bg-black/60"
            >
              <div className="text-[12px] font-semibold text-white/80">
                {r.who} •{" "}
                <span
                  className="rounded-md border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]"
                  style={{
                    borderColor:
                      r.status === "purchased"
                        ? "rgba(197,179,88,0.55)"
                        : r.status === "joined"
                          ? "rgba(255,215,0,0.42)"
                          : "rgba(255,255,255,0.18)",
                    color:
                      r.status === "purchased"
                        ? "rgba(255,248,220,0.95)"
                        : r.status === "joined"
                          ? "#ffe7a1"
                          : "rgba(255,255,255,0.72)"
                  }}
                >
                  {r.status}
                </span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">{timeAgo(r.ts)}</div>
            </motion.div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <motion.button
            type="button"
            onClick={() => onNavigate("affiliate")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-md border border-[rgba(255,215,0,0.35)] bg-black/20 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--gold)]/90 hover:border-[rgba(255,215,0,0.7)]"
          >
            Quick Share
          </motion.button>
        </div>
      </div>
    </Card>
  );
}

function ActivityTimelineCard({ themeMode }: { themeMode: ThemeMode }) {
  const { items } = useActivityTimeline();
  const [recentDetailsOpen, setRecentDetailsOpen] = useState(false);
  const [fullLogOpen, setFullLogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const gold = "rgba(255, 215, 0, 0.85)";
  const goldSoft = "rgba(255, 215, 0, 0.42)";

  const recentWindowItems = useMemo(() => {
    const cutoff = nowMs - ACTIVITY_RECENT_WINDOW_MS;
    return items.filter((a) => a.ts >= cutoff).sort((a, b) => b.ts - a.ts);
  }, [items, nowMs]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    const t = window.setInterval(tick, 10_000);
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    if (!fullLogOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullLogOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullLogOpen]);

  useEffect(() => {
    if (!fullLogOpen || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullLogOpen]);

  const fullLogModal = mounted
    ? createPortal(
        <AnimatePresence>
          {fullLogOpen ? (
            <motion.div
              key="activity-full-log"
              className="fixed inset-0 z-[240] flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <button
                type="button"
                className="absolute inset-0 bg-black/72 backdrop-blur-sm"
                aria-label="Close activity log"
                onClick={() => setFullLogOpen(false)}
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="activity-full-log-title"
                className="relative z-[1] flex max-h-[min(85vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-[rgba(255,215,0,0.35)] bg-[#080808]/95 shadow-[0_0_48px_rgba(255,215,0,0.12)]"
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[rgba(255,215,0,0.2)] px-4 py-3">
                  <div>
                    <div
                      id="activity-full-log-title"
                      className="text-[11px] font-black uppercase tracking-[0.2em] text-[color:var(--goals-milestones-gold)]/95"
                    >
                      Full activity log
                    </div>
                    <div className="mt-0.5 text-[11px] text-white/45">
                      {items.length} entr{items.length === 1 ? "y" : "ies"} — same layout as timeline details
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFullLogOpen(false)}
                    className="rounded-md border border-[rgba(255,215,0,0.4)] bg-black/45 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[color:var(--goals-milestones-gold)]/95 transition hover:border-[rgba(255,215,0,0.65)]"
                  >
                    Close
                  </button>
                </div>
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden p-4 [scrollbar-color:rgba(255,215,0,0.4)_transparent]">
                  {items.length === 0 ? (
                    <p className="text-center text-[13px] leading-relaxed text-white/55">
                      Nothing logged yet. Switch sections, open Goals &amp; Milestones, pick a course, or visit another app
                      route.
                    </p>
                  ) : (
                    items.map((a) => (
                      <div
                        key={a.id}
                        className="rounded-md border border-[rgba(255,215,0,0.18)] bg-black/40 px-3 py-2.5"
                      >
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-[12px] font-semibold text-white/88">{a.title}</span>
                          <span className="rounded-md border border-[rgba(255,215,0,0.3)] bg-black/50 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-[color:var(--goals-milestones-gold)]/88">
                            {ACTIVITY_CAT_LABEL[a.category]}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/40">
                            {timeAgoCaps(a.ts)} · {formatActivityWhen(a.ts)}
                          </span>
                        </div>
                        {a.detail ? (
                          <div className="mt-1 text-[11px] leading-snug text-white/50">{a.detail}</div>
                        ) : null}
                        <div className="mt-2">
                          <ActivityEventDetailBlock a={a} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>,
        document.body
      )
    : null;

  return (
    <Card
      themeMode={themeMode}
      title="Activity Timeline"
      frameVariant="shell"
      right={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setFullLogOpen(true)}
            className="rounded-md border border-[rgba(255,215,0,0.45)] bg-black/40 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[color:var(--goals-milestones-gold)]/95 transition hover:border-[rgba(255,215,0,0.7)] hover:bg-black/55"
          >
            Full log
          </button>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--goals-milestones-gold)]/80">
            2 min
          </div>
        </div>
      }
    >
      {fullLogModal}
      <div className="min-h-[min(36vh,320px)] max-h-[min(62vh,620px)] overflow-y-auto overflow-x-hidden pr-1 [scrollbar-color:rgba(255,215,0,0.4)_transparent]">
        {items.length === 0 ? (
          <div className="rounded-md border border-[rgba(255,215,0,0.2)] bg-black/35 px-4 py-8 text-center text-[13px] leading-relaxed text-white/55">
            Your moves are logged automatically—open a section, a course, use quick search, or Goals &amp; Milestones. The card
            below will show the <span className="text-[color:var(--goals-milestones-gold)]/90">last 2 minutes</span>; use{" "}
            <span className="text-[color:var(--goals-milestones-gold)]/90">Full log</span> for everything else.
          </div>
        ) : recentWindowItems.length === 0 ? (
          <div className="rounded-md border border-[rgba(255,215,0,0.2)] bg-black/35 px-4 py-7 text-center text-[13px] leading-relaxed text-white/55">
            <p className="text-white/70">Nothing in the last 2 minutes.</p>
            <p className="mt-2 text-[12px] text-white/48">
              Older activity is still saved — open <span className="text-[color:var(--goals-milestones-gold)]/85">Full log</span>{" "}
              to review it.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-[rgba(255,215,0,0.28)] bg-black/40 px-3 py-3 md:px-4 md:py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2.5">
                <span
                  className="mt-[6px] inline-flex h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    background: gold,
                    boxShadow: `0 0 12px ${goldSoft}, 0 0 20px rgba(255,215,0,0.25)`
                  }}
                />
                <div className="min-w-0">
                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[color:var(--goals-milestones-gold)]/90">
                    Last 2 minutes
                  </div>
                  <p className="mt-1 text-[12px] leading-snug text-white/58">
                    <span className="font-semibold tabular-nums text-white/75">{recentWindowItems.length}</span>{" "}
                    {recentWindowItems.length === 1 ? "event" : "events"} · newest{" "}
                    <span className="text-white/55">{timeAgo(recentWindowItems[0]!.ts)}</span>
                  </p>
                  <ul className="mt-2 list-none space-y-1.5 p-0 text-[11px] text-white/55">
                    {recentWindowItems.slice(0, 5).map((a) => (
                      <li key={a.id} className="flex gap-2 border-l-2 border-[rgba(255,215,0,0.25)] pl-2">
                        <span className="shrink-0 font-mono text-[10px] text-white/40">
                          {new Date(a.ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                        <span className="min-w-0 text-white/70">
                          <span className="font-medium text-white/82">{a.title}</span>
                          {a.detail ? <span className="text-white/45"> — {a.detail}</span> : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {recentWindowItems.length > 5 ? (
                    <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-white/40">
                      +{recentWindowItems.length - 5} more in details
                    </p>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRecentDetailsOpen((o) => !o)}
                className="shrink-0 rounded border border-[rgba(255,215,0,0.45)] bg-black/45 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[color:var(--goals-milestones-gold)]/95 transition hover:border-[rgba(255,215,0,0.7)] hover:bg-black/60"
              >
                {recentDetailsOpen ? "Hide" : "Details"}
              </button>
            </div>
            <AnimatePresence initial={false}>
              {recentDetailsOpen ? (
                <motion.div
                  key="recent-activity-details"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-3 border-t border-[rgba(255,215,0,0.15)] pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                      Everything in this window — newest first
                    </p>
                    <div className="space-y-3">
                      {recentWindowItems.map((a) => (
                        <ActivityEventDetailBlock key={a.id} a={a} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function DashboardControlCenter({
  themeMode,
  userName,
  userRole,
  profileAvatar,
  courses,
  onNavigate
}: {
  themeMode: ThemeMode;
  userName: string;
  userRole: string;
  profileAvatar: string;
  courses: DashboardCourseLike[];
  onNavigate: (nav: DashboardNavKey) => void;
}) {
  const { snapshots } = useDashboardSnapshots({ userName, courses });
  const integrityHigh = snapshots.coreIntegrity.integrityPct > 90;

  return (
    <>
      <SyndicateReminderDueBanner onNavigate={onNavigate} />
      <div
        className={cn(
          "relative w-full max-w-none space-y-5 rounded-lg transition-[box-shadow] duration-700 md:space-y-6 lg:space-y-7",
          integrityHigh && "dashboard-integrity-pulse"
        )}
      >
        <div className="ghost-muted w-full min-w-0 max-w-none space-y-5 md:space-y-6 lg:space-y-7">
          <HeroStatusPanel
            themeMode={themeMode}
            userName={userName}
            userRole={userRole}
            profileAvatar={profileAvatar}
            snapshots={snapshots}
            onNavigate={onNavigate}
          />

          <SyndicateMissionsSnapshotCard themeMode={themeMode} onNavigate={onNavigate} />

          <MissionCommandDeckCard themeMode={themeMode} />

          <GoalPathSystem themeMode={themeMode} courses={courses} onNavigate={onNavigate} />

          <AffiliateSnapshotCard themeMode={themeMode} snapshots={snapshots} onNavigate={onNavigate} />

          <ActivityTimelineCard themeMode={themeMode} />
        </div>
      </div>
    </>
  );
}

