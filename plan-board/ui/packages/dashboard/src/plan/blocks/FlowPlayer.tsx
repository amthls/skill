import { S } from "../strings";
import type { FlowStep } from "../types";

export const SPEEDS = [0.5, 1, 2] as const;
export type Speed = (typeof SPEEDS)[number];

interface Props {
  steps: FlowStep[];
  index: number;
  playing: boolean;
  speed: Speed;
  onIndex: (i: number) => void;
  onTogglePlay: () => void;
  onSpeed: (s: Speed) => void;
}

const ROUND_BTN =
  "w-9 h-9 rounded-full flex items-center justify-center border border-border-medium text-text-primary hover:bg-elevated transition-colors disabled:opacity-35 disabled:cursor-not-allowed";

export default function FlowPlayer({ steps, index, playing, speed, onIndex, onTogglePlay, onSpeed }: Props) {
  const step = steps[index];
  const last = steps.length - 1;

  return (
    <div className="border-t border-border-subtle bg-surface p-3 sm:p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button type="button" className={ROUND_BTN} disabled={index === 0} onClick={() => onIndex(index - 1)} aria-label={S.prev}>
            ⏮
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={playing ? S.pause : S.play}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-accent text-root text-lg hover:bg-accent-bright transition-colors"
          >
            {playing ? "⏸" : "▶"}
          </button>
          <button type="button" className={ROUND_BTN} disabled={index === last} onClick={() => onIndex(index + 1)} aria-label={S.next}>
            ⏭
          </button>
        </div>

        <ol className="flex flex-1 min-w-[120px] items-center gap-1.5">
          {steps.map((s, i) => (
            <li key={`${s.nodeId}-${i}`} className="flex-1">
              <button
                type="button"
                onClick={() => onIndex(i)}
                aria-label={`${S.flowStep} ${i + 1}: ${s.label}`}
                className={`block w-full h-2 rounded-full transition-colors ${
                  i === index ? "bg-accent-bright" : i < index ? "bg-accent/60" : "bg-border-medium hover:bg-accent/30"
                }`}
              />
            </li>
          ))}
        </ol>

        <div className="flex items-center gap-1 rounded-lg bg-elevated p-0.5" role="group" aria-label={S.speed}>
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSpeed(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                speed === s ? "bg-accent/20 text-accent" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 sm:gap-4 items-start rounded-xl bg-elevated/60 border border-border-subtle p-3 sm:p-4">
        <span className="shrink-0 w-10 h-10 rounded-full bg-accent/15 border border-accent/50 text-accent font-bold flex items-center justify-center">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-wider text-text-muted">
            {S.flowStep} {index + 1}/{steps.length}
          </div>
          <div className="font-heading text-base text-text-primary">{step.label}</div>
          {(step.in || step.out) && (
            <dl className="mt-2 grid gap-2 sm:grid-cols-2 text-xs">
              {step.in && <IoBox label={S.flowIn} value={step.in} />}
              {step.out && <IoBox label={S.flowOut} value={step.out} />}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}

function IoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-root border border-border-subtle px-3 py-2 min-w-0">
      <dt className="text-[10px] uppercase tracking-wider text-accent mb-0.5">{label}</dt>
      <dd className="font-mono text-text-secondary break-words">{value}</dd>
    </div>
  );
}
