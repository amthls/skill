import { useState } from "react";
import { usePlan } from "../PlanContext";
import { S } from "../strings";
import type { DecisionBlock as DecisionBlockData, SectionRef } from "../types";

interface Props {
  block: DecisionBlockData;
  at: SectionRef;
}

export default function DecisionBlock({ block, at }: Props) {
  const { submit } = usePlan();
  const [sentId, setSentId] = useState<string | null>(null);
  const done = block.status === "done";

  const choose = async (optionId: string) => {
    if (done) return;
    const ok = await submit({ page: at.page, sec: block.id, kind: "choose", val: optionId });
    if (ok) setSentId(optionId);
  };

  const highlighted = done ? block.chosen : sentId;

  return (
    <div className="rounded-xl border border-border-medium bg-elevated/50 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="text-base font-semibold text-text-primary">
          <span aria-hidden>❓ </span>
          {block.question}
        </div>
        <span
          className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border ${
            done
              ? "text-node-function border-node-function/40 bg-node-function/10"
              : "text-accent border-accent/40 bg-accent/10"
          }`}
        >
          {done ? S.decisionDone : S.decisionOpen}
        </span>
      </div>

      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        {block.options.map((opt) => {
          const isChosen = highlighted === opt.id;
          const faded = done && !isChosen;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={done}
              onClick={() => void choose(opt.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                isChosen
                  ? "border-accent bg-accent/12 ring-1 ring-accent/60"
                  : faded
                    ? "border-border-subtle bg-surface/60 opacity-45 cursor-not-allowed"
                    : "border-border-subtle bg-surface hover:border-accent/60 hover:bg-accent/5 cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <span
                  aria-hidden
                  className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    isChosen ? "border-accent" : "border-text-muted"
                  }`}
                >
                  {isChosen && <span className="w-2 h-2 rounded-full bg-accent" />}
                </span>
                {opt.label}
              </div>
              {opt.desc && <div className="text-[13px] text-text-secondary mt-1.5 leading-snug pl-6">{opt.desc}</div>}
            </button>
          );
        })}
      </div>

      {done && block.note && (
        <p className="mt-4 text-[13px] text-text-secondary border-l-2 border-accent/60 pl-3 leading-relaxed">
          {block.note}
        </p>
      )}
      {!done && sentId && (
        <p className="mt-4 text-[13px] text-accent flex items-center gap-2">
          <span aria-hidden>⏳</span> {S.decisionSent}
        </p>
      )}
    </div>
  );
}
