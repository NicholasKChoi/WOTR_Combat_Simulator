# SGS-127 ticket report 1

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-127-blob-strong-etag.md (lint clean)

Summary: Bug, component aoe4-build-order, Risk high (Blob compare-and-swap), about 40 business-logic lines, no dependencies, milestone M9 with no criteria. Fix per the RCA: `read()` in `blob-build-store.ts` sends `accept-encoding: identity` so `get()` returns the strong etag (etag and body from the same response, no `head()`); a weak `W/` etag reaching a compare-and-swap throws, giving 503 instead of a misleading 412; `updateNamedBuild` logs the revision-mismatch 412 and the replace-conflict 412 distinctly. The RCA's Cause, Evidence and Ruled-out sections are copied into Context as given.

Acceptance criteria cover: the weak-etag unit test (fails before the fix), the `accept-encoding: identity` assertion, strong etag passed unchanged, same-response etag, 503 route behaviour, distinct 412 logs, docs (ARCHITECTURE.md storage row), and the owner's manual preview check (copy, edit, Save a new version, revision 2), labelled as live-infrastructure behaviour the unit gates cannot exercise.

On merge: delete the remote branch `debug/named-build-412-diagnostics`, and delete the BACKLOG.md "AoE4 Save a new version fails in production" bullet (superseded).

Diagrams: none (single component).

Open questions: none.

Overlap: none with open tickets. The existing blob-build-store test pins the exact `get` options for `getNamed`; the ticket tells the implementer to update only that test and list edits.

Notes: INVARIANTS.md and CONTEXT.md do not exist in the state dir, so Invariants is `none`. No criterion runs a command; none to verify.
