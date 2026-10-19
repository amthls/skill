import BlockRenderer from "./blocks/BlockRenderer";
import SectionFooter from "./SectionFooter";
import type { BoardSection } from "./types";

interface Props {
  pageId: string;
  section: BoardSection;
  number: number;
  anchor: string;
}

const LEADING_TARGET = /^🎯\s*/u;

export default function SectionCard({ pageId, section, number, anchor }: Props) {
  const at = { page: pageId, sec: section.id };
  const lead = section.lead?.replace(LEADING_TARGET, "");

  return (
    <section
      id={anchor}
      data-section-anchor={anchor}
      className="scroll-mt-6 rounded-2xl bg-surface border border-border-subtle p-5 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
    >
      <header className="flex items-start gap-4 mb-5">
        <span className="shrink-0 w-12 h-12 rounded-xl bg-accent/15 border border-accent/40 text-accent text-2xl font-bold font-heading flex items-center justify-center">
          {number}
        </span>
        <div className="min-w-0 pt-0.5">
          <h3 className="font-heading text-xl sm:text-2xl text-text-primary leading-tight break-words">{section.title}</h3>
          {lead && (
            <p className="mt-1.5 text-sm text-accent-bright leading-snug">
              <span aria-hidden>🎯 </span>
              {lead}
            </p>
          )}
        </div>
      </header>

      <div className="space-y-5">
        {section.blocks.map((block, i) => (
          <BlockRenderer key={`${block.kind}-${i}`} block={block} at={at} />
        ))}
      </div>

      <SectionFooter at={at} />
    </section>
  );
}
