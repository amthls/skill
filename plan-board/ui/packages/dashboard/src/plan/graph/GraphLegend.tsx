import type { KnowledgeGraph } from "@understand-anything/core/types";
import { getLayerColor } from "../../components/LayerLegend";
import { NO_LAYER_COLOR } from "./layers";

interface Props {
  graph: KnowledgeGraph;
  /** Ids of the nodes currently on the canvas. */
  visibleNodeIds: Set<string>;
}

export default function GraphLegend({ graph, visibleNodeIds }: Props) {
  const entries = graph.layers
    .map((layer, i) => ({ layer, color: getLayerColor(i).label }))
    .filter(({ layer }) => layer.nodeIds.some((id) => visibleNodeIds.has(id)));
  const hasUnlayered = [...visibleNodeIds].some((id) => !graph.layers.some((l) => l.nodeIds.includes(id)));

  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 min-w-0">
      {entries.map(({ layer, color }) => (
        <li key={layer.id} className="flex items-center gap-1.5 text-xs text-text-secondary" title={layer.description}>
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
          {layer.name}
        </li>
      ))}
      {hasUnlayered && (
        <li className="flex items-center gap-1.5 text-xs text-text-secondary">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: NO_LAYER_COLOR }} />
          Khác
        </li>
      )}
    </ul>
  );
}
