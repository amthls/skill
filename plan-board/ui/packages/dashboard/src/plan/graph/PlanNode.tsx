import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";
import type { NodeType } from "@understand-anything/core/types";
import { typeColors, typeTextColors } from "../../components/CustomNode";

export const PLAN_NODE_WIDTH = 200;
export const PLAN_NODE_HEIGHT = 80;

export interface PlanNodeData extends Record<string, unknown> {
  label: string;
  nodeType: NodeType;
  summary: string;
  /** Accent colour of the node's layer (left bar). */
  layerColor: string;
  direction: "RIGHT" | "DOWN";
  selected: boolean;
  /** Current step of a flow player. */
  active: boolean;
  /** Shown only as 1-hop context, not matched by the filter. */
  context: boolean;
  /** Flow step numbers this node takes part in, e.g. "1" or "2·4". */
  stepBadge?: string;
  dimmed: boolean;
}

export type PlanFlowNode = Node<PlanNodeData, "plan">;

function PlanNodeComponent({ data }: NodeProps<PlanFlowNode>) {
  const horizontal = data.direction === "RIGHT";
  const ring = data.active
    ? "ring-2 ring-accent-bright bg-accent/10 shadow-[0_0_26px_var(--glow-accent-pulse)] scale-[1.05] z-10"
    : data.selected
      ? "ring-2 ring-accent node-glow"
      : "";
  const tone = data.context ? "border-dashed border-border-medium opacity-70" : "border-border-subtle";
  const fade = data.dimmed && !data.active ? "opacity-55" : "";

  return (
    <div
      className={`relative rounded-lg bg-elevated border ${tone} ${ring} ${fade} overflow-hidden cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.35)] transition-[transform,box-shadow,opacity] duration-300`}
      style={{ width: PLAN_NODE_WIDTH, height: PLAN_NODE_HEIGHT }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: data.layerColor }} />
      <Handle
        type="target"
        position={horizontal ? Position.Left : Position.Top}
        className="!bg-text-muted !w-2 !h-2 !border-0"
      />
      <div className="pl-4 pr-3 py-2 h-full flex flex-col justify-center">
        <div className={`text-[10px] font-semibold uppercase tracking-wider ${typeTextColors[data.nodeType] ?? ""}`}>
          {data.nodeType}
        </div>
        <div className="text-[15px] font-semibold text-text-primary truncate" title={data.label}>
          {data.label}
        </div>
        <div className="text-[11px] text-text-secondary mt-0.5 line-clamp-2 leading-snug">{data.summary}</div>
      </div>
      {data.stepBadge && (
        <span
          className="absolute top-1.5 right-1.5 min-w-5 h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-root"
          style={{ backgroundColor: data.active ? "var(--color-accent-bright)" : typeColors[data.nodeType] }}
        >
          {data.stepBadge}
        </span>
      )}
      <Handle
        type="source"
        position={horizontal ? Position.Right : Position.Bottom}
        className="!bg-text-muted !w-2 !h-2 !border-0"
      />
    </div>
  );
}

export default memo(PlanNodeComponent);
