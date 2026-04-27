"use client";

import { useEffect } from "react";
import { confirmPlaylistCheckoutSuccess } from "@/lib/streaming-api";

export function PlaylistCheckoutSync() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const status = (params.get("playlist_checkout") || "").trim();
    const sessionId = (params.get("session_id") || "").trim();
    if (status !== "success" || !sessionId) return;
    let cancelled = false;
    void (async () => {
      let confirmed = false;
      try {
        await confirmPlaylistCheckoutSuccess(sessionId);
        confirmed = true;
        try {
          window.sessionStorage.setItem("playlist_checkout_confirmed", "1");
        } catch {
          // Ignore storage exceptions.
        }
        window.dispatchEvent(new Event("playlist-checkout-confirmed"));
      } catch {
        // Ignore noisy errors here; dashboard data fetch will reflect final state.
      } finally {
        if (cancelled) return;
        // Keep query params for retry/debug only when confirmation failed.
        if (!confirmed) return;
        const clean = new URL(window.location.href);
        clean.searchParams.delete("playlist_checkout");
        clean.searchParams.delete("session_id");
        clean.searchParams.delete("playlist_id");
        window.history.replaceState({}, "", clean.toString());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
