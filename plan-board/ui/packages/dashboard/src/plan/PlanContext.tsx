import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { fetchBoard, fetchPending, postFeedback } from "./api";
import { S } from "./strings";
import type { Board, FeedbackInput } from "./types";

interface PlanContextValue {
  board: Board | null;
  error: string | null;
  /** Bumped on every `changed` SSE event; graph loaders depend on it to refetch. */
  rev: number;
  pending: number;
  submit: (input: FeedbackInput) => Promise<boolean>;
  copyPending: () => Promise<void>;
  toast: (message: string) => void;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within a PlanProvider");
  return ctx;
}

const TOAST_MS = 4200;

export function PlanProvider({ children }: { children: ReactNode }) {
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rev, setRev] = useState(0);
  const [pending, setPending] = useState(0);
  const [toastText, setToastText] = useState<string | null>(null);
  const toastTimer = useRef<number>(0);

  const toast = useCallback((message: string) => {
    setToastText(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastText(null), TOAST_MS);
  }, []);

  const refreshBoard = useCallback(() => {
    fetchBoard()
      .then((b) => {
        setBoard(b);
        setError(null);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const refreshPending = useCallback(() => {
    fetchPending()
      .then((p) => setPending(p.pending))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (board) document.title = board.board.title;
  }, [board]);

  useEffect(() => {
    refreshBoard();
    refreshPending();
    const source = new EventSource("/api/events");
    source.addEventListener("changed", () => {
      refreshBoard();
      setRev((r) => r + 1);
    });
    source.addEventListener("inbox", refreshPending);
    return () => source.close();
  }, [refreshBoard, refreshPending]);

  const submit = useCallback(
    async (input: FeedbackInput) => {
      try {
        await postFeedback(input);
        refreshPending();
        return true;
      } catch {
        toast(S.sendFailed);
        return false;
      }
    },
    [refreshPending, toast],
  );

  const copyPending = useCallback(async () => {
    try {
      const { pending: count, text } = await fetchPending();
      setPending(count);
      if (count === 0) {
        toast(S.nothingPending);
        return;
      }
      await navigator.clipboard.writeText(text);
      toast(S.copied);
    } catch {
      toast(S.copyFailed);
    }
  }, [toast]);

  const value = useMemo(
    () => ({ board, error, rev, pending, submit, copyPending, toast }),
    [board, error, rev, pending, submit, copyPending, toast],
  );

  return (
    <PlanContext.Provider value={value}>
      {children}
      {toastText && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-[min(92vw,560px)] px-4 py-3 rounded-xl bg-elevated border border-accent/40 text-sm text-text-primary shadow-2xl animate-fade-slide-in"
        >
          {toastText}
        </div>
      )}
    </PlanContext.Provider>
  );
}
