import type { BoardPage } from "./types";

export const sectionAnchor = (pageId: string, secId: string): string => `${pageId}--${secId}`;
export const pageAnchor = (pageId: string): string => `page--${pageId}`;

interface Props {
  pages: BoardPage[];
  activeAnchor: string | null;
  onNavigate: (anchor: string) => void;
}

export default function PlanNav({ pages, activeAnchor, onNavigate }: Props) {
  return (
    <nav className="py-4 space-y-5">
      {pages.map((page) => {
        const pageActive = activeAnchor?.startsWith(`${page.id}--`) ?? false;
        return (
          <div key={page.id}>
            <button
              type="button"
              onClick={() => onNavigate(pageAnchor(page.id))}
              className={`w-full text-left px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                pageActive ? "text-accent" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {page.title}
            </button>
            <ol className="mt-1">
              {page.sections.map((sec, i) => {
                const anchor = sectionAnchor(page.id, sec.id);
                const active = anchor === activeAnchor;
                return (
                  <li key={sec.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(anchor)}
                      aria-current={active ? "location" : undefined}
                      className={`w-full flex items-center gap-3 pl-4 pr-3 py-2 text-left text-[13px] border-l-2 transition-colors ${
                        active
                          ? "border-accent bg-accent/10 text-text-primary"
                          : "border-transparent text-text-secondary hover:bg-elevated hover:text-text-primary"
                      }`}
                    >
                      <span
                        className={`shrink-0 w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center ${
                          active ? "bg-accent text-root" : "bg-elevated text-text-muted"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0 truncate">{sec.title}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </nav>
  );
}
