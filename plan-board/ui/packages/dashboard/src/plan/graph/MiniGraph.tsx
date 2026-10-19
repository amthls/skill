import { useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import type { Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { GraphEdge, GraphNode } from "@understand-anything/core/types";
import { useTheme } from "../../themes";
import { S } from "../strings";
import type { LayerIndex } from "./layers";
import PlanNode, { PLAN_NODE_HEIGHT, PLAN_NODE_WIDTH } from "./PlanNode";
import type { PlanFlowNode } from "./PlanNode";
import { useElkPositions } from "./useElkPositions";

const NODE_TYPES = { plan: PlanNode };
const FIT_PADDING = 36;
const MIN_FIT_ZOOM = 0.3;
const MAX_FIT_ZOOM = 1.1;
const EDGE_COLOR = "color-mix(in srgb, var(--color-accent) 50%, transparent)";

export interface ActiveEdge {
  source: string;
  target: string;
}

export interface MiniGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  layers: LayerIndex;
  direction: "RIGHT" | "DOWN";
  contextIds: Set<string>;
  selectedId?: string | null;
  activeId?: string | null;
  activeEdge?: ActiveEdge | null;
  /** Fade everything except the active node (flow player). */
  dimInactive?: boolean;
  stepBadges?: Map<string, string>;
  /** Inline blocks size their height to the graph within this range; omit to fill the parent. */
  autoHeightRange?: { min: number; max: number };
  /** Wheel zooms the canvas instead of scrolling the page. */
  wheelZoom: boolean;
  /** Changing this value re-fits the viewport (e.g. entering fullscreen). */
  fitToken: string;
  onSelect: (id: string | null) => void;
}

function Canvas({
  nodes,
  edges,
  layers,
  direction,
  contextIds,
  selectedId,
  activeId,
  activeEdge,
  dimInactive,
  stepBadges,
  wheelZoom,
  fitToken,
  autoHeightRange,
  onSelect,
}: MiniGraphProps) {
  const { setViewport } = useReactFlow();
  const [autoHeight, setAutoHeight] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { preset } = useTheme();
  const positions = useElkPositions(
    useMemo(() => nodes.map((n) => n.id), [nodes]),
    edges,
    direction,
  );

  // Fit the whole graph into the container, and again whenever the container is resized
  // (e.g. entering fullscreen). Computed here because React Flow's own fit can use stale dimensions.
  useEffect(() => {
    const el = wrapRef.current;
    if (!positions || !el || positions.size === 0) return;
    const coords = [...positions.values()];
    const minX = Math.min(...coords.map((p) => p.x));
    const minY = Math.min(...coords.map((p) => p.y));
    const boundsW = Math.max(...coords.map((p) => p.x)) + PLAN_NODE_WIDTH - minX;
    const boundsH = Math.max(...coords.map((p) => p.y)) + PLAN_NODE_HEIGHT - minY;
    const fit = () => {
      const rect = el.getBoundingClientRect();
      const { width } = rect;
      let { height } = rect;
      if (width === 0) return;
      if (autoHeightRange) {
        const wanted = boundsH * Math.min(MAX_FIT_ZOOM, (width - 2 * FIT_PADDING) / boundsW) + 2 * FIT_PADDING;
        height = Math.round(Math.min(autoHeightRange.max, Math.max(autoHeightRange.min, wanted)));
        setAutoHeight(height);
      }
      if (height === 0) return;
      const fitZoom = Math.min(
        MAX_FIT_ZOOM,
        Math.max(MIN_FIT_ZOOM, Math.min((width - 2 * FIT_PADDING) / boundsW, (height - 2 * FIT_PADDING) / boundsH)),
      );
      void setViewport({
        zoom: fitZoom,
        x: (width - boundsW * fitZoom) / 2 - minX * fitZoom,
        y: (height - boundsH * fitZoom) / 2 - minY * fitZoom,
      });
    };
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    fit();
    return () => observer.disconnect();
  }, [positions, fitToken, autoHeightRange, setViewport]);

  const flowNodes = useMemo<PlanFlowNode[]>(
    () =>
      positions
        ? nodes.map((n) => ({
            id: n.id,
            type: "plan" as const,
            position: positions.get(n.id) ?? { x: 0, y: 0 },
            width: PLAN_NODE_WIDTH,
            height: PLAN_NODE_HEIGHT,
            draggable: false,
            data: {
              label: n.name,
              nodeType: n.type,
              summary: n.summary,
              layerColor: layers.colorOf(n.id),
              direction,
              selected: n.id === selectedId,
              active: n.id === activeId,
              context: contextIds.has(n.id),
              stepBadge: stepBadges?.get(n.id),
              dimmed: !!dimInactive,
            },
          }))
        : [],
    [positions, nodes, layers, direction, selectedId, activeId, contextIds, stepBadges, dimInactive],
  );

  const flowEdges = useMemo<Edge[]>(
    () =>
      edges.map((e, i) => {
        const isActive = !!activeEdge && activeEdge.source === e.source && activeEdge.target === e.target;
        const isContext = contextIds.has(e.source) || contextIds.has(e.target);
        const color = isActive ? "var(--color-accent-bright)" : EDGE_COLOR;
        return {
          id: `${e.source}->${e.target}#${i}`,
          source: e.source,
          target: e.target,
          animated: isActive,
          className: isActive ? "plan-edge-glow" : undefined,
          markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
          style: {
            stroke: color,
            strokeWidth: isActive ? 3 : 1.5,
            strokeDasharray: isContext && !isActive ? "5 4" : undefined,
            opacity: dimInactive && !isActive ? 0.45 : 1,
          },
        };
      }),
    [edges, activeEdge, contextIds, dimInactive],
  );

  return (
    <div ref={wrapRef} className="w-full" style={{ height: autoHeightRange ? (autoHeight ?? autoHeightRange.min) : "100%" }}>
      {!positions ? (
        <div className="h-full flex items-center justify-center text-sm text-text-muted">{S.graphLoading}</div>
      ) : (
    <ReactFlow
      nodes={flowNodes}
      edges={flowEdges}
      nodeTypes={NODE_TYPES}
      onNodeClick={(_, node) => onSelect(node.id)}
      onPaneClick={() => onSelect(null)}
      nodesDraggable={false}
      nodesConnectable={false}
      edgesFocusable={false}
      elementsSelectable={false}
      zoomOnScroll={wheelZoom}
      preventScrolling={wheelZoom}
      minZoom={0.15}
      maxZoom={2}
      colorMode={preset.isDark ? "dark" : "light"}
    >
      <Background variant={BackgroundVariant.Dots} color="var(--color-edge-dot)" gap={20} size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
      )}
    </div>
  );
}

export default function MiniGraph(props: MiniGraphProps) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}
