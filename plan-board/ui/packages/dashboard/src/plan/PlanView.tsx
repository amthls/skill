import { useCallback, useEffect, useRef, useState } from "react";
import { usePlan } from "./PlanContext";
import PlanNav, { pageAnchor, sectionAnchor } from "./PlanNav";
import SectionCard from "./SectionCard";
import { S } from "./strings";

const SPY_OFFSET_PX = 120;

function StatusMessage({ children, tone = "muted" }: { children: string; tone?: "muted" | "error" }) {
  return (
    <div className={`h-full flex items-center justify-center p-8 text-sm ${tone === "error" ? "text-red-300" : "text-text-muted"}`}>
      {children}
    </div>
  );
}

export default function PlanView() {
  const { board, error } = usePlan();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  const updateActive = useCallback(() => {
    const root = scrollRef.current;
    if (!root) return;
    const limit = root.getBoundingClientRect().top + SPY_OFFSET_PX;
    let current: string | null = null;
    for (const el of root.querySelectorAll<HTMLElement>("[data-section-anchor]")) {
      if (el.getBoundingClientRect().top <= limit) current = el.dataset.sectionAnchor ?? null;
      else break;
    }
    const first = root.querySelector<HTMLElement>("[data-section-anchor]")?.dataset.sectionAnchor ?? null;
    setActiveAnchor(current ?? first);
  }, []);

  useEffect(() => {
    updateActive();
  }, [board, updateActive]);

  const navigate = useCallback((anchor: string) => {
    document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setNavOpen(false);
  }, []);

  if (!board) return <StatusMessage tone={error ? "error" : "muted"}>{error ? `${S.loadError}: ${error}` : S.loading}</StatusMessage>;
  if (board.pages.length === 0) return <StatusMessage>{S.noPages}</StatusMessage>;

  return (
    <div className="h-full flex flex-col lg:flex-row min-h-0">
      <aside className="hidden lg:block w-[280px] shrink-0 overflow-y-auto bg-surface border-r border-border-subtle">
        <PlanNav pages={board.pages} activeAnchor={activeAnchor} onNavigate={navigate} />
      </aside>

      <div className="lg:hidden relative shrink-0 border-b border-border-subtle bg-surface">
        <button
          type="button"
          onClick={() => setNavOpen((o) => !o)}
          aria-expanded={navOpen}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-text-secondary"
        >
          <span>☰ {S.menu}</span>
          <span className="text-text-muted">{navOpen ? "▲" : "▼"}</span>
        </button>
        {navOpen && (
          <div className="absolute z-30 left-0 right-0 top-full max-h-[60vh] overflow-y-auto bg-surface border-b border-border-medium shadow-2xl">
            <PlanNav pages={board.pages} activeAnchor={activeAnchor} onNavigate={navigate} />
          </div>
        )}
      </div>

      <div ref={scrollRef} onScroll={updateActive} className="flex-1 min-w-0 min-h-0 overflow-y-auto">
        <div className="max-w-[960px] mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-10">
          {board.pages.map((page) => (
            <div key={page.id} className="space-y-6">
              <div id={pageAnchor(page.id)} className="scroll-mt-6">
                <h2 className="font-heading text-3xl sm:text-4xl text-text-primary leading-tight">{page.title}</h2>
                {page.lead && <p className="mt-2 text-text-secondary">{page.lead}</p>}
              </div>
              {page.sections.map((section, i) => (
                <SectionCard
                  key={section.id}
                  pageId={page.id}
                  section={section}
                  number={i + 1}
                  anchor={sectionAnchor(page.id, section.id)}
                />
              ))}
            </div>
          ))}
          <div className="h-24" />
        </div>
      </div>
    </div>
  );
}
