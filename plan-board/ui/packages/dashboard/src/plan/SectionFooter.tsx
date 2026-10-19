import { useState } from "react";
import { usePlan } from "./PlanContext";
import { S } from "./strings";
import type { FeedbackKind, SectionRef } from "./types";

const BTN =
  "px-3.5 py-1.5 rounded-lg text-[13px] font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

export default function SectionFooter({ at }: { at: SectionRef }) {
  const { submit, toast } = usePlan();
  const [text, setText] = useState("");
  const trimmed = text.trim();

  const send = async (kind: FeedbackKind, body: string) => {
    if (await submit({ page: at.page, sec: at.sec, kind, text: body })) {
      setText("");
      toast(`${S.sent} ✓`);
    }
  };

  return (
    <div className="mt-6 pt-4 border-t border-border-subtle flex flex-col gap-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={S.commentPlaceholder}
        rows={2}
        maxLength={2000}
        className="w-full resize-y min-h-[52px] rounded-lg bg-root border border-border-subtle focus:border-accent/60 outline-none px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void send("comment", trimmed || S.agreeText)}
          className={`${BTN} bg-node-function/15 border-node-function/40 text-node-function hover:bg-node-function/25`}
        >
          👍 {S.agree}
        </button>
        <button
          type="button"
          disabled={!trimmed}
          onClick={() => void send("edit", trimmed)}
          className={`${BTN} bg-accent/10 border-accent/35 text-accent hover:bg-accent/20`}
        >
          ✏️ {S.edit}
        </button>
        <button
          type="button"
          disabled={!trimmed}
          onClick={() => void send("ask", trimmed)}
          className={`${BTN} bg-node-entity/10 border-node-entity/35 text-node-entity hover:bg-node-entity/20`}
        >
          ❓ {S.ask}
        </button>
      </div>
    </div>
  );
}
