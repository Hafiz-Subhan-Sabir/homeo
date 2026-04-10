import { getSyndicateUserId } from "./syndicateAuth";

/** Prefix all Syndicate client state so each logged-in account has its own dashboard data. */
export function syndicateUserStorageKey(suffix: string): string {
  const id = getSyndicateUserId();
  if (id == null) return `syndicate:anon:${suffix}`;
  return `syndicate:u${id}:${suffix}`;
}
