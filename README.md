# Claude Code skills

| Skill | What it does |
|---|---|
| `work-style` | How to work: deep beginner-friendly explanations, good system design, token efficiency (flexible guidance) |
| `plan-board` | Visual web planning board in `.board/` |

## Reinstall
```bash
git clone https://github.com/amthls/skill.git
cp -r skill/work-style skill/plan-board ~/.claude/skills/
cd ~/.claude/skills/plan-board/ui && pnpm install   # only needed to rebuild the UI
```
Add to `~/.claude/CLAUDE.md`:
```
- When planning/designing/explaining a project's architecture → use the `plan-board` skill.
- When planning, designing, explaining a project, or doing multi-step work → load the `work-style` skill.
```
plan-board feedback hook: see `plan-board/settings-snippet.json`.

Note: plan-board templates and docs are still in Vietnamese.
