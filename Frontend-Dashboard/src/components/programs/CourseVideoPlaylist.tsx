"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { VdoCipherPlayer } from "@/components/programs/VdoCipherPlayer";
import { fetchCourseVideos, fetchVideoOtp, postVideoProgress, type VideoDto } from "@/lib/courses-api";
import { cn } from "@/components/dashboard/dashboardPrimitives";

type Props = {
  courseId: number;
  courseTitle: string;
  autoAdvance?: boolean;
};

export function CourseVideoPlaylist({ courseId, courseTitle, autoAdvance = true }: Props) {
  const [videos, setVideos] = useState<VideoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [otpPack, setOtpPack] = useState<{ otp: string; playbackInfo: string } | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);

  const active = videos[activeIdx] ?? null;

  const loadList = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const res = await fetchCourseVideos(courseId);
    if (!res.ok) {
      setErr(typeof res.data === "object" && res.data && "detail" in (res.data as object) ? String((res.data as { detail?: string }).detail) : `Failed (${res.status})`);
      setVideos([]);
      setLoading(false);
      return;
    }
    const list = (Array.isArray(res.data) ? res.data : []) as VideoDto[];
    setVideos(list);
    setActiveIdx(0);
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const loadOtp = useCallback(async (video: VideoDto) => {
    setOtpLoading(true);
    setOtpPack(null);
    const res = await fetchVideoOtp(video.id);
    if (!res.ok) {
      setErr(typeof res.data === "object" && res.data && "detail" in (res.data as object) ? String((res.data as { detail?: string }).detail) : `OTP failed (${res.status})`);
      setOtpLoading(false);
      return;
    }
    const d = res.data as { otp?: string; playbackInfo?: string };
    if (d.otp && d.playbackInfo) setOtpPack({ otp: d.otp, playbackInfo: d.playbackInfo });
    setOtpLoading(false);
  }, []);

  useEffect(() => {
    if (!active) return;
    void loadOtp(active);
  }, [active, loadOtp]);

  const goNext = useCallback(() => {
    if (!active) return;
    void postVideoProgress(active.id, { position_seconds: 0, completed: true });
    if (!autoAdvance || activeIdx >= videos.length - 1) return;
    setActiveIdx((i) => i + 1);
  }, [active, activeIdx, autoAdvance, videos.length]);

  const title = useMemo(() => courseTitle, [courseTitle]);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-10 text-center text-sm text-white/60">
        Loading course videos…
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-xl border border-red-500/35 bg-red-950/20 px-4 py-6 text-[14px] text-red-100/90">
        {err}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="rounded-xl border border-amber-500/25 bg-black/35 px-4 py-8 text-center text-[14px] text-white/65">
        No published videos for this course yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start">
      <nav aria-label="Course playlist" className="flex flex-col gap-1 rounded-xl border border-[color:var(--gold-neon-border-mid)]/35 bg-black/45 p-2">
        <div className="border-b border-white/10 px-2 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-[color:var(--gold)]/85">{title}</div>
        <ul className="max-h-[min(60vh,520px)] space-y-1 overflow-y-auto pr-1">
          {videos.map((v, i) => (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => setActiveIdx(i)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2.5 text-left text-[13px] font-semibold transition",
                  i === activeIdx
                    ? "border-[color:var(--gold-neon-border)] bg-[rgba(250,204,21,0.12)] text-[color:var(--gold)]"
                    : "border-transparent text-white/75 hover:border-white/15 hover:bg-white/5"
                )}
              >
                <span className="mr-2 font-mono text-[11px] text-white/40">{i + 1}.</span>
                {v.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 space-y-3">
        {active ? (
          <div>
            <h3 className="mb-2 text-[clamp(1rem,2vw+0.5rem,1.25rem)] font-black text-white/95">{active.title}</h3>
            {otpLoading || !otpPack ? (
              <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-white/10 bg-black/50 text-sm text-white/55">
                {otpLoading ? "Preparing secure player…" : "Loading…"}
              </div>
            ) : (
              <VdoCipherPlayer otp={otpPack.otp} playbackInfo={otpPack.playbackInfo} />
            )}
            <p className="mt-2 text-[11px] text-white/45">
              Playback is DRM-protected. Token refreshes when you switch lessons.
            </p>
            {autoAdvance && activeIdx < videos.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="mt-3 text-[12px] font-semibold text-cyan-200/85 underline-offset-4 hover:underline"
              >
                Mark complete &amp; play next
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
