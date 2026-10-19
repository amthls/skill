import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { MdBlock } from "../types";

const REMARK_PLUGINS = [remarkGfm];

export default function MarkdownBlock({ block }: { block: MdBlock }) {
  return (
    <div className="plan-md">
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer noopener">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="plan-md-table">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {block.md}
      </ReactMarkdown>
    </div>
  );
}
