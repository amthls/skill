import { useDashboardStore } from "../store";

/** Switches to the Kiến trúc tab, optionally selecting a node there. */
export function openInArchitecture(nodeId?: string): void {
  const state = useDashboardStore.getState();
  state.setViewMode(state.isKnowledgeGraph ? "knowledge" : "structural");
  if (nodeId) state.navigateToNode(nodeId);
}
