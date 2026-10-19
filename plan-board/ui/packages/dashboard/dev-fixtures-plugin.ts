import fs from "fs";
import path from "path";
import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "http";

interface FeedbackEntry {
  sec?: string;
  node?: string;
  kind: string;
  val?: string;
  text?: string;
}

const JSON_ROUTES: Record<string, string> = {
  "/api/board": "api-board.json",
  "/knowledge-graph.json": "knowledge-graph.json",
  "/domain-graph.json": "domain-graph.json",
};

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
  });
}

function sendJson(res: ServerResponse, payload: unknown, status = 200): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function formatPending(entries: FeedbackEntry[]): string {
  const lines = entries.map((e) => {
    const where = e.node ? `${e.sec}@${e.node}` : e.sec;
    return `- ${where}: ${e.kind} "${e.val || e.text || ""}"`;
  });
  return `[board dev] ${entries.length} góp ý\n${lines.join("\n")}\n[inbox@${entries.length}]`;
}

/** Dev-only server that mimics the Plan Board API with files from `dev-fixtures/`. */
export function devFixtures(dir: string): Plugin {
  return {
    name: "plan-board-dev-fixtures",
    configureServer(server) {
      const pending: FeedbackEntry[] = [];

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://127.0.0.1");
        const { pathname } = url;

        const jsonFile = JSON_ROUTES[pathname];
        if (jsonFile && req.method === "GET") {
          res.setHeader("Content-Type", "application/json");
          res.end(fs.readFileSync(path.join(dir, jsonFile)));
          return;
        }
        if (pathname === "/api/inbox/pending") {
          sendJson(res, { pending: pending.length, text: formatPending(pending) });
          return;
        }
        if (pathname === "/api/feedback" && req.method === "POST") {
          pending.push(JSON.parse(await readBody(req)) as FeedbackEntry);
          sendJson(res, { ok: true, pending: pending.length });
          return;
        }
        if (pathname === "/api/events") {
          res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" });
          res.write(": connected\n\n");
          return;
        }
        if (pathname.startsWith("/files/")) {
          const file = path.resolve(dir, "files", decodeURIComponent(pathname.slice(7)));
          if (file.startsWith(path.join(dir, "files")) && fs.existsSync(file)) {
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.end(fs.readFileSync(file));
            return;
          }
        }
        next();
      });
    },
  };
}
