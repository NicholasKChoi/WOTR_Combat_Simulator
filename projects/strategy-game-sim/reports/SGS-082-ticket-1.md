# SGS-082 ticket-1
Wrote tickets/SGS-082-aoe4-remove-build-order-ui-spec.md (risk low, depends on SGS-081).
Explored on main cc9bb04 (SGS-081 not yet merged): spec is 925 lines, 46 tests, UI-only. All helpers.ts exports it uses
are used by other specs (hexToRgb by pin-compare), so no helper becomes dead. No repo doc, REPO.md or LESSONS.md names the file.
BACKLOG bullets to delete: "~396/429 marker labels stay apart" (SGS-067) and ":493 compares two separate boundingBox() reads" (SGS-081 review 5).
Open questions (owner): other UI-only aoe4 specs listed in the ticket; accepted coverage loss.
No commands were run beyond grep/wc (no tsc/acceptance run; criteria are end-state checks for the implementer).
Worktree removed.
