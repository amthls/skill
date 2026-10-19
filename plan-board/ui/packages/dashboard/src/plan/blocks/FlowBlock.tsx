import { useEffect, useMemo, useState } from "react";
import type { GraphEdge, KnowledgeGraph } from "@understand-anything/core/types";
import { buildLayerIndex } from "../graph/layers";
import GraphLegend from "../graph/GraphLegend";
import MiniGraph from "../graph/MiniGraph";
import { resolveRef, withNeighbours } from "../graph/selectSubgraph";
import { useGraphSource } from "../graph/useGraphSource";
import { usePlan } from "../PlanContext";
import { S } from "../strings";
import type { FlowBlock as FlowBlockData, FlowStep } from "../types";
import FlowPlayer from "./FlowPlayer";
import type { Speed } from "./FlowPlayer";

const NEIGHBOUR_LIMIT = 4;
const STEP_MS = 2200;
const FLOW_HEIGHT = { min: 240, max: 420 };

const virtualEdge = (source: string, target: string): GraphEdge => ({
  source,
  target,
  type: "calls",
  direction: "forward",
  weight: 0.5,
});

export default function FlowBlock({ block }: { block: FlowBlockData }) {
  const { board } = usePlan();
  const graph = useGraphSource("plan");
  const flow = board?.flows.find((f) => f.id === block.id);

  const steps = useMemo<FlowStep[]>(() => {
    if (!flow || !graph) return [];
    return flow.steps.flatMap((s) => {
      const nodeId = resolveRef(graph, s.nodeId);
      return nodeId ? [{ ...s, nodeId }] : [];
    });
  }, [flow, graph]);

  if (!graph) {
    return <div className="rounded-xl border border-border-subtle bg-root/60 p-6 text-sm text-text-muted">{S.graphLoading}</div>;
  }
  if (!flow || steps.length === 0) {
    return <div className="rounded-xl border border-border-subtle bg-root/60 p-6 text-sm text-text-muted">{S.flowMissing}: {block.id}</div>;
  }
  return <FlowStage steps={steps} graph={graph} />;
}

function FlowStage({ steps, graph }: { steps: FlowStep[]; graph: KnowledgeGraph }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const last = steps.length - 1;
  const current = Math.min(index, last);

  useEffect(() => {
    if (!playing) return;
    if (current >= last) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setIndex(current + 1), STEP_MS / speed);
    return () => window.clearTimeout(timer);
  }, [playing, current, last, speed]);

  const togglePlay = () => {
    if (!playing && current >= last) setIndex(0);
    setPlaying((p) => !p);
  };

  const stepKey = steps.map((s) => s.nodeId).join(",");
  const sub = useMemo(() => {
    const ids = [...new Set(steps.map((s) => s.nodeId))];
    const base = withNeighbours(graph, ids, NEIGHBOUR_LIMIT);
    const isStepPair = (x: string, y: string) =>
      steps.some((s, i) => i > 0 && ((steps[i - 1].nodeId === x && s.nodeId === y) || (steps[i - 1].nodeId === y && s.nodeId === x)));
    // Keep consecutive-step edges and core<->context edges; drop other long-range links that clutter the view.
    const edges = base.edges.filter(
      (e) => base.contextIds.has(e.source) !== base.contextIds.has(e.target) || isStepPair(e.source, e.target),
    );
    for (let i = 1; i < steps.length; i++) {
      const a = steps[i - 1].nodeId;
      const b = steps[i].nodeId;
      if (a !== b && !edges.some((e) => (e.source === a && e.target === b) || (e.source === b && e.target === a))) {
        edges.push(virtualEdge(a, b));
      }
    }
    return { ...base, edges };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stepKey is the stable identity of `steps`
  }, [graph, stepKey]);

  const stepBadges = useMemo(() => {
    const numbers = new Map<string, number[]>();
    steps.forEach((s, i) => numbers.set(s.nodeId, [...(numbers.get(s.nodeId) ?? []), i + 1]));
    return new Map([...numbers].map(([id, n]) => [id, n.join("·")]));
  }, [steps]);

  const activeEdge = useMemo(() => {
    if (current === 0) return null;
    const a = steps[current - 1].nodeId;
    const b = steps[current].nodeId;
    if (a === b) return null;
    return sub.edges.some((e) => e.source === a && e.target === b) ? { source: a, target: b } : { source: b, target: a };
  }, [current, steps, sub.edges]);

  const layers = useMemo(() => buildLayerIndex(graph), [graph]);
  const visibleIds = useMemo(() => new Set(sub.nodes.map((n) => n.id)), [sub]);

  return (
    <div className="rounded-xl border border-border-medium bg-root overflow-hidden">
      <div className="px-3 py-2 bg-surface border-b border-border-subtle">
        <GraphLegend graph={graph} visibleNodeIds={visibleIds} />
      </div>
      <div>
        <MiniGraph
          nodes={sub.nodes}
          edges={sub.edges}
          layers={layers}
          direction="RIGHT"
          contextIds={sub.contextIds}
          activeId={steps[current].nodeId}
          activeEdge={activeEdge}
          dimInactive
          stepBadges={stepBadges}
          wheelZoom={false}
          autoHeightRange={FLOW_HEIGHT}
          fitToken={stepKey}
          onSelect={(id) => {
            const hit = steps.findIndex((s) => s.nodeId === id);
            if (hit >= 0) setIndex(hit);
          }}
        />
      </div>
      <FlowPlayer
        steps={steps}
        index={current}
        playing={playing}
        speed={speed}
        onIndex={(i) => {
          setPlaying(false);
          setIndex(i);
        }}
        onTogglePlay={togglePlay}
        onSpeed={setSpeed}
      />
    </div>
  );
}
