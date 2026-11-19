# SGS-209 implementer 7 (Rework 1)

Status: needs_review
Branch: sgs-209-rename-api-patch-named-builds, tip eba21efd41be85ed042e117ffb8b77a7c849a523 (was bce5d14)
Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-209-rename-api-patch-named-builds
Own-commit check: skipped (checkout had no origin/<branch> ref).

## Files touched
- lib/aoe4-build-order/saved-builds.ts: `nameIssue` replaced by exported `nameLengthIssue(name)`; the save check calls it with `checked.order.name`.
- lib/aoe4-build-order/named-builds-routes.ts: `checkRenameRequest` calls `nameLengthIssue(trimmed)`; no copy of the check or message remains; import swapped (SAVED_NAME_MAX_CHARS no longer used there).
- lib/aoe4-build-order/named-builds-routes.test.ts: new table "answers 405 for %s in %s on a malformed id before the id form is checked" (POST in development, DELETE in production, id `AbCdEfGhIjK`), `toStrictEqual` on status, `Allow` header and message, and getter never called.
- lib/aoe4-build-order/save-rate-limit.ts: `SAVE_RATE_LIMIT` comment replaced verbatim.
- Ticket: Rework 1 boxes ticked.

## Tests
- `npm test`: 91 files passed, 1 skipped; 2932 passed, 15 skipped, 0 failed.
- No acceptance spec added or edited.
- Pre-existing tests edited: none.

## Doc claims
- save-rate-limit.ts `SAVE_RATE_LIMIT`: given verbatim by the ticket ("shared by saves, named-build creates, updates and renames"); the rename route spends a slot via `writeNextRevision` in named-builds-routes.ts.

## Mutation checks
- Swapped the method check and id-form check in `namedBuildReply` (named-builds-routes.ts ~177-179): both new rows failed on their own assertion (405 expected, got 404); undone (file restored from copy).
- `nameLengthIssue` `<=` to `<` (saved-builds.ts:97): "accepts a name of exactly the cap length..." and "accepts a name of 100 characters and rejects 101" failed; undone (sed reverted).
- Getter-not-called assertion: not separately broken; the swapped-order break fails on the status/body before it.

## Codegen / build / lint
- codegen: none set. build (`next build`): passes. lint (`tsc --noEmit && lint:dup`): exit 0.

## Invariant check
S3 unchanged (rename still takes a write-budget slot). No other invariant touched.

## Unverified assumptions added
None.

## Out-of-scope findings
None.
