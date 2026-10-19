import { useState } from "react";
import type { GraphEdge, GraphNode } from "@understand-anything/core/types";
import { typeTextColors } from "../../components/CustomNode";
import { usePlan } from "../PlanContext";
import { S } from "../strings";
import type { SectionRef } from "../types";

interface Props {
  node: GraphNode;
  edges: GraphEdge[];
  nodesById: Map<string, GraphNode>;
  layerName: string | null;
  at: SectionRef;
  /** Undefined hides the button (e.g. when the node comes from the UA graph). */
  onOpenInArch?: () => void;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export default function GraphNodePanel({ node, edges, nodesById, layerName, at, onOpenInArch, onSelect, onClose }: Props) {
  const { submit, toast } = usePlan();
  const [text, setText] = useState("");

  const links = edges
    .filter((e) => e.source === node.id || e.target === node.id)
    .map((e) => {
      const outgoing = e.source === node.id;
      const other = nodesById.get(outgoing ? e.target : e.source);
      return other ? { id: other.id, name: other.name, outgoing, type: e.type } : null;
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    if (await submit({ page: at.page, sec: at.sec, node: node.id, kind: "comment", text: body })) {
      setText("");
      toast(`${S.sent} ✓`);
    }
  };

  return (
    <aside className="absolute z-10 inset-x-2 bottom-2 top-12 sm:inset-x-auto sm:right-3 sm:top-3 sm:bottom-3 sm:w-[310px] rounded-xl bg-surface/95 backdrop-blur border border-border-medium shadow-2xl flex flex-col overflow-hidden">
      <header className="flex items-start justify-between gap-2 px-4 pt-3 pb-2 border-b border-border-subtle">
        <div className="min-w-0">
          <div className={`text-[10px] font-semibold uppercase tracking-wider ${typeTextColors[node.type] ?? ""}`}>
            {node.type}
            {layerName && <span className="text-text-muted"> · {layerName}</span>}
          </div>
          <h4 className="font-heading text-base text-text-primary break-words">{node.name}</h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={S.close}
          className="shrink-0 w-7 h-7 rounded-md text-text-muted hover:text-text-primary hover:bg-elevated"
        >
          ✕
        </button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 text-[13px] text-text-secondary leading-relaxed space-y-3">
        {node.summary && <p>{node.summary}</p>}
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          <dt className="text-text-muted">{S.complexity}</dt>
          <dd>{node.complexity}</dd>
          {node.filePath && (
            <>
              <dt className="text-text-muted">{S.filePath}</dt>
              <dd className="font-mono break-all">{node.filePath}</dd>
            </>
          )}
        </dl>
        {links.length > 0 && (
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={`${l.id}-${l.outgoing}-${l.type}`}>
                <button
                  type="button"
                  onClick={() => onSelect(l.id)}
                  className="w-full text-left flex items-center gap-2 px-2 py-1 rounded-md hover:bg-elevated text-xs"
                >
                  <span className="text-accent shrink-0">{l.outgoing ? "→" : "←"}</span>
                  <span className="truncate text-text-primary">{l.name}</span>
                  <span className="ml-auto text-[10px] text-text-muted shrink-0">{l.type}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="px-4 py-3 border-t border-border-subtle space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={S.nodePanelComment}
          rows={2}
          maxLength={2000}
          className="w-full resize-none rounded-lg bg-root border border-border-subtle focus:border-accent/60 outline-none px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!text.trim()}
            onClick={() => void send()}
            className="flex-1 px-3 py-1.5 rounded-lg text-[13px] font-medium bg-accent/15 border border-accent/40 text-accent hover:bg-accent/25 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            💬 {S.comment}
          </button>
          {onOpenInArch && (
            <button
              type="button"
              onClick={onOpenInArch}
              className="px-3 py-1.5 rounded-lg text-[13px] border border-border-medium text-text-secondary hover:text-text-primary hover:bg-elevated"
            >
              {S.openInArch}
            </button>
          )}
        </div>
      </footer>
    </aside>
  );
}
