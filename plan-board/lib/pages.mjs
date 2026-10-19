// Trang markdown (§3) → JSON {id,title,lead,sections:[{id,title,lead,blocks}]}.
// Block mang _line/_end (số dòng trong file) — bị bỏ khi ghi JSON (khóa bắt đầu bằng "_").
import { ID_RE, slug } from './util.mjs';
import { stripComment } from './dsl.mjs';

const SPECIAL = new Set(['graph', 'flow', 'decision', 'cards', 'embed']);

export const pageIdFromFile = (file) => file.replace(/^\d+-/, '').replace(/\.md$/, '');

function kv(lines, allowed, err) {
  const out = {};
  for (const l of lines) {
    const s = stripComment(l.text).trim();
    if (!s) continue;
    const m = /^([a-z_]+)\s*:\s*(.*)$/.exec(s);
    if (!m) { err(l.n, `dòng "${s}" phải dạng "khóa: giá trị"`); continue; }
    if (!allowed.includes(m[1])) { err(l.n, `khóa "${m[1]}" không hợp lệ (${allowed.join('|')})`); continue; }
    out[m[1]] = m[2].trim();
  }
  return out;
}
const list = (v) => (v ? v.split(',').map((x) => x.trim()).filter(Boolean) : []);

function buildBlock(kind, info, lines, n0, err) {
  const e = (n, m) => err(n, m);
  const nonEmpty = lines.filter((l) => l.text.trim());
  if (kind === 'graph') {
    const o = kv(lines, ['layers', 'ids', 'focus', 'max', 'direction', 'src'], e);
    const max = o.max === undefined ? 40 : parseInt(o.max, 10);
    if (!(max > 0)) e(n0, `graph: max "${o.max}" phải là số nguyên dương`);
    const direction = (o.direction || 'RIGHT').toUpperCase();
    if (!['RIGHT', 'DOWN'].includes(direction)) e(n0, `graph: direction "${o.direction}" phải là RIGHT|DOWN`);
    const src = o.src || 'plan';
    if (!['plan', 'ua'].includes(src)) e(n0, `graph: src "${o.src}" phải là plan|ua`);
    return { kind: 'graph', layers: list(o.layers), ids: list(o.ids), focus: o.focus || '', max: max > 0 ? max : 40, direction, src };
  }
  if (kind === 'flow') {
    const first = nonEmpty.map((l) => stripComment(l.text).trim()).find(Boolean) || '';
    if (!first) e(n0, 'flow: thiếu id flow');
    return { kind: 'flow', id: first };
  }
  if (kind === 'decision') {
    const a = {};
    for (const m of info.matchAll(/(\w+)=(\S+)/g)) a[m[1]] = m[2];
    if (!a.id) e(n0, 'decision: thiếu id=…');
    else if (!ID_RE.test(a.id)) e(n0, `decision: id "${a.id}" không hợp lệ`);
    const status = a.status || 'open';
    if (!['open', 'done'].includes(status)) e(n0, `decision: status "${status}" phải là open|done`);
    let question = ''; let note = ''; const options = [];
    for (const l of lines) {
      const s = l.text.trim();
      if (!s) continue;
      let m;
      if ((m = /^\?\s*(.*)$/.exec(s))) question = m[1].trim();
      else if ((m = /^note\s*:\s*(.*)$/.exec(s))) note = m[1].trim();
      else if ((m = /^-\s*([^:\s]+)\s*:\s*(.*)$/.exec(s))) {
        const [label, desc] = m[2].split(/\s\|\s?/).map((x) => x.trim());
        if (options.some((o) => o.id === m[1])) e(l.n, `decision: option "${m[1]}" bị trùng`);
        options.push({ id: m[1], label: label || m[1], desc: desc || '' });
      } else e(l.n, `decision: dòng "${s}" không hiểu (dùng "? câu hỏi", "- id: Nhãn | mô tả", "note: …")`);
    }
    if (!question) e(n0, 'decision: thiếu dòng "? câu hỏi"');
    if (!options.length) e(n0, 'decision: chưa có option');
    return { kind: 'decision', id: a.id || '', status, question, options, chosen: a.chosen || '', note };
  }
  if (kind === 'cards') {
    const items = [];
    for (const l of nonEmpty) {
      const s = l.text.trim();
      const [head, desc] = s.split(/\s\|\s?/).map((x) => x.trim());
      const m = /^(\S+)\s+(.*)$/.exec(head);
      if (m && /\p{Extended_Pictographic}/u.test(m[1])) items.push({ icon: m[1], title: m[2], desc: desc || '' });
      else items.push({ icon: '', title: head, desc: desc || '' });
    }
    return { kind: 'cards', items };
  }
  // embed
  const o = kv(lines, ['src', 'height'], e);
  if (!o.src) e(n0, 'embed: thiếu src');
  const height = o.height === undefined ? 400 : parseInt(o.height, 10);
  if (!(height > 0)) e(n0, `embed: height "${o.height}" phải là số dương`);
  return { kind: 'embed', src: o.src || '', height: height > 0 ? height : 400 };
}

export function parsePage(text, file) {
  const errors = [];
  const err = (line, msg) => errors.push({ line, msg });
  const all = String(text).replace(/^﻿/, '').split(/\r?\n/);
  const id = pageIdFromFile(file);
  const fm = {};
  let i = 0;
  if (all[0] && all[0].trim() === '---') {
    i = 1;
    while (i < all.length && all[i].trim() !== '---') {
      const m = /^([\w-]+)\s*:\s*(.*)$/.exec(all[i]);
      if (m) fm[m[1]] = m[2].trim().replace(/^(["'])(.*)\1$/, '$2');
      i++;
    }
    if (i >= all.length) err(1, 'frontmatter thiếu dòng đóng "---"');
    i++;
  }

  const sections = [];
  let cur = { id: 'intro', title: '', lead: '', blocks: [], implicit: true };
  let md = [];
  let leadOpen = false;
  const flushMd = () => {
    const t = md.join('\n').trim();
    if (t) cur.blocks.push({ kind: 'md', md: t });
    md = [];
  };
  const endSection = () => {
    flushMd();
    if (!(cur.implicit && !cur.blocks.length)) { delete cur.implicit; sections.push(cur); }
  };
  let mdFence = null; // độ dài fence code thường đang mở

  for (; i < all.length; i++) {
    const n = i + 1;
    const line = all[i];
    if (mdFence) {
      md.push(line);
      const c = /^(`{3,})\s*$/.exec(line);
      if (c && c[1].length >= mdFence) mdFence = null;
      continue;
    }
    const f = /^(`{3,})\s*([\w-]*)\s*(.*)$/.exec(line);
    if (f) {
      leadOpen = false;
      if (!SPECIAL.has(f[2])) { mdFence = f[1].length; md.push(line); continue; }
      const body = [];
      let j = i + 1;
      let closed = false;
      for (; j < all.length; j++) {
        const c = /^(`{3,})\s*$/.exec(all[j]);
        if (c && c[1].length >= f[1].length) { closed = true; break; }
        body.push({ text: all[j], n: j + 1 });
      }
      if (!closed) err(n, `khối \`\`\`${f[2]} không có dòng đóng`);
      flushMd();
      const b = buildBlock(f[2], f[3], body, n, err);
      b._line = n; b._end = closed ? j + 1 : all.length;
      cur.blocks.push(b);
      i = closed ? j : all.length;
      continue;
    }
    const h = /^##\s+(.*?)\s*$/.exec(line);
    if (h && !line.startsWith('###')) {
      endSection();
      leadOpen = false;
      let title = h[1];
      let sid = '';
      const m = /^(.*?)\s*\{#([^}\s]+)\}$/.exec(title);
      if (m) { title = m[1]; sid = m[2]; if (!ID_RE.test(sid)) err(n, `id mục "${sid}" không hợp lệ`); }
      sid = sid || slug(title) || `muc-${sections.length + 1}`;
      if (sections.some((s) => s.id === sid)) err(n, `id mục "${sid}" bị trùng trong trang`);
      cur = { id: sid, title, lead: '', blocks: [], _line: n };
      continue;
    }
    const q = /^>\s*(.*)$/.exec(line);
    if (q) {
      if (!cur.lead && /^🎯/.test(q[1])) { cur.lead = q[1].replace(/^🎯\s*/, '').trim(); leadOpen = true; continue; }
      if (leadOpen) { cur.lead += (cur.lead ? ' ' : '') + q[1].trim(); continue; }
    } else leadOpen = false;
    md.push(line);
  }
  endSection();
  return { page: { id, title: fm.title || id, lead: fm.lead || '', sections }, errors };
}
