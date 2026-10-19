/** Shapes returned by GET /api/board (see schema/SCHEMA.md §3 and §6). */

export interface BoardMeta {
  title: string;
  subtitle?: string;
}

export interface MdBlock {
  kind: "md";
  md: string;
}

export interface GraphBlock {
  kind: "graph";
  layers?: string[];
  ids?: string[];
  focus?: string;
  max?: number;
  direction?: "RIGHT" | "DOWN";
  src?: "plan" | "ua";
}

export interface FlowBlock {
  kind: "flow";
  id: string;
}

export interface DecisionOption {
  id: string;
  label: string;
  desc?: string;
}

export interface DecisionBlock {
  kind: "decision";
  id: string;
  status: "open" | "done";
  chosen?: string;
  note?: string;
  question: string;
  options: DecisionOption[];
}

export interface CardItem {
  icon?: string;
  title: string;
  desc?: string;
}

export interface CardsBlock {
  kind: "cards";
  items: CardItem[];
}

export interface EmbedBlock {
  kind: "embed";
  src: string;
  height?: number;
}

export type Block = MdBlock | GraphBlock | FlowBlock | DecisionBlock | CardsBlock | EmbedBlock;

export interface BoardSection {
  id: string;
  title: string;
  lead?: string;
  blocks: Block[];
}

export interface BoardPage {
  id: string;
  title: string;
  lead?: string;
  sections: BoardSection[];
}

export interface FlowStep {
  nodeId: string;
  label: string;
  in?: string;
  out?: string;
}

export interface BoardFlow {
  id: string;
  title: string;
  description?: string;
  steps: FlowStep[];
}

export interface Board {
  board: BoardMeta;
  pages: BoardPage[];
  flows: BoardFlow[];
}

export type FeedbackKind = "comment" | "choose" | "edit" | "ask";

export interface FeedbackInput {
  page: string;
  sec: string;
  node?: string;
  kind: FeedbackKind;
  val?: string;
  text?: string;
}

export interface PendingInbox {
  pending: number;
  text: string;
}

/** Where a block lives; passed down so feedback knows its page/section. */
export interface SectionRef {
  page: string;
  sec: string;
}
