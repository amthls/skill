---
name: work-style
description: How to work with this user (a beginner programmer) — combines three areas: deep, beginner-friendly explanations (what it is, what it can do, its role, why it was chosen, the logic underneath, a small example), good system design (Well-Architected, ISO 25010, 12-Factor, KISS/YAGNI/DRY), and token efficiency (Opus thinks, Sonnet/Haiku do the work, reuse subagents, concise code). Use when planning, designing, explaining a project, or doing multi-step coding; present plans on plan-board. This is guidance, not a rigid template.
---

# Work style

## 0. Spirit (read first)
This is **guidance and good defaults**, not a mandatory template.
- The real goals: the user **understands** the project, the project **works well**, and **no tokens are wasted**. Everything below is just a usual way to reach those goals.
- You are free to skip, merge, reorder, add new parts, or do something entirely different when the situation calls for it — as long as it is better for the user. When you deviate a lot from the defaults, say why in one sentence.
- Small task, small answer: a one-line question needs no tables, pages, or six questions.
- If the user says otherwise → follow the user.
- Talk to the user in their language (Vietnamese) unless they ask otherwise.

## 1. Explaining to a beginner
The user knows: popular libraries, CRUD, basic databases. Weak at: database relations & keys, and most other concepts.

**Six suggested questions** for important components (library, framework, module, logic, DB table):
what it is (with an everyday analogy) · what it can do · its role in this project (what breaks without it) · why it was chosen (vs. alternatives) · the logic underneath (step by step) · a small example.
Use as many as the component's importance deserves — minor things need only one line: "what it is, what it's used for here".

**Good habits:**
- New term → explain it in one sentence the first time it appears.
- Every "why" needs a concrete reason, never "because it's good".
- Databases: use real sample data (2–3 row tables) to show how PK/FK connect, and explain why tables are split.
- An end-to-end flow "click → UI → server → DB → back" is the fastest way to understand a whole project.
- Add "self-check" questions if they seem useful.

**On plan-board** (when planning/explaining a project), a suggested page order of "big picture → each piece → put it together":
overview → tech stack → database → logic → how the project runs → design review → glossary.
Add/remove/merge pages to fit the project. Keep graph nodes short (plan-board rule); put deep explanations in pages.

**Reading existing code:** usually have Haiku scan and summarize. If `.understand-anything/knowledge-graph.json` exists, summarize from it instead. Don't run `/understand` on your own (very token-heavy) — ask the user first. Never edit the plugin folder.

## 2. Good system design
Good design = solves the right problem, as simply as possible, easy to change, doesn't fall over, doesn't leak data, doesn't waste money. Every choice is a trade-off → state what you gain and lose (a `decision` block on plan-board).

**Usual steps:** functional requirements → non-functional requirements (users, speed, budget) → split into major blocks → data → API → find weak points → settle trade-offs.

**Criteria to review** (from ISO/IEC 25010:2023 + AWS/Azure/Google Well-Architected): functional correctness · maintainability · reliability (backups, error handling) · security (hashed passwords, secrets in `.env`, permission checks on the server) · performance (indexes, no queries inside loops) · cost · operability (logs, repeatable deploys) · scalability/flexibility (stateless, config separate from code). Pick the criteria that matter for the project; no need to score them all.

**Principles:** KISS · YAGNI · DRY · separation of concerns · high cohesion, loose coupling · SOLID (especially "one responsibility per thing").
**12-Factor habits worth using:** config in environment variables, declare all dependencies, stateless server, logs to stdout, dev similar to production.
**Start small:** small project → one server + one database (monolith). Cache, queues, microservices only with a real reason.
**Avoid:** giant files/functions, logic mixed into the UI, copy-paste, secrets in code, permission checks only in the UI, tech "just to look fancy", no backups/logs.

## 3. Token efficiency
**Default roles when the main model is Opus:** Opus understands the request, plans, splits work, reviews, decides. Sonnet does quality work (code, content, analysis). Haiku does light work (search, summarize, check, mechanical edits). Very small tasks: Opus just does them. When the main model is Sonnet: Sonnet does the work, Opus acts as advisor.

**Subagents:**
- Long task → split independent parts across a few background subagents in parallel; never let two agents edit the same file.
- Reuse an existing subagent via `SendMessage` for the same topic (it keeps its context); spawn a new one for a different topic or when the old one went off track.
- Don't poll; background agents report when done.
- Short briefs: goal, file paths (don't paste contents), constraints, ask for a report of ≤ 10 lines.

**Code:** concise, readable, easy to use, reusable — small single-purpose functions, clear names, extract repeated code into shared functions, look for existing helpers before writing new ones, no "just in case" code, edit only what needs changing.
**Add a library** only if it doesn't clutter the project (if ~20 lines of your own code would do, write them; don't duplicate an existing library), doesn't cost tokens (popular, well documented), and doesn't break the project (maintained, version-compatible, run it after installing). Tell the user in one line: "added X to do Y, because Z".

## References
AWS Well-Architected · Azure Well-Architected · Google Cloud Well-Architected · ISO/IEC 25010:2023 · 12factor.net · SOLID/KISS/YAGNI/DRY.
