// graph.txt (DSL §2) → cấu trúc nội bộ → UA knowledge-graph + domain-graph.
import { ID_RE, slug } from './util.mjs';

const NODE_TYPES = new Set(['file', 'function', 'class', 'module', 'concept', 'config', 'document', 'service',
  'table', 'endpoint', 'pipeline', 'schema', 'resource', 'domain', 'flow', 'step', 'article', 'entity',
  'topic', 'claim', 'source', 'page', 'screen', 'component', 'componentSet', 'instance', 'token']);
const EDGE_TYPES = new Set(['imports', 'exports', 'contains', 'inherits', 'implements', 'calls', 'subscribes',
  'publishes', 'middleware', 'reads_from', 'writes_to', 'transforms', 'validates', 'depends_on', 'tested_by',
  'configures', 'related', 'similar_to', 'deploys', 'serves', 'provisions', 'triggers', 'migrates', 'documents',
  'routes', 'defines_schema', 'contains_flow', 'flow_step', 'cross_domain', 'cites', 'contradicts', 'builds_on',
  'exemplifies', 'categorized_under', 'authored_by', 'instance_of', 'variant_of', 'uses_token']);
const COMPLEXITY = new Set(['simple', 'moderate', 'complex']);
const EXT_RE = /\.[A-Za-z0-9]{1,8}$/;
const SEP_RE = /\s:(?:\s|$)/;
const LANGS = {
  js: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript', jsx: 'JavaScript', ts: 'TypeScript',
  tsx: 'TypeScript', py: 'Python', go: 'Go', rs: 'Rust', java: 'Java', kt: 'Kotlin', swift: 'Swift',
  cs: 'C#', cpp: 'C++', c: 'C', rb: 'Ruby', php: 'PHP', dart: 'Dart', gd: 'GDScript', lua: 'Lua',
  html: 'HTML', css: 'CSS', sql: 'SQL', sh: 'Shell',
};

/** Bỏ chú thích: `#` đầu dòng, hoặc sau khoảng trắng và theo sau bởi khoảng trắng/hết dòng/`#`. `#tag` vẫn là tag. */
export function stripComment(line) {
  for (let i = 0; i < line.length; i++) {
    if (line[i] !== '#') continue;
    const atStart = line.slice(0, i).trim() === '';
    const prevWs = i > 0 && /\s/.test(line[i - 1]);
    const next = line[i + 1];
    if (atStart || (prevWs && (next === undefined || /[\s#]/.test(next)))) return line.slice(0, i);
  }
  return line;
}

function splitSep(s) {
  const m = SEP_RE.exec(s);
  if (!m) return [s.trim(), null];
  return [s.slice(0, m.index).trim(), s.slice(m.index + m[0].length).trim()];
}

/** Tách `#tag` và `!complexity` ở cuối dòng. */
function takeTail(s, err) {
  const tags = [];
  let complexity = 'simple';
  let seenCx = false;
  for (;;) {
    const m = /\s+(#[^\s#]+|![^\s]+)$/.exec(s);
    if (!m) break;
    s = s.slice(0, m.index);
    const tok = m[1];
    if (tok[0] === '#') tags.unshift(tok.slice(1));
    else {
      const c = tok.slice(1);
      if (!COMPLEXITY.has(c)) err(`độ phức tạp "${c}" sai — dùng simple|moderate|complex`);
      else if (!seenCx) { complexity = c; seenCx = true; }
    }
  }
  return { rest: s.trim(), tags, complexity };
}

export function parseDsl(text) {
  const errors = [];
  const nodes = [];
  const edges = [];
  const layers = [];
  const flows = [];
  const refs = new Map(); // ref → nodeId
  const nodeById = new Map();
  let layer = null;
  let flow = null;
  let curFile = null; // node file gần nhất (cho `fn`)
  const lines = String(text).replace(/^﻿/, '').split(/\r?\n/);

  lines.forEach((raw, idx) => {
    const ln = idx + 1;
    const err = (m) => errors.push({ line: ln, msg: m });
    const line = stripComment(raw).trim();
    if (!line) return;

    if (line.startsWith('==')) {
      flow = null;
      const m = /^==\s*([^:\s]+)\s*(?::\s*(.*))?$/.exec(line);
      if (!m) return err('layer sai cú pháp — dùng "== id: Tên | mô tả"');
      if (!ID_RE.test(m[1])) return err(`id layer "${m[1]}" không hợp lệ (a-z 0-9 . _ / -)`);
      if (layers.some((l) => l.id === m[1])) return err(`layer "${m[1]}" bị trùng`);
      const [name, desc] = (m[2] || '').split(/\s\|\s?/).map((x) => x.trim());
      layer = { id: m[1], name: name || m[1], description: desc || '', nodeIds: [] };
      layers.push(layer);
      return;
    }
    if (line === '--') { layer = null; flow = null; return; }

    if (line.startsWith('>>')) {
      const m = /^>>\s*flow\s+([^:\s]+)\s*:\s*(.*)$/.exec(line);
      if (!m) return err('flow sai cú pháp — dùng ">> flow id: Tiêu đề | mô tả"');
      if (!ID_RE.test(m[1])) return err(`id flow "${m[1]}" không hợp lệ`);
      if (flows.some((f) => f.id === m[1])) return err(`flow "${m[1]}" bị trùng`);
      const [title, desc] = m[2].split(/\s\|\s?/).map((x) => x.trim());
      flow = { id: m[1], title: title || m[1], description: desc || '', steps: [], line: ln };
      flows.push(flow);
      return;
    }

    if (flow) { // dòng bước
      const parts = line.split(/\s\|\s?/);
      const [ref, label] = splitSep(parts[0]);
      const nodeId = refs.get(ref);
      if (!nodeId) return err(`bước flow: ref "${ref}" chưa định nghĩa`);
      const step = { ref, nodeId, label: label || ref, in: '', out: '', line: ln };
      for (const p of parts.slice(1)) {
        const m = /^(vào|ra)\s*:\s*(.*)$/i.exec(p.trim());
        if (!m) { err(`bước flow: phần "${p.trim()}" phải bắt đầu "vào:" hoặc "ra:"`); continue; }
        if (m[1].toLowerCase() === 'vào') step.in = m[2].trim();
        else step.out = m[2].trim();
      }
      flow.steps.push(step);
      return;
    }

    if (line.startsWith('fn ') || line === 'fn') { // hàm
      if (!curFile) return err('"fn" phải nằm dưới một node file');
      const { rest, tags, complexity } = takeTail(line.slice(3), err);
      const [head, desc] = splitSep(rest);
      const nm = /^([A-Za-z_$][\w$]*)/.exec(head);
      if (!nm) return err('fn: thiếu tên hàm');
      const name = nm[1];
      const sig = head.slice(name.length).trim();
      const ref = `${curFile.ref}.${name}`;
      if (refs.has(ref)) return err(`hàm "${ref}" bị trùng`);
      const id = `function:${curFile.ref}:${name}`;
      const summary = sig && desc ? `${sig} — ${desc}` : sig || desc || '';
      const n = { id, type: 'function', name, filePath: curFile.ref, summary, tags, complexity };
      nodes.push(n); nodeById.set(id, n); refs.set(ref, id);
      edges.push({ source: curFile.id, target: id, type: 'contains', direction: 'forward', weight: 1 });
      return;
    }

    const [head, desc] = splitSep(line);
    if (head.includes('->')) { // cạnh
      curFile = null;
      const m = /^(\S+)\s*->\s*(.+)$/.exec(head);
      if (!m) return err('cạnh sai cú pháp — dùng "a -> b, c [loại] : mô tả"');
      let tgt = m[2];
      let type = null;
      const tm = /\s*\[([^\]\s]+)\]\s*$/.exec(tgt);
      if (tm) { type = tm[1]; tgt = tgt.slice(0, tm.index); }
      if (type && !EDGE_TYPES.has(type)) return err(`loại cạnh "${type}" không có trong UA`);
      const targets = tgt.split(',').map((x) => x.trim()).filter(Boolean);
      if (!targets.length) return err('cạnh thiếu đích');
      const src = refs.get(m[1]);
      if (!src) return err(`ref "${m[1]}" chưa định nghĩa`);
      for (const t of targets) {
        const dst = refs.get(t);
        if (!dst) { err(`ref "${t}" chưa định nghĩa`); continue; }
        if (dst === src) { err(`cạnh tự trỏ vào "${t}"`); continue; }
        const bothFiles = src.startsWith('file:') && dst.startsWith('file:');
        const e = { source: src, target: dst, type: type || (bothFiles ? 'imports' : 'calls'), direction: 'forward', weight: 0.5 };
        if (desc) e.description = desc;
        edges.push(e);
      }
      return;
    }

    // node
    const tl = takeTail(line, err);
    const [h2, summary] = splitSep(tl.rest);
    const hm = /^(\S+)(?:\s+\[([^\]\s]+)\])?$/.exec(h2);
    if (!hm) return err('node sai cú pháp — dùng "ref [loại] : mô tả #tag !độ-phức-tạp"');
    const ref = hm[1];
    if (ref.endsWith(':')) return err(`thiếu khoảng trắng trước dấu ":" sau "${ref}" (viết "ref : mô tả")`);
    if (refs.has(ref)) return err(`node "${ref}" bị trùng`);
    let id; let type; let filePath; let name;
    if (ref.startsWith('lib:')) { id = ref; type = 'service'; name = ref.slice(4) || ref; }
    else if (EXT_RE.test(ref)) { id = `file:${ref}`; type = 'file'; filePath = ref; name = ref.split('/').pop(); }
    else { id = `concept:${ref}`; type = 'concept'; name = ref; }
    if (hm[2]) {
      if (!NODE_TYPES.has(hm[2])) return err(`loại node "${hm[2]}" không có trong UA`);
      type = hm[2];
    }
    const n = { id, type, name, summary: summary || '', tags: tl.tags, complexity: tl.complexity };
    if (filePath) n.filePath = filePath;
    nodes.push(n); nodeById.set(id, n); refs.set(ref, id);
    if (layer) layer.nodeIds.push(id);
    curFile = filePath ? { ref, id } : null;
  });

  for (const f of flows) if (!f.steps.length) errors.push({ line: f.line, msg: `flow "${f.id}" chưa có bước nào` });
  errors.sort((a, b) => a.line - b.line);
  return { nodes, edges, layers, flows, refs, nodeById, errors };
}

export const fmtErrors = (errors, file = 'graph.txt') => errors.map((e) => `${file}:${e.line}: ${e.msg}`);

function inferLangs(nodes) {
  const set = new Set();
  for (const n of nodes) {
    if (n.type !== 'file' || !n.filePath) continue;
    const m = /\.([A-Za-z0-9]+)$/.exec(n.filePath);
    if (m && LANGS[m[1].toLowerCase()]) set.add(LANGS[m[1].toLowerCase()]);
  }
  return [...set];
}

const stepText = (s) => {
  let d = s.label;
  if (s.in || s.out) d += '\n';
  if (s.in) d += `\nvào: ${s.in}`;
  if (s.out) d += `\nra: ${s.out}`;
  return d;
};

export function toKnowledgeGraph(dsl, board, now = new Date().toISOString()) {
  const tour = [];
  let order = 0;
  for (const f of dsl.flows) {
    f.steps.forEach((s, i) => {
      tour.push({ order: ++order, title: `${f.title} · ${i + 1}/${f.steps.length}: ${s.label}`, description: stepText(s), nodeIds: [s.nodeId] });
    });
  }
  return {
    version: '1.0.0',
    kind: 'codebase',
    project: { name: board.title || 'Plan Board', languages: inferLangs(dsl.nodes), frameworks: [], description: board.subtitle || '', analyzedAt: now, gitCommitHash: 'plan' },
    nodes: dsl.nodes,
    edges: dsl.edges,
    layers: dsl.layers,
    tour,
  };
}

export function toDomainGraph(dsl, board, now = new Date().toISOString()) {
  const title = board.title || 'Plan Board';
  const domainId = `domain:${slug(title) || 'plan'}`;
  const nodes = [{
    id: domainId, type: 'domain', name: title, summary: board.subtitle || title, tags: ['plan'], complexity: 'moderate',
    domainMeta: { entities: dsl.layers.map((l) => l.name), businessRules: [], crossDomainInteractions: [] },
  }];
  const edges = [];
  for (const f of dsl.flows) {
    const n = f.steps.length;
    const flowId = `flow:${f.id}`;
    nodes.push({
      id: flowId, type: 'flow', name: f.title, summary: f.description || f.title, tags: ['flow'],
      complexity: n <= 4 ? 'simple' : n <= 8 ? 'moderate' : 'complex',
      domainMeta: { entryPoint: f.title, entryType: 'manual' },
    });
    edges.push({ source: domainId, target: flowId, type: 'contains_flow', direction: 'forward', weight: 1 });
    f.steps.forEach((s, i) => {
      const stepId = `step:${f.id}:${i + 1}`;
      const ref = dsl.nodeById.get(s.nodeId);
      const sn = {
        id: stepId, type: 'step', name: s.label.length > 60 ? s.label.slice(0, 59) + '…' : s.label,
        summary: stepText(s).replace(/\n+/g, ' · '), tags: ['step'], complexity: 'simple',
        domainMeta: { entryPoint: s.nodeId },
      };
      if (ref && ref.filePath) sn.filePath = ref.filePath;
      nodes.push(sn);
      // trọng số tăng dần theo thứ tự bước, nằm trong (0,1)
      edges.push({ source: flowId, target: stepId, type: 'flow_step', direction: 'forward', weight: Math.round(((i + 1) / (n + 1)) * 1000) / 1000 });
    });
  }
  return {
    version: '1.0.0',
    project: { name: title, languages: inferLangs(dsl.nodes), frameworks: [], description: board.subtitle || '', analyzedAt: now, gitCommitHash: 'plan' },
    nodes, edges, layers: [], tour: [],
  };
}
