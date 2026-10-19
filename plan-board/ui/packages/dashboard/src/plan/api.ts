import type { Board, FeedbackInput, PendingInbox } from "./types";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return (await res.json()) as T;
}

export const fetchBoard = (): Promise<Board> => getJson<Board>("/api/board");

export const fetchPending = (): Promise<PendingInbox> => getJson<PendingInbox>("/api/inbox/pending");

export async function postFeedback(input: FeedbackInput): Promise<void> {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
