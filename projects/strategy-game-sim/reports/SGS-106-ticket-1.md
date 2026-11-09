# SGS-106 ticket report 1

File: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-106-smoke-preview-and-agent-howto.md`

Title: Add `npm run smoke:preview` and document how an agent saves a build and prints its link. Component aoe4-build-order, risk standard, ~130 business-logic lines (`scripts/smoke-preview.mjs` plus one `package.json` line). Depends on SGS-103, SGS-105. Criteria M6.7 and M6.9 (docs); M6.8 is stated as human evidence.

Covered:
- Script steps, order, exit codes (0/1/2), bypass header, secret never printed, finally delete, production 405 line, all exactly as the design's Smoke table. Q12: the fixture is read via `fs` from a path resolved against `import.meta.url`; no tsx.
- Docs: two subsections after SGS-105's "Saving a build and opening it by link" (agent how-to, docs only per Q16 A; how the owner runs the smoke), with a runnable curl checked by the implementer against `npm run dev`.
- `ARCHITECTURE.md` gets a `Scripts` row (first `scripts/` dir).
- Merge hold (Q15 A) is in Context and a criterion (PR body sentence), so the tech-lead and manager hold this PR until the owner reports the smoke passed on its preview.
- Tests: an acceptance spec `acceptance/smoke-preview.spec.ts` that runs the script against a stub HTTP server (not the shared `webServer`). Reason: Vitest `include` does not cover `scripts/`, and a real-dev-server spec would race other specs, because the default build saved by SGS-105's spec has the same content (same id) the smoke saves and then deletes. Cases pin each exit code and failure path, the secret never printed, the finally delete, and the cwd-independent fixture path. The "open fails" case takes about 30 s.
- Real local verification (exit 0, then 200 with the same id on a second run) is a criterion and is recorded by the implementer against `npm run dev` with a throwaway `BUILDS_LOCAL_DIR`.

Diagrams: one Mermaid flowchart (crosses components). No state diagram.

Checks run: I did not execute any command criterion against code that does not exist yet (script, doc sections, ARCHITECTURE row are all end-state). `git grep` criteria hold in the end state by reading Scope. Confirmed from SGS-103 `savedBuildReply` row 1 that DELETE is allowed whenever env is not production, so preview and development allow it.

Open questions:
- `designer` (non-blocking, fallback given): exit code for a missing or unparsable `<url>` (ticket uses 2 with a `usage:` line).
- `designer` (non-blocking, fallback given): PASS/FAIL line format and step names (`save`, `read back`, `open`, `delete`; `PASS save: <status> <id>`); the design fixes only the production line text.
- `owner` (blocks merge only): run the smoke on this PR's preview with the bypass secret and report (M6.8).

Overlap: SGS-105 owns the "Saving a build and opening it by link" subsection and the select/`saved-build-*` ids; this ticket adds sibling subsections after it in `docs/aoe4-build-order.md` and so merges after it (dependency). The default build's saved record has the same id as the smoke's fixed build, which is why the spec uses a stub.
