"use client";

import { useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    VdoPlayer?: new (el: HTMLElement, opts: Record<string, unknown>) => { destroy?: () => void };
  }
}

type Props = {
  otp: string;
  playbackInfo: string;
  className?: string;
};

/**
 * VdoCipher iframe player (v2). OTP is single-use / short TTL — parent must refetch when switching videos.
 */
export function VdoCipherPlayer({ otp, playbackInfo, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!otp || !playbackInfo) {
      setErr("Missing playback token");
      return;
    }
    setErr(null);
  }, [otp, playbackInfo]);

  if (err) {
    return <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-red-500/30 bg-black/50 text-sm text-red-200">{err}</div>;
  }

  const src = `https://player.vdocipher.com/v2/?otp=${encodeURIComponent(otp)}&playbackInfo=${encodeURIComponent(playbackInfo)}`;

  return (
    <div className={className ?? ""}>
      <iframe
        ref={iframeRef}
        title={`vdocipher-${uid}`}
        src={src}
        className="aspect-video w-full rounded-lg border border-[color:var(--gold-neon-border-mid)] bg-black shadow-[0_0_40px_rgba(0,0,0,0.6)]"
        allow="encrypted-media; autoplay; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
