# SGS-173 docs report 2 (Rework 1)

- Ticket: SGS-173. Branch: sgs-173-architecture-store-rows. Tip: f94418c. Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-173-architecture-store-rows

## Docs touched
- ARCHITECTURE.md: "AoE4 route logic" row, first two sentences replaced per the checklist (still four sentences).
- docs/aoe4-build-order-format.md: Storage, Blob store first bullet replaced per the checklist.
- Ticket Rework 1 checklist: both boxes ticked.

## Doc claims
- "`RouteReply<Body>` and `sendReply`, whose body type each route handler's response type must include" and the `errorReply`, `storageUnavailable`, `idFailure` helpers in `builds-routes.ts`: the helpers are exported from `lib/aoe4-build-order/builds-routes.ts` (checked); the body-type wording is the review's text.
- "A fresh read that still gets a weak `W/` etag throws ... The read-back makes the same kind of read, but any error in it counts as not landed": `blob-build-store.ts` throws on a weak etag for fresh reads, and the read-back sits in a `catch` (checked by grep; the full read-back path was not re-read).

## Removed claims
- Format doc: "the read-back" listed among fresh reads that throw on a weak etag (read-back swallows errors).

## CONTEXT.md Design docs rows
No change.

## Checks
No lint, codegen or link check was run this pass (text-only edit, no links added).

## Out-of-scope findings
None.

## Status
needs_review
