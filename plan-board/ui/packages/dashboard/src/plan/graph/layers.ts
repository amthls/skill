import type { KnowledgeGraph } from "@understand-anything/core/types";
import { getLayerColor } from "../../components/LayerLegend";

export const NO_LAYER_COLOR = "#788291";

export interface LayerIndex {
  colorOf: (nodeId: string) => string;
  nameOf: (nodeId: string) => string | null;
}

/** Maps nodes to their (first) layer so mini graphs use the same palette as the Kiến trúc view. */
export function buildLayerIndex(graph: KnowledgeGraph): LayerIndex {
  const layerOfNode = new Map<string, number>();
  graph.layers.forEach((layer, i) => {
    for (const id of layer.nodeIds) if (!layerOfNode.has(id)) layerOfNode.set(id, i);
  });
  return {
    colorOf: (id) => {
      const i = layerOfNode.get(id);
      return i === undefined ? NO_LAYER_COLOR : getLayerColor(i).label;
    },
    nameOf: (id) => {
      const i = layerOfNode.get(id);
      return i === undefined ? null : graph.layers[i].name;
    },
  };
}
