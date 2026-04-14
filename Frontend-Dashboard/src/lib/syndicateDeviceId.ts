import { syndicateUserStorageKey as ls } from "@/lib/syndicateStorageKeys";

function randomUuidV4(): string {
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  if (c && typeof c.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6]! & 0x0f) | 0x40;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Stable per-account device id for `/today/` missions (matches Syndicate panel). */
export function getSyndicateDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(ls("device_id"));
  if (!id) {
    id = randomUuidV4();
    window.localStorage.setItem(ls("device_id"), id);
  }
  return id;
}
