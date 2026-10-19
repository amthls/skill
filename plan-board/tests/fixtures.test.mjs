import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BIN = path.join(KIT, 'bin', 'board.mjs');
const board = (cwd, ...a) => spawnSync('node', [BIN, ...a], { cwd, encoding: 'utf8' });

test('examples/demo: board check qua', () => {
  const r = board(path.join(KIT, 'examples', 'demo'), 'check');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^OK \d+ nodes, \d+ edges, 2 flows, 3 pages/);
});

test('mọi template: init + check qua', () => {
  for (const t of ['blank', 'web', 'game', 'api', 'ai', 'mobile']) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), `pb-t-${t}-`));
    const i = board(dir, 'init', '--template', t);
    assert.equal(i.status, 0, i.stderr);
    const c = board(dir, 'check');
    assert.equal(c.status, 0, `${t}: ${c.stderr}`);
    assert.equal(board(dir, 'init', '--template', t).status, 0, 'init lần hai không ghi đè');
  }
});

test('build lỗi → exit 1 với graph.txt:<dòng>', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-err-'));
  board(dir, 'init');
  fs.appendFileSync(path.join(dir, '.board', 'graph.txt'), '\nx.js -> nope.js\n');
  const r = board(dir, 'build');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /^graph\.txt:\d+: /m);
});

test('context ≤ 40 dòng, get hoạt động', () => {
  const demo = path.join(KIT, 'examples', 'demo');
  const c = board(demo, 'context');
  assert.ok(c.stdout.trim().split('\n').length <= 40);
  assert.match(c.stdout, /framework/);
  assert.match(board(demo, 'get', 'add-task').stdout, /^flow add-task/);
  assert.match(board(demo, 'get', 'ke-hoach#ui').stdout, /decision framework open/);
});
