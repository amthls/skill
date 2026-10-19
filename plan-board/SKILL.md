---
name: plan-board
description: Plan, discuss, design, or explain the architecture of ANY project (web, game, API, AI, mobile…) on a visual web board instead of text chat. Use when the user wants to "make a plan", "discuss a design", "draw the architecture/diagram", "explain the project", needs a plan board / visual diagram, or wants to pick options and comment right on the page.
---

# Plan Board

A local planning board: the AI writes only compact text in `<project>/.board/`, the `board` CLI compiles it into a graph + discussion pages, and the user views/chooses/comments on the web.

CLI: `node ~/.claude/skills/plan-board/bin/board.mjs <command>` (short: `board`).

## 1. When to use
- The user wants to plan / discuss / design / explain the architecture of a project (new or existing).
- Choosing between options (framework, hosting, DB…) and recording the decision.
- Diagrams, step-by-step flows, or visual explanation pages instead of long chat text.
- NOT for everyday code edits or one-line questions.

## 2. Loop
1. `board init --template web|game|api|ai|mobile|blank` (in the project folder; never overwrites existing files).
2. Edit `.board/graph.txt` (architecture + flows) and `.board/pages/NN-*.md` (discussion pages). Syntax: `docs/DSL-CHEATSHEET.md`.
3. `board check` — repeat until it prints `OK … check ✓`.
4. `board serve` (run in BACKGROUND, e.g. `run_in_background`) — give the user the URL, then stop talking; they review and comment on the page.
5. Feedback arrives via the hook (auto-inserted `[plan-board] góp ý mới:`) or the user pastes a `[board …] … [inbox@N]` block. To review again: `board inbox`.
6. Apply: SMALL edits in `.board/` (Edit the exact snippet), settle choices with `board decide <id> <option> "note"`, then `board check`. The server rebuilds itself; go back to step 4.
The hook needs a one-time install: see `settings-snippet.json` (the user pastes it into settings.json).

## 3. TOKEN-SAVING RULES (mandatory)
- Write ONLY text in `.board/` (graph.txt, pages/*.md, embeds/). Don't edit the kit's UI code.
- DON'T read `.board/build/` or `dist/` (generated, very large).
- For status: `board context` (≤40 lines). For details on one thing: `board get <node-ref | page#section | flow-id | decision-id>`. Don't read whole files to "review".
- Use Edit for small snippets; don't rewrite whole files. Adding a node/page = adding a few lines.
- Each summary / description ≤ 100 characters. Short pages, one idea per section, start with `> 🎯 Bạn sẽ hiểu được: …` (or the user's language).
- Verify with `board check`, NOT screenshots (screenshot only when editing the kit's own UI).
- Delegating to a subagent: give FILE PATHS, don't paste contents; require replies ≤ 10 lines.
- Checks/chores (check, summarize, lint) use Haiku.
- All ids (page, section, flow, decision, layer) use `a-z0-9._/-` and stay stable — edit by id, don't rename.

## 4. Blocks in a `.md` page
Only 5 special fence types: `graph`, `flow`, `decision`, `cards`, `embed` (examples in `docs/DSL-CHEATSHEET.md`). Everything else is regular GFM markdown (tables, `- [ ]`, numbered lists).
Open decision: `decision id=… status=open`; `board decide` turns it into `status=done chosen=…`.

## 5. Look up when needed (don't read upfront)
- Full contract: `schema/SCHEMA.md`
- Quick syntax: `docs/DSL-CHEATSHEET.md` · templates: `docs/TEMPLATES.md`
- Runnable sample project: `examples/demo/.board/`
- Run it for the user: `plan-board.bat` (in the project folder).
