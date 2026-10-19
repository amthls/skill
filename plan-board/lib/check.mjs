// build + kiểm tra chéo (ref, flow, decision, embed, id duy nhất).
import fs from 'node:fs';
import path from 'node:path';
import { build } from './build.mjs';

/** Trả về danh sách lỗi (chuỗi) của các kiểm tra chéo. */
export function crossCheck(root, r) {
  const errs = [];
  const { dsl, pages, board } = r;
  const flowIds = new Set(dsl.flows.map((f) => f.id));
  const layerIds = new Set(dsl.layers.map((l) => l.id));
  const resolve = (ref) => dsl.refs.has(ref) || dsl.nodeById.has(ref);
  const decisionIds = new Map();
  const uaOk = board.ua && fs.existsSync(path.resolve(root, board.ua));

  for (const p of pages) {
    const at = (b, m) => errs.push(`pages/${p._file}:${b._line || 1}: ${m}`);
    for (const s of p.sections) {
      for (const b of s.blocks) {
        if (b.kind === 'graph') {
          if (b.src === 'ua') {
            if (!uaOk) at(b, `graph src: ua nhưng board.ua ${board.ua ? `"${board.ua}" không tồn tại` : 'chưa khai báo'}`);
            continue;
          }
          for (const l of b.layers) if (!layerIds.has(l)) at(b, `graph: layer "${l}" không có trong graph.txt`);
          for (const x of [...b.ids, ...(b.focus ? [b.focus] : [])]) if (!resolve(x)) at(b, `graph: ref "${x}" không có trong graph.txt`);
        } else if (b.kind === 'flow') {
          if (b.id && !flowIds.has(b.id)) at(b, `flow: "${b.id}" không có trong graph.txt`);
        } else if (b.kind === 'decision') {
          if (b.id) {
            if (decisionIds.has(b.id)) at(b, `decision: id "${b.id}" bị trùng (đã có ở ${decisionIds.get(b.id)})`);
            else decisionIds.set(b.id, `${p.id}#${s.id}`);
          }
          if (b.status === 'done') {
            if (!b.chosen) at(b, `decision "${b.id}": status=done nhưng thiếu chosen=`);
            else if (!b.options.some((o) => o.id === b.chosen)) at(b, `decision "${b.id}": chosen "${b.chosen}" không phải option hợp lệ`);
          } else if (b.chosen) at(b, `decision "${b.id}": có chosen nhưng status chưa là done`);
        } else if (b.kind === 'embed' && b.src && !/^https?:\/\//i.test(b.src)) {
          const rel = b.src.replace(/[#?].*$/, '');
          const abs = path.resolve(root, rel);
          if (path.relative(root, abs).startsWith('..')) at(b, `embed: "${b.src}" nằm ngoài project`);
          else if (!fs.existsSync(abs)) at(b, `embed: file "${rel}" không tồn tại`);
        }
      }
    }
  }
  return errs;
}

export function runCheck(root) {
  const r = build(root);
  const errs = [...r.errors, ...(r.errors.length ? [] : crossCheck(root, r))];
  if (errs.length) { console.error(errs.join('\n')); return 1; }
  console.log(r.summary + ' · check ✓');
  return 0;
}
