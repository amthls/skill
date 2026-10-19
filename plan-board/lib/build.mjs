// Biên dịch .board/ → .board/build/{knowledge-graph,domain-graph,pages}.json
import fs from 'node:fs';
import path from 'node:path';
import { boardDir, readText, readJson, listPageFiles } from './util.mjs';
import { parseDsl, fmtErrors, toKnowledgeGraph, toDomainGraph } from './dsl.mjs';
import { parsePage } from './pages.mjs';

const hideInternal = (k, v) => (k[0] === '_' ? undefined : v);

/** Đọc + phân tích toàn bộ .board/ (không ghi gì). */
export function load(root) {
  const bd = boardDir(root);
  const errors = [];
  const boardRaw = readText(path.join(bd, 'board.json'), null);
  let board = { title: 'Plan Board' };
  if (boardRaw === null) errors.push('board.json: thiếu file — chạy board init');
  else {
    try { board = { title: 'Plan Board', ...JSON.parse(boardRaw) }; } catch (e) { errors.push(`board.json: JSON sai (${e.message})`); }
  }
  const dsl = parseDsl(readText(path.join(bd, 'graph.txt'), ''));
  errors.push(...fmtErrors(dsl.errors));
  const pages = [];
  for (const file of listPageFiles(root)) {
    const { page, errors: pe } = parsePage(readText(path.join(bd, 'pages', file)), file);
    page._file = file;
    errors.push(...fmtErrors(pe, `pages/${file}`));
    if (pages.some((p) => p.id === page.id)) errors.push(`pages/${file}:1: id trang "${page.id}" bị trùng`);
    pages.push(page);
  }
  const flows = dsl.flows.map((f) => ({
    id: f.id, title: f.title, description: f.description,
    steps: f.steps.map((s) => ({ nodeId: s.nodeId, label: s.label, in: s.in, out: s.out })),
  }));
  return { board, dsl, pages, flows, errors, payload: { board, pages, flows } };
}

export function build(root, { write = true } = {}) {
  const r = load(root);
  const stats = { nodes: r.dsl.nodes.length, edges: r.dsl.edges.length, flows: r.flows.length, pages: r.pages.length };
  r.stats = stats;
  r.summary = `OK ${stats.nodes} nodes, ${stats.edges} edges, ${stats.flows} flows, ${stats.pages} pages`;
  if (write && !r.errors.length) {
    const out = path.join(boardDir(root), 'build');
    fs.mkdirSync(out, { recursive: true });
    const w = (name, obj) => fs.writeFileSync(path.join(out, name), JSON.stringify(obj, hideInternal));
    w('knowledge-graph.json', toKnowledgeGraph(r.dsl, r.board));
    w('domain-graph.json', toDomainGraph(r.dsl, r.board));
    w('pages.json', r.payload);
  }
  return r;
}

export function readBuilt(root, name) {
  return readJson(path.join(boardDir(root), 'build', name), null);
}

export function runBuild(root) {
  const r = build(root);
  if (r.errors.length) { console.error(r.errors.join('\n')); return 1; }
  console.log(r.summary);
  return 0;
}
