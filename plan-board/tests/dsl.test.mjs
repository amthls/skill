import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDsl, toKnowledgeGraph, toDomainGraph, stripComment } from '../lib/dsl.mjs';

const SRC = `# chú thích
== core: Bộ não | Logic thuần
a/model.js : Lưu 54 ô #model !moderate
  fn apply(state, move) -> state : Xoay 1 mặt
  fn parse(str) -> string[]
lib:three [service] : Thư viện 3D
== ui: Giao diện
a/ui.js : Lưới
--
a/app.js : Điểm vào
note : khái niệm
a/app.js -> a/model.js, a/ui.js : gọi
a/ui.js -> lib:three [depends_on]
a/app.js -> note
`;

test('layers, node types, tags, complexity', () => {
  const d = parseDsl(SRC);
  assert.deepEqual(d.errors, []);
  assert.deepEqual(d.layers.map((l) => [l.id, l.name, l.description, l.nodeIds.length]),
    [['core', 'Bộ não', 'Logic thuần', 2], ['ui', 'Giao diện', '', 1]]);
  const m = d.nodeById.get('file:a/model.js');
  assert.equal(m.type, 'file'); assert.equal(m.filePath, 'a/model.js');
  assert.deepEqual(m.tags, ['model']); assert.equal(m.complexity, 'moderate');
  assert.equal(d.nodeById.get('lib:three').type, 'service');
  assert.equal(d.nodeById.get('concept:note').type, 'concept');
  assert.equal(d.nodeById.get('file:a/app.js').complexity, 'simple');
  assert.ok(!d.layers.some((l) => l.nodeIds.includes('file:a/app.js')), 'sau -- không có layer');
});

test('fn: id, summary giữ chữ ký, cạnh contains', () => {
  const d = parseDsl(SRC);
  const f = d.nodeById.get('function:a/model.js:apply');
  assert.equal(f.type, 'function'); assert.equal(f.summary, '(state, move) -> state — Xoay 1 mặt');
  assert.equal(d.nodeById.get('function:a/model.js:parse').summary, '(str) -> string[]');
  assert.ok(d.edges.some((e) => e.type === 'contains' && e.source === 'file:a/model.js' && e.target === f.id));
});

test('edges: nhiều đích, loại mặc định, [type], mô tả', () => {
  const d = parseDsl(SRC);
  const from = (s) => d.edges.filter((e) => e.source === s && e.type !== 'contains');
  const app = from('file:a/app.js');
  assert.equal(app.length, 3);
  assert.equal(app[0].type, 'imports'); assert.equal(app[0].description, 'gọi');
  assert.equal(app[2].type, 'calls');
  assert.equal(from('file:a/ui.js')[0].type, 'depends_on');
  assert.deepEqual([app[0].direction, app[0].weight], ['forward', 0.5]);
});

test('flows → tour + domain graph', () => {
  const d = parseDsl(`${SRC}
>> flow paint: Tô 1 ô | Người dùng chạm
a/ui.js : Nhận chạm | vào: index 20 | ra: {index:20}
a/model.js.apply : Xoay
== core2: Sau
`);
  assert.deepEqual(d.errors, []);
  assert.equal(d.flows.length, 1);
  assert.deepEqual(d.flows[0].steps.map((s) => [s.label, s.in, s.out]), [['Nhận chạm', 'index 20', '{index:20}'], ['Xoay', '', '']]);
  assert.equal(d.layers.length, 3, '== kết thúc flow');
  const kg = toKnowledgeGraph(d, { title: 'T' }, 'NOW');
  assert.equal(kg.tour.length, 2);
  assert.equal(kg.tour[0].title, 'Tô 1 ô · 1/2: Nhận chạm');
  assert.equal(kg.tour[0].description, 'Nhận chạm\n\nvào: index 20\nra: {index:20}');
  assert.deepEqual(kg.tour[1].nodeIds, ['function:a/model.js:apply']);
  assert.equal(kg.project.gitCommitHash, 'plan'); assert.deepEqual(kg.project.languages, ['JavaScript']);
  const dg = toDomainGraph(d, { title: 'Dự án Đẹp' }, 'NOW');
  assert.equal(dg.nodes[0].id, 'domain:du-an-dep');
  assert.ok(dg.nodes.some((n) => n.id === 'flow:paint'));
  const st = dg.nodes.find((n) => n.id === 'step:paint:1');
  assert.equal(st.domainMeta.entryPoint, 'file:a/ui.js');
  assert.ok(dg.edges.some((e) => e.type === 'contains_flow' && e.target === 'flow:paint'));
  const w = dg.edges.filter((e) => e.type === 'flow_step').map((e) => e.weight);
  assert.ok(w[0] < w[1] && w.every((x) => x > 0 && x <= 1));
  assert.deepEqual([dg.layers, dg.tour], [[], []]);
});

test('lỗi có số dòng', () => {
  const d = parseDsl(`== core: A
a.js : ok
a.js -> zzz.js
zzz bad : x
b.js -> a.js [nope]
  fn x()
>> flow f: F
nope.js : bước
a.js : y | sai: 1
>> flow empty: E
== core: trùng
a.js : lặp
a.js !huge
`);
  const at = (n, re) => assert.ok(d.errors.some((e) => e.line === n && re.test(e.msg)), `dòng ${n}: ${JSON.stringify(d.errors)}`);
  at(3, /zzz\.js.*chưa định nghĩa/);
  at(4, /./);
  at(5, /nope/);
  at(6, /fn/);
  at(8, /nope\.js/);
  at(9, /vào:/);
  at(10, /chưa có bước/);
  at(11, /trùng/);
  at(12, /trùng/);
  at(13, /huge/);
});

test('chú thích: # đầu dòng / sau khoảng trắng; #tag giữ nguyên', () => {
  assert.equal(stripComment('a.js : x #tag # ghi chú').trim(), 'a.js : x #tag');
  assert.equal(stripComment('# cả dòng'), '');
  assert.equal(stripComment('a.html#frag : x'), 'a.html#frag : x');
});
