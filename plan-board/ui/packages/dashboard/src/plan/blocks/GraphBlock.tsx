import { useEffect, useMemo, useState } from "react";
import type { KnowledgeGraph } from "@understand-anything/core/types";
import { buildLayerIndex } from "../graph/layers";
import GraphLegend from "../graph/GraphLegend";
import GraphNodePanel from "../graph/GraphNodePanel";
import MiniGraph from "../graph/MiniGraph";
import { selectSubgraph } from "../graph/selectSubgraph";
import { useGraphSource } from "../graph/useGraphSource";
import { openInArchitecture } from "../navigation";
import { S } from "../strings";
import type { GraphBlock as GraphBlockData, SectionRef } from "../types";

interface Props {
  block: GraphBlockData;
  at: SectionRef;
}

const INLINE_HEIGHT = { min: 300, max: 560 };

const TOOL_BTN =
  "px-2.5 py-1 rounded-md text-xs font-medium border border-border-medium text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap";

export default function GraphBlock({ block, at }: Props) {
  const src = block.src ?? "plan";
  const graph = useGraphSource(src);
  if (!graph) {
    return <div className="rounded-xl border border-border-subtle bg-root/60 p-6 text-sm text-text-muted">{S.graphLoading}</div>;
  }
  return <GraphStage block={block} at={at} graph={graph} />;
}

function GraphStage({ block, at, graph }: Props & { graph: KnowledgeGraph }) {
  const [expand, setExpand] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isPlanGraph = (block.src ?? "plan") === "plan";

  const queryKey = JSON.stringify([block.layers, block.ids, block.focus, block.max]);
  const query = useMemo(
    () => ({ layers: block.layers, ids: block.ids, focus: block.focus, max: block.max }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- queryKey is the stable identity of the query
    [queryKey],
  );
  const sub = useMemo(() => selectSubgraph(graph, { ...query, expand }), [graph, query, expand]);
  const canExpand = useMemo(
    () => selectSubgraph(graph, { ...query, expand: expand + 1 }).nodes.length > sub.nodes.length,
    [graph, query, expand, sub],
  );
  const layers = useMemo(() => buildLayerIndex(graph), [graph]);
  const nodesById = useMemo(() => new Map(sub.nodes.map((n) => [n.id, n])), [sub]);
  const visibleIds = useMemo(() => new Set(nodesById.keys()), [nodesById]);
  const selected = selectedId ? (nodesById.get(selectedId) ?? null) : null;

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  if (sub.nodes.length === 0) {
    return <div className="rounded-xl border border-border-subtle bg-root/60 p-6 text-sm text-text-muted">{S.graphEmpty}</div>;
  }

  const openInArch = isPlanGraph
    ? () => {
        setFullscreen(false);
        openInArchitecture(selected?.id);
      }
    : undefined;

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-[60] bg-root text-text-primary flex flex-col"
          : "rounded-xl border border-border-medium bg-root overflow-hidden flex flex-col"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2 bg-surface border-b border-border-subtle">
        <GraphLegend graph={graph} visibleNodeIds={visibleIds} />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={TOOL_BTN} disabled={!canExpand} onClick={() => setExpand((n) => n + 1)}>
            ➕ {S.expand}
          </button>
          {expand > 0 && (
            <button type="button" className={TOOL_BTN} onClick={() => setExpand(0)}>
              {S.collapse}
            </button>
          )}
          {openInArch && (
            <button type="button" className={TOOL_BTN} onClick={openInArch}>
              🏛 {S.openInArch}
            </button>
          )}
          <button type="button" className={TOOL_BTN} onClick={() => setFullscreen((f) => !f)}>
            {fullscreen ? `✕ ${S.closeFullscreen}` : `⛶ ${S.fullscreen}`}
          </button>
        </div>
      </div>
      <div className={`relative ${fullscreen ? "flex-1 min-h-0" : ""}`}>
        <MiniGraph
          nodes={sub.nodes}
          edges={sub.edges}
          layers={layers}
          direction={block.direction ?? "RIGHT"}
          contextIds={sub.contextIds}
          selectedId={selectedId}
          wheelZoom={fullscreen}
          autoHeightRange={fullscreen ? undefined : INLINE_HEIGHT}
          fitToken={`${fullscreen}-${sub.nodes.length}`}
          onSelect={setSelectedId}
        />
        {selected && (
          <GraphNodePanel
            node={selected}
            edges={sub.edges}
            nodesById={nodesById}
            layerName={layers.nameOf(selected.id)}
            at={at}
            onOpenInArch={openInArch}
            onSelect={setSelectedId}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  );
}
