import { portalFetch } from "@/lib/portal-api";
import type { UploadCredentialsResponse } from "@/lib/vdocipher-upload";

export type CourseDto = {
  id: number;
  title: string;
  slug: string;
  description: string;
  is_published: boolean;
  allow_all_authenticated: boolean;
};

export type VideoDto = {
  id: number;
  title: string;
  course: number;
  vdocipher_id: string;
  order: number;
  status: string;
};

export type OtpResponse = {
  otp: string;
  playbackInfo: string;
  video_id: number;
  vdocipher_id: string;
};

const BASE = "/api/courses";
const VBASE = "/api/videos";

export async function fetchCoursesList() {
  return portalFetch<CourseDto[]>(`${BASE}/`);
}

export async function fetchCourseVideos(courseId: number) {
  return portalFetch<VideoDto[]>(`${BASE}/${courseId}/videos/`);
}

export async function fetchVideoOtp(videoId: number) {
  return portalFetch<OtpResponse>(`${VBASE}/${videoId}/otp/`);
}

export async function postVideoProgress(videoId: number, body: { position_seconds: number; completed?: boolean }) {
  return portalFetch<unknown>(`${VBASE}/${videoId}/progress/`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchUploadCredentials(title: string) {
  const q = new URLSearchParams({ title });
  return portalFetch<UploadCredentialsResponse>(`${VBASE}/upload-credentials/?${q.toString()}`);
}

export async function saveVideoMetadata(payload: {
  title: string;
  course_id: number;
  vdocipher_id: string;
  order: number;
  status: "ready" | "pending" | "uploading" | "failed";
}) {
  return portalFetch<VideoDto>(`${VBASE}/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createCourse(payload: {
  title: string;
  description?: string;
  is_published?: boolean;
  allow_all_authenticated?: boolean;
}) {
  return portalFetch<CourseDto>(`${BASE}/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
