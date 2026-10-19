import type { CardItem, CardsBlock as CardsBlockData } from "../types";

const LEADING_EMOJI = /^(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)\s*/u;

/** The server may deliver the emoji either as its own field or glued to the title. */
function splitEmoji(item: CardItem): { emoji: string; title: string } {
  if (item.icon) return { emoji: item.icon, title: item.title };
  const match = LEADING_EMOJI.exec(item.title);
  return match
    ? { emoji: match[1], title: item.title.slice(match[0].length) }
    : { emoji: "•", title: item.title };
}

export default function CardsBlock({ block }: { block: CardsBlockData }) {
  return (
    <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
      {block.items.map((item, i) => {
        const { emoji, title } = splitEmoji(item);
        return (
          <div
            key={`${i}-${title}`}
            className="flex gap-3 items-start p-4 rounded-xl bg-elevated border border-border-subtle hover:border-border-medium transition-colors"
          >
            <span className="text-2xl leading-none shrink-0" aria-hidden>
              {emoji}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-text-primary">{title}</div>
              {item.desc && <div className="text-[13px] text-text-secondary mt-1 leading-snug">{item.desc}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
