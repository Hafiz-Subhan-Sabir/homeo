import { onSyndicatePersist, SYNDICATE_DASHBOARD_REFRESH_EVENT } from "@/lib/syndicateProgressSync";
import { syndicateUserStorageKey as ls } from "@/lib/syndicateStorageKeys";

const ACK_PREFIX = "syndicate:due_reminder_ack:";
const CHIME_PREFIX = "syndicate:due_chime_played:";

export type DueSyndicateReminder = {
  id: number;
  title: string;
  atIso: string;
  atMs: number;
};

function ackStorageKey(id: number, atIso: string) {
  return `${ACK_PREFIX}${id}:${atIso}`;
}

function chimeStorageKey(id: number, atIso: string) {
  return `${CHIME_PREFIX}${id}:${atIso}`;
}

export function acknowledgeDueSyndicateReminder(id: number, atIso: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ackStorageKey(id, atIso), "1");
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new CustomEvent(SYNDICATE_DASHBOARD_REFRESH_EVENT));
}

function isAcknowledged(id: number, atIso: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(ackStorageKey(id, atIso)) === "1";
  } catch {
    return false;
  }
}

function parseReminders(): Record<string, Record<string, unknown>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ls("mission_reminders_v1"));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, Record<string, unknown>> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v && typeof v === "object" && !Array.isArray(v)) out[k] = v as Record<string, unknown>;
    }
    return out;
  } catch {
    return {};
  }
}

/** Reminders whose scheduled time is at or before `nowMs`, excluding session acks. */
export function getDueSyndicateReminders(nowMs: number): DueSyndicateReminder[] {
  const obj = parseReminders();
  const out: DueSyndicateReminder[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const id = parseInt(k, 10);
    if (!Number.isFinite(id)) continue;
    const atIso = typeof v.atIso === "string" ? v.atIso : "";
    const title = typeof v.title === "string" ? v.title : "Mission reminder";
    if (!atIso) continue;
    const atMs = Date.parse(atIso);
    if (Number.isNaN(atMs) || atMs > nowMs) continue;
    if (isAcknowledged(id, atIso)) continue;
    out.push({ id, title, atIso, atMs });
  }
  return out.sort((a, b) => a.atMs - b.atMs);
}

export function snoozeSyndicateReminderMinutes(id: number, minutes: number): boolean {
  if (typeof window === "undefined" || !Number.isFinite(minutes) || minutes <= 0) return false;
  const raw = window.localStorage.getItem(ls("mission_reminders_v1"));
  if (!raw) return false;
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return false;
  }
  const key = String(id);
  const entry = obj[key];
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
  const o = entry as Record<string, unknown>;
  const atIso = typeof o.atIso === "string" ? o.atIso : "";
  const t = Date.parse(atIso);
  if (Number.isNaN(t)) return false;
  const base = Math.max(t, Date.now());
  const nextIso = new Date(base + minutes * 60_000).toISOString();
  o.atIso = nextIso;
  obj[key] = o;
  window.localStorage.setItem(ls("mission_reminders_v1"), JSON.stringify(obj));
  onSyndicatePersist();
  window.dispatchEvent(new CustomEvent(SYNDICATE_DASHBOARD_REFRESH_EVENT));
  return true;
}

/** One chime sequence per due `(id, atIso)` per tab session. */
export function markDueReminderChimePlayed(id: number, atIso: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(chimeStorageKey(id, atIso), "1");
  } catch {
    /* ignore */
  }
}

export function shouldPlayDueReminderChime(id: number, atIso: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(chimeStorageKey(id, atIso)) !== "1";
  } catch {
    return true;
  }
}

/** Short alert tones (may be blocked until user gesture on some browsers). */
export function playSyndicateReminderChime() {
  if (typeof window === "undefined") return;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const now = ctx.currentTime;
    const beep = (start: number, freq: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(freq, start);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(start);
      o.stop(start + 0.2);
    };
    beep(now, 880);
    beep(now + 0.22, 990);
    beep(now + 0.44, 740);
    void ctx.resume().catch(() => {
      /* autoplay policy */
    });
  } catch {
    /* ignore */
  }
}
