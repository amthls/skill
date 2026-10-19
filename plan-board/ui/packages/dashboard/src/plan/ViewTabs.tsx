import { useDashboardStore } from "../store";
import type { ViewMode } from "../store";
import { S } from "./strings";

type TabId = "plan" | "arch" | "flow";

/** Which top-level tab a view mode belongs to. */
function tabOf(mode: ViewMode): TabId {
  if (mode === "plan") return "plan";
  return mode === "domain" ? "flow" : "arch";
}

export default function ViewTabs() {
  const viewMode = useDashboardStore((s) => s.viewMode);
  const setViewMode = useDashboardStore((s) => s.setViewMode);
  const isKnowledgeGraph = useDashboardStore((s) => s.isKnowledgeGraph);
  const hasDomainGraph = useDashboardStore((s) => s.domainGraph !== null);
  const active = tabOf(viewMode);

  const tabs: { id: TabId; label: string; mode: ViewMode }[] = [
    { id: "plan", label: S.tabPlan, mode: "plan" },
    { id: "arch", label: S.tabArch, mode: isKnowledgeGraph ? "knowledge" : "structural" },
    ...(hasDomainGraph ? [{ id: "flow" as const, label: S.tabFlow, mode: "domain" as const }] : []),
  ];

  return (
    <div role="tablist" className="flex items-center bg-elevated rounded-lg p-0.5 shrink-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => setViewMode(tab.mode)}
          className={`px-3.5 py-1.5 text-[13px] font-medium rounded-md transition-colors whitespace-nowrap ${
            active === tab.id ? "bg-accent/20 text-accent" : "text-text-muted hover:text-text-secondary"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
