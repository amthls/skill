// board context (≤ 40 dòng) và board get <id>.
import { build } from './build.mjs';
import { pendingCount } from './inbox.mjs';
import { cut } from './util.mjs';

const MAX = 40;

export function context(root) {
  const r = build(root, { write: false });
  const L = [];
  L.push(`# ${r.board.title}${r.board.subtitle ? ' — ' + cut(r.board.subtitle, 60) : ''}`);
  if (r.errors.length) {
    L.push(`LỖI ${r.errors.length} (board check):`, ...r.errors.slice(0, 5).map((e) => '  ' + cut(e, 120)));
  }
  L.push('trang:');
  for (const p of r.pages) {
    L.push(` ${p.id} «${cut(p.title, 30)}»: ${p.sections.map((s) => s.id).join(', ') || '(trống)'}`);
  }
  const inLayer = new Set(r.dsl.layers.flatMap((l) => l.nodeIds));
  const free = r.dsl.nodes.filter((n) => n.type !== 'function' && !inLayer.has(n.id)).length;
  L.push('layer: ' + (r.dsl.layers.map((l) => `${l.id}(${l.nodeIds.length})`).join(' ') || '-') + (free ? ` | ngoài layer(${free})` : ''));
  L.push('flow: ' + (r.flows.map((f) => `${f.id}(${f.steps.length})`).join(' ') || '-'));
  const open = [];
  for (const p of r.pages) for (const s of p.sections) for (const b of s.blocks) {
    if (b.kind === 'decision' && b.status !== 'done') open.push(`${b.id} @${p.id}#${s.id}: ${cut(b.question, 60)} [${b.options.map((o) => o.id).join('|')}]`);
  }
  L.push(`quyết định MỞ (${open.length}):`, ...open.map((x) => ' ' + x));
  L.push(`inbox chờ: ${pendingCount(root)}`);
  return (L.length > MAX ? [...L.slice(0, MAX - 1), `…(cắt ${L.length - MAX + 1} dòng)`] : L).join('\n');
}

const nodeLines = (r, n) => {
  const layer = r.dsl.layers.find((l) => l.nodeIds.includes(n.id));
  const out = [`${n.id} [${n.type}]${layer ? ' layer=' + layer.id : ''} ${n.complexity}${n.tags.length ? ' #' + n.tags.join(' #') : ''}`];
  if (n.summary) out.push(`  ${n.summary}`);
  for (const e of r.dsl.edges) {
    if (e.type === 'contains' && e.source === n.id) out.push(`  fn ${e.target.split(':').pop()}`);
    else if (e.source === n.id) out.push(`  -> ${e.target} [${e.type}]${e.description ? ' ' + cut(e.description, 60) : ''}`);
    else if (e.target === n.id && e.type !== 'contains') out.push(`  <- ${e.source} [${e.type}]`);
  }
  const inFlows = r.flows.filter((f) => f.steps.some((s) => s.nodeId === n.id)).map((f) => f.id);
  if (inFlows.length) out.push(`  flow: ${inFlows.join(', ')}`);
  return out;
};

const blockLines = (b) => {
  switch (b.kind) {
    case 'md': return [`  md: ${cut(b.md, 400)}`];
    case 'graph': return [`  graph layers=${b.layers.join(',')} ids=${b.ids.join(',')} focus=${b.focus} max=${b.max} ${b.direction} src=${b.src}`];
    case 'flow': return [`  flow ${b.id}`];
    case 'cards': return b.items.map((i) => `  card ${i.icon} ${i.title} | ${i.desc}`);
    case 'embed': return [`  embed ${b.src} h=${b.height}`];
    case 'decision': return [`  decision ${b.id} ${b.status}${b.chosen ? ' chosen=' + b.chosen : ''}: ${b.question}`,
      ...b.options.map((o) => `    - ${o.id}: ${o.label}${o.desc ? ' | ' + o.desc : ''}`), ...(b.note ? [`    note: ${b.note}`] : [])];
    default: return [];
  }
};

export function get(root, id) {
  const r = build(root, { write: false });
  // quyết định
  for (const p of r.pages) for (const s of p.sections) for (const b of s.blocks) {
    if (b.kind === 'decision' && b.id === id) return [`${p.id}#${s.id}`, ...blockLines(b)].join('\n');
  }
  const flow = r.flows.find((f) => f.id === id);
  if (flow) {
    return [`flow ${flow.id}: ${flow.title}${flow.description ? ' | ' + flow.description : ''}`,
      ...flow.steps.map((s, i) => `  ${i + 1}. ${s.nodeId}: ${s.label}${s.in ? ' | vào: ' + s.in : ''}${s.out ? ' | ra: ' + s.out : ''}`)].join('\n');
  }
  const [pid, sid] = id.split('#');
  const page = r.pages.find((p) => p.id === pid);
  if (page && sid) {
    const s = page.sections.find((x) => x.id === sid);
    if (!s) return `không thấy mục "${sid}" trong ${pid} (có: ${page.sections.map((x) => x.id).join(', ')})`;
    return [`${pid}#${s.id} «${s.title}»${s.lead ? ' 🎯 ' + s.lead : ''}`, ...s.blocks.flatMap(blockLines)].join('\n');
  }
  if (page) {
    return [`${page.id} «${page.title}»${page.lead ? ' — ' + page.lead : ''}`,
      ...page.sections.map((s) => `  #${s.id} «${s.title}» ${s.blocks.map((b) => b.kind).join(',')}`)].join('\n');
  }
  const nid = r.dsl.refs.get(id) || (r.dsl.nodeById.has(id) ? id : null);
  if (nid) return nodeLines(r, r.dsl.nodeById.get(nid)).join('\n');
  return `không thấy "${id}" (thử: ref node, page#mục, flow id, decision id)`;
}
