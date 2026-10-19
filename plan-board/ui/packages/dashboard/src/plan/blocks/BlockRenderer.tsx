import type { Block, SectionRef } from "../types";
import CardsBlock from "./CardsBlock";
import DecisionBlock from "./DecisionBlock";
import EmbedBlock from "./EmbedBlock";
import FlowBlock from "./FlowBlock";
import GraphBlock from "./GraphBlock";
import MarkdownBlock from "./MarkdownBlock";

interface Props {
  block: Block;
  at: SectionRef;
}

export default function BlockRenderer({ block, at }: Props) {
  switch (block.kind) {
    case "md":
      return <MarkdownBlock block={block} />;
    case "graph":
      return <GraphBlock block={block} at={at} />;
    case "flow":
      return <FlowBlock block={block} />;
    case "decision":
      return <DecisionBlock block={block} at={at} />;
    case "cards":
      return <CardsBlock block={block} />;
    case "embed":
      return <EmbedBlock block={block} />;
  }
}
