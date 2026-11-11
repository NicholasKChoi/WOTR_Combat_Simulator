# SGS-131 ticket report

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-131-my-builds-no-wipe-and-backup.md

Summary: Bug ticket, component aoe4-build-order, about 50 lines, depends on SGS-128, risk standard, M9.10 (my-builds half). Root cause: `readMyBuilds` in `my-builds-storage.ts` calls `removeItem` on the whole key when the value fails to parse or has the wrong shape. `upsertMyBuild` also drops invalid elements on the next save. Scope adds `MY_BUILDS_BACKUP_KEY`, a read that never writes, a shared "intact" rule, a backup-before-overwrite in `upsertMyBuild` (first unreadable value wins), and a failed backup write giving `persisted: false` with no list write. It also adds a docs statement in `docs/aoe4-build-order.md`. Criteria cover every case in the design's My builds table plus the partial-invalid-element case, and use the SGS-128 `fakeStorage` and `throwingStorage`.

Diagrams: none (no diagram required line).
Open questions: none.
Overlap: none. It uses SGS-128's `fakeStorage(entries)`, which takes seed entries by key, so the existing local helper in `my-builds-storage.test.ts` goes away there. No SGS-130 overlap (Blob seam, different files).
Notes: one Scope line decides that a throwing `getItem` is not "not intact", so no backup is made. The design is silent on that case. The ticket-lint run printed no errors. No graph rows were added.
