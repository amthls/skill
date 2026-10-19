import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { decide } from '../lib/decide.mjs';
import { parsePage } from '../lib/pages.mjs';

function project(md) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-dec-'));
  fs.mkdirSync(path.join(root, '.board', 'pages'), { recursive: true });
  fs.writeFileSync(path.join(root, '.board', 'pages', '01-p.md'), md);
  return root;
}
const MD = '## A\ntrước\n```decision id=r status=open\n? Chọn?\n- x: X | một\n- y: Y\n```\nsau\n';
const read = (root) => fs.readFileSync(path.join(root, '.board', 'pages', '01-p.md'), 'utf8');

test('decide viết lại fence thành done + note', () => {
  const root = project(MD);
  const r = decide(root, 'r', 'x', 'chốt  nhanh');
  assert.ok(r.ok, r.msg);
  const t = read(root);
  assert.equal(t, '## A\ntrước\n```decision id=r status=done chosen=x\n? Chọn?\n- x: X | một\n- y: Y\nnote: chốt nhanh\n```\nsau\n');
  const b = parsePage(t, '01-p.md').page.sections[0].blocks.find((x) => x.kind === 'decision');
  assert.deepEqual([b.status, b.chosen, b.note], ['done', 'x', 'chốt nhanh']);
  // chọn lại: thay note cũ, không nhân đôi
  decide(root, 'r', 'y', '');
  const t2 = read(root);
  assert.ok(t2.includes('chosen=y') && !t2.includes('note:'));
});

test('decide báo lỗi option/id sai, không đụng file', () => {
  const root = project(MD);
  assert.equal(decide(root, 'r', 'zzz').ok, false);
  assert.equal(decide(root, 'none', 'x').ok, false);
  assert.equal(read(root), MD);
});
