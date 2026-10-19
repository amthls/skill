import { usePlan } from "./PlanContext";
import { S } from "./strings";

/** Top-bar button: copies the pending feedback for pasting into Claude Code. */
export default function SendButton() {
  const { pending, copyPending } = usePlan();
  return (
    <button
      type="button"
      onClick={() => void copyPending()}
      title={S.send}
      className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 transition-colors whitespace-nowrap"
    >
      <span aria-hidden>📤</span>
      <span className="hidden sm:inline">{S.send}</span>
      {pending > 0 && (
        <span className="min-w-5 h-5 px-1.5 rounded-full bg-accent text-root text-[11px] font-bold flex items-center justify-center">
          {pending}
        </span>
      )}
    </button>
  );
}
