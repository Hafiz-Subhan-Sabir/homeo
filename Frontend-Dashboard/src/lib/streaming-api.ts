import { portalFetch, resolveClientApiUrl } from "@/lib/portal-api";

export type StreamVideoPlayerLayout = "auto" | "landscape" | "portrait";

export type StreamVideoListItem = {
  id: number;
  title: string;
  description: string;
  price: string;
  thumbnail_url: string | null;
  status: string;
  /** Omitted on older API responses; treat as `"auto"`. */
  player_layout?: StreamVideoPlayerLayout;
  source_width?: number | null;
  source_height?: number | null;
  created_at: string;
};

export type StreamVideoDetail = StreamVideoListItem & {
  hls_path: string;
};

export type StreamPayload = {
  id: number;
  status: string;
  hls_url: string | null;
};

export type StreamPlaylistListItem = {
  id: number;
  title: string;
  slug: string;
  category: "business_model" | "business_psychology";
  description: string;
  price: string;
  rating: string;
  cover_image_url: string | null;
  video_count: number;
  is_published: boolean;
  is_coming_soon: boolean;
  is_unlocked?: boolean;
  created_at: string;
};

export type StreamPlaylistItemRow = {
  id: number;
  order: number;
  stream_video: StreamVideoListItem;
};

export type StreamPlaylistDetail = StreamPlaylistListItem & {
  items: StreamPlaylistItemRow[];
};

export type StreamPlaylistPurchaseHistoryItem = {
  id: number;
  playlist_id: number;
  playlist_title: string;
  status: "pending" | "paid" | "cancelled" | "failed" | string;
  amount_paid: string;
  currency: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

function errMessage(status: number, data: unknown, fallback: string): string {
  if (typeof data === "object" && data && "detail" in data) {
    return String((data as { detail?: string }).detail ?? fallback);
  }
  return fallback || `Request failed (${status}).`;
}

export async function fetchStreamVideosList(): Promise<StreamVideoListItem[]> {
  const res = await portalFetch<StreamVideoListItem[]>("/api/streaming/videos/");
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) return [];
    throw new Error(errMessage(res.status, res.data, "Could not load stream catalog."));
  }
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchStreamVideoDetail(id: number): Promise<StreamVideoDetail> {
  const res = await portalFetch<StreamVideoDetail>(`/api/streaming/videos/${id}/`);
  if (!res.ok) {
    throw new Error(
      errMessage(
        res.status,
        res.data,
        res.status === 401 || res.status === 403 ? "Sign in to watch this video." : "Could not load video."
      )
    );
  }
  return res.data as StreamVideoDetail;
}

export async function fetchStreamPlaylists(options?: { allowPublicFallback?: boolean }): Promise<StreamPlaylistListItem[]> {
  const res = await portalFetch<StreamPlaylistListItem[]>("/api/streaming/playlists/");
  if (res.ok) {
    return Array.isArray(res.data) ? res.data : [];
  }
  if (!options?.allowPublicFallback) {
    throw new Error(errMessage(res.status, res.data, "Could not load playlists."));
  }
  try {
    return await fetchPublicStreamPlaylists();
  } catch {
    throw new Error(errMessage(res.status, res.data, "Could not load playlists."));
  }
}

export async function fetchPublicStreamPlaylists(): Promise<StreamPlaylistListItem[]> {
  const url = resolveClientApiUrl("/api/streaming/public-playlists/");
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  const txt = await res.text();
  let data: unknown = [];
  try {
    data = txt ? (JSON.parse(txt) as unknown) : [];
  } catch {
    data = [];
  }
  if (!res.ok) {
    throw new Error(errMessage(res.status, data, "Could not load public playlists."));
  }
  return Array.isArray(data) ? (data as StreamPlaylistListItem[]) : [];
}

export async function createPlaylistCheckoutSession(
  playlistId: number,
  options?: { returnBaseUrl?: string }
): Promise<{ checkout_url?: string; session_id?: string; playlist_id?: number; is_unlocked?: boolean; message?: string }> {
  const res = await portalFetch<{ checkout_url?: string; session_id?: string; playlist_id?: number; is_unlocked?: boolean; message?: string; detail?: string }>(
    `/api/streaming/playlists/${playlistId}/checkout/`,
    { method: "POST", body: JSON.stringify({ return_base_url: options?.returnBaseUrl || "" }) }
  );
  if (!res.ok) {
    throw new Error(errMessage(res.status, res.data, "Could not start playlist checkout."));
  }
  return res.data ?? {};
}

export async function confirmPlaylistCheckoutSuccess(sessionId: string): Promise<{ playlist_id: number; is_unlocked: boolean; message?: string }> {
  const res = await portalFetch<{ playlist_id?: number; is_unlocked?: boolean; message?: string; detail?: string }>(
    "/api/streaming/playlists/checkout/success/",
    {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
    }
  );
  if (!res.ok || !res.data?.playlist_id) {
    throw new Error(errMessage(res.status, res.data, "Could not confirm playlist payment."));
  }
  return {
    playlist_id: Number(res.data.playlist_id),
    is_unlocked: !!res.data.is_unlocked,
    message: res.data.message,
  };
}

export async function fetchStreamPlaylistBillingHistory(): Promise<StreamPlaylistPurchaseHistoryItem[]> {
  const res = await portalFetch<StreamPlaylistPurchaseHistoryItem[]>("/api/streaming/playlists/purchases/");
  if (!res.ok) {
    throw new Error(
      errMessage(
        res.status,
        res.data,
        res.status === 401 || res.status === 403 ? "Sign in to view billing history." : "Could not load billing history."
      )
    );
  }
  return Array.isArray(res.data) ? res.data : [];
}

/** Playlists + plan bundles (Money Mastery, King) from `/api/auth/billing-purchases/`. Plan rows use `playlist_id: 0`. */
export async function fetchBillingPurchaseHistory(): Promise<StreamPlaylistPurchaseHistoryItem[]> {
  const res = await portalFetch<StreamPlaylistPurchaseHistoryItem[]>("/api/auth/billing-purchases/");
  if (!res.ok) {
    throw new Error(
      errMessage(
        res.status,
        res.data,
        res.status === 401 || res.status === 403 ? "Sign in to view billing history." : "Could not load billing history."
      )
    );
  }
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchStreamPlaylistDetail(id: number): Promise<StreamPlaylistDetail> {
  const res = await portalFetch<StreamPlaylistDetail>(`/api/streaming/playlists/${id}/`);
  if (!res.ok) {
    throw new Error(
      errMessage(
        res.status,
        res.data,
        res.status === 401 || res.status === 403 ? "Sign in to open this playlist." : "Could not load playlist."
      )
    );
  }
  return res.data as StreamPlaylistDetail;
}

export async function fetchStreamVideoPlayback(id: number): Promise<StreamPayload> {
  const res = await portalFetch<StreamPayload>(`/api/streaming/videos/stream/${id}/`);
  if (!res.ok) {
    throw new Error(
      errMessage(
        res.status,
        res.data,
        res.status === 401 || res.status === 403 ? "Sign in for playback." : "Could not load playback info."
      )
    );
  }
  return res.data as StreamPayload;
}
