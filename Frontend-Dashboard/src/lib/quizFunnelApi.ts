import { getSyndicateApiBase } from "@/lib/syndicateApiBase";

const REQUEST_TIMEOUT_MS = 10000;
const SUBMIT_TIMEOUT_MS = 90000;

function buildApiUrl(path: string): string {
  const base = getSyndicateApiBase().replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out. Please check backend connection.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchQuestions(): Promise<
  Array<{ id: number; question: string; options: string[] }>
> {
  const response = await fetchWithTimeout(buildApiUrl("/quiz-questions"), { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch quiz questions");
  }
  return response.json();
}

export async function submitAnswers(payload: unknown): Promise<Record<string, unknown>> {
  const response = await fetchWithTimeout(
    buildApiUrl("/submit-answers"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    SUBMIT_TIMEOUT_MS,
  );

  if (!response.ok) {
    throw new Error("Failed to submit quiz answers");
  }
  return response.json();
}
