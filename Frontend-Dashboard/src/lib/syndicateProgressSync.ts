/**
 * Server-backed Syndicate dashboard state (see Django `SyndicateUserProgress`).
 * Bonus/admin tasks stay shared; everything else is per authenticated user.
 */
import { patchSyndicateProgress } from "@/app/challenges/services/challengesApi";
import { syndicateUserStorageKey as ls } from "@/lib/syndicateStorageKeys";

/** Mirrors Backend `SYNDICATE_ALLOWED_STATE_KEYS` and excludes per-browser `device_id`. */
export const SYNDICATE_SYNCED_KEYS = [
  "points_history_v1",
  "challenge_day_v1",
  "completed_challenge_ids",
  "points_total",
  "challenge_responses",
  "mission_started_at_v1",
  "redeemed_rewards_v1",
  "pounds_balance_v1",
  "mission_scores_v1",
  "mission_awarded_points_v1",
  "mission_completion_log_v1",
  "streak_before_break",
  "streak_break_date",
  "display_name",
  "profile_image_url",
  "mission_reminders_v1"
] as const;

const KEY_SET = new Set<string>(SYNDICATE_SYNCED_KEYS);

let pushTimer: number | null = null;

export function collectSyncedState(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const out: Record<string, string> = {};
  for (const key of SYNDICATE_SYNCED_KEYS) {
    const v = window.localStorage.getItem(ls(key));
    if (v != null) out[key] = v;
  }
  return out;
}

/**
 * Merge server `mission_reminders_v1` with local so unsynced future reminders are not wiped
 * when the server payload is empty or lagging. Server entries win on key conflicts.
 */
export function mergeMissionRemindersV1(localRaw: string | null, serverRaw: string): string {
  let loc: Record<string, unknown> = {};
  let srv: Record<string, unknown> = {};
  try {
    if (localRaw) loc = JSON.parse(localRaw) as Record<string, unknown>;
  } catch {
    loc = {};
  }
  try {
    if (serverRaw && serverRaw !== "null") srv = JSON.parse(serverRaw) as Record<string, unknown>;
  } catch {
    srv = {};
  }
  const now = Date.now();

  if (Object.keys(srv).length === 0 && Object.keys(loc).length > 0) {
    const hasFuture = Object.values(loc).some((e) => {
      if (!e || typeof e !== "object" || Array.isArray(e)) return false;
      const at = typeof (e as { atIso?: unknown }).atIso === "string" ? (e as { atIso: string }).atIso : "";
      const t = Date.parse(at);
      return !Number.isNaN(t) && t > now;
    });
    if (hasFuture) return JSON.stringify(loc);
  }

  const out: Record<string, unknown> = { ...loc, ...srv };
  return JSON.stringify(out);
}

export function applySyncedStateFromServer(server: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  for (const [key, value] of Object.entries(server)) {
    if (!KEY_SET.has(key)) continue;
    if (key === "mission_reminders_v1") {
      const serverStr = value === null || value === undefined ? "{}" : typeof value === "string" ? value : String(value);
      const localRaw = window.localStorage.getItem(ls(key));
      const merged = mergeMissionRemindersV1(localRaw, serverStr);
      window.localStorage.setItem(ls(key), merged);
      if (merged !== serverStr) {
        onSyndicatePersist();
      }
      continue;
    }
    if (value === null || value === undefined) {
      window.localStorage.removeItem(ls(key));
    } else {
      window.localStorage.setItem(ls(key), typeof value === "string" ? value : String(value));
    }
  }
}

function scheduleSyndicateProgressPush() {
  if (typeof window === "undefined") return;
  if (pushTimer != null) window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    pushTimer = null;
    void patchSyndicateProgress(collectSyncedState()).catch(() => {
      /* offline */
    });
  }, 600);
}

export function onSyndicatePersist() {
  scheduleSyndicateProgressPush();
}
