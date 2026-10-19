import { useEffect, useState } from "react";
import { applyElkLayout } from "../../utils/elk-layout";
import { PLAN_NODE_HEIGHT, PLAN_NODE_WIDTH } from "./PlanNode";

export interface LayoutEdge {
  source: string;
  target: string;
}

export type Positions = Map<string, { x: number; y: number }>;

/** Layered ELK layout for a mini graph; positions are top-left coordinates. */
export function useElkPositions(
  nodeIds: string[],
  edges: LayoutEdge[],
  direction: "RIGHT" | "DOWN",
): Positions | null {
  const [positions, setPositions] = useState<Positions | null>(null);
  const signature = `${direction}|${nodeIds.join(",")}|${edges.map((e) => `${e.source}>${e.target}`).join(",")}`;

  useEffect(() => {
    let cancelled = false;
    void applyElkLayout({
      id: "root",
      layoutOptions: {
        algorithm: "layered",
        "elk.direction": direction,
        "elk.edgeRouting": "POLYLINE",
        "elk.spacing.nodeNode": "24",
        "elk.layered.spacing.nodeNodeBetweenLayers": "48",
        "elk.spacing.componentComponent": "50",
        "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
        "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
        "elk.padding": "[top=20,left=20,right=20,bottom=20]",
      },
      children: nodeIds.map((id) => ({ id, width: PLAN_NODE_WIDTH, height: PLAN_NODE_HEIGHT })),
      edges: edges.map((e, i) => ({ id: `e${i}`, sources: [e.source], targets: [e.target] })),
    }).then(({ positioned }) => {
      if (cancelled) return;
      setPositions(new Map((positioned.children ?? []).map((c) => [c.id, { x: c.x ?? 0, y: c.y ?? 0 }])));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `signature` captures nodeIds, edges and direction
  }, [signature]);

  return positions;
}
