# Skills cho Claude Code

| Skill | Làm gì |
|---|---|
| `cach-lam-viec` | Cách làm việc: giải thích sâu cho người mới, thiết kế hệ thống tốt, tiết kiệm token (định hướng linh hoạt) |
| `plan-board` | Bảng kế hoạch web trực quan trong `.board/` |

## Cài lại
```bash
git clone https://github.com/amthls/skill.git
cp -r skill/cach-lam-viec skill/plan-board ~/.claude/skills/
cd ~/.claude/skills/plan-board/ui && pnpm install   # chỉ cần nếu muốn build lại UI
```
Thêm vào `~/.claude/CLAUDE.md`:
```
- Khi muốn lập kế hoạch/thiết kế/giải thích kiến trúc dự án → dùng skill `plan-board`.
- Khi lên kế hoạch, thiết kế, giải thích dự án hoặc làm việc nhiều bước → nạp skill `cach-lam-viec`.
```
Hook góp ý của plan-board: xem `plan-board/settings-snippet.json`.
