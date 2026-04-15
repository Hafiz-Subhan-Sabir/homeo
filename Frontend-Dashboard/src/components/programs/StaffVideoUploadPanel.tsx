"use client";

import { useCallback, useState } from "react";
import { createCourse, fetchCoursesList, fetchUploadCredentials, saveVideoMetadata } from "@/lib/courses-api";
import { uploadFileToVdoCipher } from "@/lib/vdocipher-upload";
import { cn } from "@/components/dashboard/dashboardPrimitives";

type Props = {
  isStaff: boolean;
  onCourseCreated?: () => void;
};

export function StaffVideoUploadPanel({ isStaff, onCourseCreated }: Props) {
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState<number | "">("");
  const [order, setOrder] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"idle" | "cred" | "upload" | "save" | "done" | "err">("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const [newCourseTitle, setNewCourseTitle] = useState("");

  const refreshCourses = useCallback(async () => {
    const res = await fetchCoursesList();
    if (res.ok && Array.isArray(res.data)) {
      onCourseCreated?.();
    }
  }, [onCourseCreated]);

  const runUpload = useCallback(async () => {
    if (!isStaff || !file || !title.trim() || courseId === "") {
      setMsg("Choose a course, title, and video file.");
      return;
    }
    setMsg(null);
    setPhase("cred");
    setProgress(0);
    const credRes = await fetchUploadCredentials(title.trim());
    if (!credRes.ok) {
      setPhase("err");
      setMsg(
        typeof credRes.data === "object" && credRes.data && "detail" in (credRes.data as object)
          ? String((credRes.data as { detail?: string }).detail)
          : "Could not get upload credentials."
      );
      return;
    }
    const raw = credRes.data as import("@/lib/vdocipher-upload").UploadCredentialsResponse & { videoId?: string; video_id?: string };
    const creds: import("@/lib/vdocipher-upload").UploadCredentialsResponse = {
      clientPayload: raw.clientPayload,
      videoId: raw.videoId ?? raw.video_id ?? "",
    };
    const videoId = creds.videoId;
    if (!videoId) {
      setPhase("err");
      setMsg("Invalid credentials response (missing videoId).");
      return;
    }
    try {
      setPhase("upload");
      await uploadFileToVdoCipher(creds, file, (loaded, total) => {
        setProgress(total ? Math.round((loaded / total) * 100) : 0);
      });
      setPhase("save");
      const save = await saveVideoMetadata({
        title: title.trim(),
        course_id: Number(courseId),
        vdocipher_id: videoId,
        order,
        status: "ready",
      });
      if (!save.ok) {
        setPhase("err");
        setMsg(
          typeof save.data === "object" && save.data && "detail" in (save.data as object)
            ? String((save.data as { detail?: string }).detail)
            : "Saved upload but metadata failed."
        );
        return;
      }
      setPhase("done");
      setMsg("Video registered. It may take a minute to transcode before playback.");
      setFile(null);
      setTitle("");
      void refreshCourses();
    } catch (e) {
      setPhase("err");
      setMsg(e instanceof Error ? e.message : "Upload failed");
    }
  }, [courseId, file, isStaff, order, refreshCourses, title]);

  const createNewCourse = useCallback(async () => {
    if (!newCourseTitle.trim()) return;
    const res = await createCourse({ title: newCourseTitle.trim(), is_published: true });
    if (res.ok && res.data && typeof res.data === "object" && "id" in res.data) {
      setCourseId(Number((res.data as { id: number }).id));
      setNewCourseTitle("");
      void refreshCourses();
    }
  }, [newCourseTitle, refreshCourses]);

  if (!isStaff) return null;

  return (
    <section className="rounded-2xl border border-cyan-400/25 bg-[linear-gradient(165deg,rgba(0,40,55,0.5),rgba(0,0,0,0.85))] p-4 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.08)] sm:p-5">
      <h3 className="text-[13px] font-black uppercase tracking-[0.16em] text-cyan-200/90">Staff · Upload to VdoCipher</h3>
      <p className="mt-1 text-[12px] text-white/55">Large files go direct to VdoCipher — not through Django.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={newCourseTitle}
          onChange={(e) => setNewCourseTitle(e.target.value)}
          placeholder="New course title"
          className="min-w-[12rem] flex-1 rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-[13px] text-white"
        />
        <button
          type="button"
          onClick={() => void createNewCourse()}
          className="rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-cyan-100"
        >
          Create course
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-[11px] font-bold uppercase text-white/50">
          Course ID
          <input
            type="number"
            value={courseId === "" ? "" : courseId}
            onChange={(e) => setCourseId(e.target.value === "" ? "" : Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-[14px] text-white"
            placeholder="e.g. 1"
          />
        </label>
        <label className="block text-[11px] font-bold uppercase text-white/50">
          Sort order
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-[14px] text-white"
          />
        </label>
      </div>

      <label className="mt-3 block text-[11px] font-bold uppercase text-white/50">
        Video title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-[14px] text-white"
        />
      </label>

      <div className="mt-3">
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-[13px] text-white/80 file:mr-3 file:rounded-md file:border file:border-[color:var(--gold-neon-border-mid)] file:bg-black/60 file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-[color:var(--gold)]"
        />
      </div>

      {phase === "upload" || phase === "cred" || phase === "save" ? (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-[linear-gradient(90deg,#22d3ee,#facc15)] transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void runUpload()}
          disabled={phase === "upload" || phase === "cred" || phase === "save"}
          className={cn(
            "rounded-lg border px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em]",
            "border-[color:var(--gold-neon-border)] bg-[rgba(250,204,21,0.14)] text-[color:var(--gold)]",
            (phase === "upload" || phase === "cred" || phase === "save") && "opacity-50"
          )}
        >
          {phase === "upload" ? "Uploading…" : phase === "save" ? "Saving…" : "Upload & register"}
        </button>
        <button
          type="button"
          onClick={() => {
            setPhase("idle");
            setMsg(null);
            setProgress(0);
          }}
          className="rounded-lg border border-white/20 px-4 py-2 text-[12px] text-white/75"
        >
          Reset
        </button>
      </div>

      {msg ? <p className="mt-3 text-[13px] text-white/75">{msg}</p> : null}
    </section>
  );
}
