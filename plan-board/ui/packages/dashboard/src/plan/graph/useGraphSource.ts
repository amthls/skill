import { useEffect, useState } from "react";
import { validateGraph } from "@understand-anything/core/schema";
import type { KnowledgeGraph } from "@understand-anything/core/types";
import { useDashboardStore } from "../../store";
import { usePlan } from "../PlanContext";

let uaCache: { rev: number; promise: Promise<KnowledgeGraph | null> } | null = null;

/** The project's own /understand graph (board.ua), fetched once per board revision. */
function loadUaGraph(rev: number): Promise<KnowledgeGraph | null> {
  if (uaCache?.rev !== rev) {
    const promise = fetch("/knowledge-graph.json?src=ua", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        const result = data ? validateGraph(data) : null;
        return result?.success && result.data ? result.data : null;
      })
      .catch(() => null);
    uaCache = { rev, promise };
  }
  return uaCache.promise;
}

/** `plan` reuses the graph already loaded into the store; `ua` is fetched separately. */
export function useGraphSource(src: "plan" | "ua"): KnowledgeGraph | null {
  const { rev } = usePlan();
  const planGraph = useDashboardStore((s) => s.graph);
  const [uaGraph, setUaGraph] = useState<KnowledgeGraph | null>(null);

  useEffect(() => {
    if (src !== "ua") return;
    let cancelled = false;
    void loadUaGraph(rev).then((g) => {
      if (!cancelled) setUaGraph(g);
    });
    return () => {
      cancelled = true;
    };
  }, [src, rev]);

  return src === "ua" ? uaGraph : planGraph;
}
