import { S } from "../strings";
import type { EmbedBlock as EmbedBlockData } from "../types";

const DEFAULT_HEIGHT = 360;

/** http(s) URLs pass through; anything else is a project-relative path served at /files/. */
function embedUrl(src: string): string {
  if (/^https?:\/\//i.test(src)) return src;
  const [path, hash] = src.split("#");
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `/files/${encoded}${hash ? `#${hash}` : ""}`;
}

export default function EmbedBlock({ block }: { block: EmbedBlockData }) {
  return (
    <div className="rounded-xl overflow-hidden border border-border-medium bg-root">
      <iframe
        src={embedUrl(block.src)}
        title={S.embedTitle}
        sandbox="allow-scripts allow-forms allow-popups"
        loading="lazy"
        className="block w-full border-0"
        style={{ height: block.height ?? DEFAULT_HEIGHT }}
      />
    </div>
  );
}
