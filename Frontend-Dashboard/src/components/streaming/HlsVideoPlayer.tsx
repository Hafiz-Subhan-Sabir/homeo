"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { getAuthorizationHeader } from "@/lib/portal-api";

export type HlsPlayerLayoutMode = "auto" | "landscape" | "portrait";

type Props = {
  src: string;
  className?: string;
  /**
   * Send portal JWT or DRF token on every HLS request (required for /api/streaming/videos/hls/...).
   * Native Safari HLS cannot set this header; use a Chromium-based browser for protected streams.
   */
  requireAuthHeaders?: boolean;
  onMetadata?: (size: { width: number; height: number }) => void;
  /** From API / admin: auto uses decoded video pixels; landscape/portrait fix a 16:9 or 9:16 frame. */
  playerLayout?: HlsPlayerLayoutMode;
  /** Hint from transcoding (ffprobe); refined when the browser fires loadedmetadata. */
  sourceWidth?: number | null;
  sourceHeight?: number | null;
  onTimeProgress?: (payload: { currentTime: number; duration: number }) => void;
  onPlaybackEnded?: () => void;
  startAtSeconds?: number;
  onSeekSegment?: (payload: { from: number; to: number; duration: number }) => void;
  seekRequest?: { id: number; seconds: number; autoplay?: boolean } | null;
};

/**
 * HLS playback with auth headers on segment requests.
 *
 * **Limits:** Browser video cannot reliably block downloads, screen capture, or force a black recording.
 * Mitigations here are UX friction + watermarking. For studio-grade restrictions use a DRM provider
 * (Widevine / FairPlay) with encrypted DASH or HLS and a license service.
 */
export default function HlsVideoPlayer({
  src,
  className,
  requireAuthHeaders = true,
  onMetadata,
  playerLayout = "auto",
  sourceWidth = null,
  sourceHeight = null,
  onTimeProgress,
  onPlaybackEnded,
  startAtSeconds = 0,
  onSeekSegment,
  seekRequest = null
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [measured, setMeasured] = useState<{ width: number; height: number } | null>(null);
  const onMetadataRef = useRef(onMetadata);
  const suppressNextSeekEventRef = useRef(false);
  const lastSeekStartRef = useRef(0);
  useEffect(() => {
    onMetadataRef.current = onMetadata;
  }, [onMetadata]);

  useEffect(() => {
    setMeasured(null);
  }, [src]);

  const aspect = useMemo(() => {
    if (playerLayout === "landscape") return { w: 16, h: 9 };
    if (playerLayout === "portrait") return { w: 9, h: 16 };
    if (measured && measured.width > 0 && measured.height > 0) {
      return { w: measured.width, h: measured.height };
    }
    const sw = sourceWidth ?? null;
    const sh = sourceHeight ?? null;
    if (sw && sh && sw > 0 && sh > 0) return { w: sw, h: sh };
    return { w: 16, h: 9 };
  }, [playerLayout, measured, sourceWidth, sourceHeight]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    const emitMetadata = () => {
      const width = Number(video.videoWidth || 0);
      const height = Number(video.videoHeight || 0);
      if (width > 0 && height > 0) {
        setMeasured({ width, height });
        onMetadataRef.current?.({ width, height });
      }
      if (startAtSeconds > 0 && Number.isFinite(video.duration) && video.duration > 0) {
        const target = Math.min(Math.max(0, startAtSeconds), Math.max(0, video.duration - 1));
        if (target > 0) {
          suppressNextSeekEventRef.current = true;
          video.currentTime = target;
        }
      }
    };
    const emitTimeProgress = () => {
      const currentTime = Number(video.currentTime || 0);
      const duration = Number(video.duration || 0);
      if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) return;
      onTimeProgress?.({ currentTime, duration });
    };
    const emitEnded = () => {
      onPlaybackEnded?.();
    };
    const onSeeking = () => {
      lastSeekStartRef.current = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    };
    const onSeeked = () => {
      const to = Number.isFinite(video.currentTime) ? video.currentTime : 0;
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      if (suppressNextSeekEventRef.current) {
        suppressNextSeekEventRef.current = false;
        return;
      }
      if (duration > 0 && to - lastSeekStartRef.current > 2) {
        onSeekSegment?.({ from: Math.max(0, lastSeekStartRef.current), to: Math.min(duration, to), duration });
      }
    };
    video.addEventListener("loadedmetadata", emitMetadata);
    video.addEventListener("timeupdate", emitTimeProgress);
    video.addEventListener("ended", emitEnded);
    video.addEventListener("seeking", onSeeking);
    video.addEventListener("seeked", onSeeked);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        startFragPrefetch: true,
        maxBufferLength: 20,
        backBufferLength: 10
      });
      if (requireAuthHeaders) {
        hls.config.xhrSetup = (xhr) => {
          const auth = getAuthorizationHeader();
          if (auth) xhr.setRequestHeader("Authorization", auth);
        };
      }
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            hls.destroy();
          }
        }
      });
      return () => {
        video.removeEventListener("loadedmetadata", emitMetadata);
        video.removeEventListener("timeupdate", emitTimeProgress);
        video.removeEventListener("ended", emitEnded);
        video.removeEventListener("seeking", onSeeking);
        video.removeEventListener("seeked", onSeeked);
        hls.destroy();
      };
    }

    // No MSE: fall back to native HLS (cannot attach Authorization — protected URLs will fail).
    video.src = src;
    return () => {
      video.removeEventListener("loadedmetadata", emitMetadata);
      video.removeEventListener("timeupdate", emitTimeProgress);
      video.removeEventListener("ended", emitEnded);
      video.removeEventListener("seeking", onSeeking);
      video.removeEventListener("seeked", onSeeked);
    };
  }, [src, requireAuthHeaders, onPlaybackEnded, onSeekSegment, onTimeProgress]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !seekRequest || !Number.isFinite(seekRequest.seconds)) return;
    const applySeek = () => {
      const duration = Number(video.duration || 0);
      if (!Number.isFinite(duration) || duration <= 0) return;
      const target = Math.min(Math.max(0, seekRequest.seconds), Math.max(0, duration - 0.05));
      suppressNextSeekEventRef.current = true;
      video.currentTime = target;
      if (seekRequest.autoplay) {
        void video.play().catch(() => {
          // Browser autoplay restrictions may block this in some states.
        });
      }
    };
    if (Number.isFinite(video.duration) && video.duration > 0) {
      applySeek();
      return;
    }
    const onLoadedMetadata = () => applySeek();
    video.addEventListener("loadedmetadata", onLoadedMetadata, { once: true });
    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [seekRequest]);

  return (
    <div
      className={cn(
        "relative isolate mx-auto max-h-[min(58vh,640px)] max-w-full w-auto overflow-hidden sm:max-h-[min(62vh,720px)]",
        className
      )}
      style={{ aspectRatio: `${aspect.w} / ${aspect.h}` }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-[radial-gradient(120%_85%_at_18%_0%,rgba(245,200,20,0.26),transparent_52%),radial-gradient(95%_75%_at_100%_100%,rgba(34,211,238,0.24),transparent_55%),linear-gradient(160deg,rgba(0,0,0,0.88),rgba(7,7,12,0.95))]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.16)_34%,transparent_52%)] opacity-55"
        aria-hidden
      />
      <video
        ref={videoRef}
        className="relative z-[1] h-full w-full bg-transparent object-contain [accent-color:#ef4444]"
        controls
        preload="auto"
        playsInline
        controlsList="nodownload"
        disablePictureInPicture
        disableRemotePlayback
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  );
}
