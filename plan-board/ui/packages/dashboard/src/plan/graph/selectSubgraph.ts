import type { GraphEdge, GraphNode, KnowledgeGraph } from "@understand-anything/core/types";

export const DEFAULT_MAX_NODES = 40;

export interface SubgraphQuery {
  layers?: string[];
  ids?: string[];
  focus?: string;
  max?: number;
  /** Hops of neighbours added around the filtered set (the "Mở rộng" button). */
  expand?: number;
}

export interface Subgraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Nodes that are only shown as 1-hop context, not matched by the filter. */
  contextIds: Set<string>;
}

type Adjacency = Map<string, Set<string>>;

function buildAdjacency(edges: GraphEdge[]): Adjacency {
  const adj: Adjacency = new Map();
  const link = (a: string, b: string) => {
    if (!adj.has(a)) adj.set(a, new Set());
    adj.get(a)?.add(b);
  };
  for (const e of edges) {
    link(e.source, e.target);
    link(e.target, e.source);
  }
  return adj;
}

/** A ref from the page may be a full node id, a file path, or a `file.fn` ref. */
export function resolveRef(graph: KnowledgeGraph, ref: string): string | null {
  const direct = graph.nodes.find((n) => n.id === ref || n.id === `file:${ref}` || n.id === `concept:${ref}`);
  if (direct) return direct.id;
  const byPath = graph.nodes.find((n) => n.filePath === ref && n.type === "file");
  return byPath?.id ?? null;
}

function bfsOrder(start: string, adj: Adjacency, allowed: Set<string>): string[] {
  const order: string[] = [];
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length > 0) {
    const cur = queue.shift() as string;
    order.push(cur);
    for (const next of adj.get(cur) ?? []) {
      if (allowed.has(next) && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return order;
}

function pickBase(graph: KnowledgeGraph, q: SubgraphQuery): Set<string> {
  const picked = new Set<string>();
  const hasLayers = !!q.layers?.length;
  const hasIds = !!q.ids?.length;
  if (hasLayers) {
    for (const layer of graph.layers) {
      if (q.layers?.includes(layer.id)) layer.nodeIds.forEach((id) => picked.add(id));
    }
  }
  if (hasIds) {
    for (const ref of q.ids ?? []) {
      const id = resolveRef(graph, ref);
      if (id) picked.add(id);
    }
  }
  if (!hasLayers && !hasIds) graph.nodes.forEach((n) => picked.add(n.id));
  return picked;
}

/** Applies layers/ids/focus/max (SCHEMA §3) and optional neighbour expansion. */
export function selectSubgraph(graph: KnowledgeGraph, q: SubgraphQuery): Subgraph {
  const known = new Set(graph.nodes.map((n) => n.id));
  const adj = buildAdjacency(graph.edges);
  let base = [...pickBase(graph, q)].filter((id) => known.has(id));

  const max = q.max ?? DEFAULT_MAX_NODES;
  if (base.length > max) {
    const focusId = q.focus ? resolveRef(graph, q.focus) : null;
    const allowed = new Set(base);
    const ranked =
      focusId && allowed.has(focusId)
        ? bfsOrder(focusId, adj, allowed)
        : [...base].sort((a, b) => (adj.get(b)?.size ?? 0) - (adj.get(a)?.size ?? 0));
    const rest = base.filter((id) => !ranked.includes(id));
    base = [...ranked, ...rest].slice(0, max);
  }

  const shown = new Set(base);
  const contextIds = new Set<string>();
  for (let hop = 0; hop < (q.expand ?? 0); hop++) {
    for (const id of [...shown]) {
      for (const next of adj.get(id) ?? []) {
        if (known.has(next) && !shown.has(next)) {
          shown.add(next);
          contextIds.add(next);
        }
      }
    }
  }

  return {
    nodes: graph.nodes.filter((n) => shown.has(n.id)),
    edges: graph.edges.filter((e) => shown.has(e.source) && shown.has(e.target)),
    contextIds,
  };
}

/** Adds up to `limit` neighbours of the given core nodes, for flow context. */
export function withNeighbours(graph: KnowledgeGraph, coreIds: string[], limit: number): Subgraph {
  const adj = buildAdjacency(graph.edges);
  const core = new Set(coreIds);
  const contextIds = new Set<string>();
  for (const id of coreIds) {
    for (const next of adj.get(id) ?? []) {
      if (contextIds.size >= limit) break;
      if (!core.has(next)) contextIds.add(next);
    }
  }
  const shown = new Set([...core, ...contextIds]);
  return {
    nodes: graph.nodes.filter((n) => shown.has(n.id)),
    edges: graph.edges.filter((e) => shown.has(e.source) && shown.has(e.target)),
    contextIds,
  };
}
