#!/usr/bin/env node
// Plan Board CLI — node ≥ 18, không phụ thuộc gì. Xem schema/SCHEMA.md §4.
import { needRoot } from '../lib/util.mjs';

const HELP = `board — Plan Board
  init [--template blank|web|game|api|ai|mobile]
  build | check | context | get <id>
  serve [--port 4173] [--no-open]
  decide <decisionId> <optionId> ["note"]
  inbox [--peek] | hook`;

const argv = process.argv.slice(2);
const cmd = argv[0];
const rest = argv.slice(1);
const flag = (n) => rest.includes(n);
const opt = (n) => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : undefined; };
const positional = () => {
  const out = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i].startsWith('--')) { if (['--port', '--template'].includes(rest[i])) i++; } else out.push(rest[i]);
  }
  return out;
};

async function main() {
  switch (cmd) {
    case 'init': {
      const { init } = await import('../lib/init.mjs');
      const r = init(process.cwd(), opt('--template') || 'blank');
      (r.ok ? console.log : console.error)(r.msg);
      return r.ok ? 0 : 1;
    }
    case 'build': return (await import('../lib/build.mjs')).runBuild(needRoot());
    case 'check': return (await import('../lib/check.mjs')).runCheck(needRoot());
    case 'context': console.log((await import('../lib/context.mjs')).context(needRoot())); return 0;
    case 'get': {
      const id = positional()[0];
      if (!id) { console.error('Dùng: board get <id>'); return 1; }
      console.log((await import('../lib/context.mjs')).get(needRoot(), id));
      return 0;
    }
    case 'decide': {
      const [d, o, note] = positional();
      if (!d || !o) { console.error('Dùng: board decide <decisionId> <optionId> ["note"]'); return 1; }
      const r = (await import('../lib/decide.mjs')).decide(needRoot(), d, o, note || '');
      (r.ok ? console.log : console.error)(r.msg);
      return r.ok ? 0 : 1;
    }
    case 'inbox': {
      const r = (await import('../lib/inbox.mjs')).runInbox(needRoot(), { peek: flag('--peek') });
      console.log(r.text || 'Không có góp ý mới.');
      return 0;
    }
    case 'hook': try { return await (await import('../lib/inbox.mjs')).runHook(); } catch { return 0; } // hook luôn im lặng khi lỗi
    case 'serve': {
      const port = parseInt(opt('--port') || '4173', 10);
      const root = needRoot();
      const { startServer } = await import('../lib/server.mjs');
      const s = await startServer(root, { port, open: !flag('--no-open') });
      const stop = async () => { await s.close(); process.exit(0); };
      process.on('SIGINT', stop);
      process.on('SIGTERM', stop);
      return null; // giữ tiến trình
    }
    case undefined: case 'help': case '--help': case '-h': console.log(HELP); return 0;
    default: console.error(`Lệnh "${cmd}" không có.\n${HELP}`); return 1;
  }
}

main().then((code) => { if (code !== null) process.exitCode = code; }, (e) => {
  console.error(`Lỗi: ${e.message}`);
  process.exitCode = 1;
});
