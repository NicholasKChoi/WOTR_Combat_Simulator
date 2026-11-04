# SGS-091 review 2 (delta after Rework 1)

Branch sgs-091-aoe4-engine-cleanups (local only). Delta reviewed: 11a4c0d..03be58b (one commit, "Share one 40-character quote limit between schema and the paste parser"), in a detached worktree at 03be58b6b2586ee30d676913845500dd13435716.

**Verdict: APPROVE**

## Blocking findings

None.

## Rework 1 required fixes

| Fix | Result | Evidence |
|---|---|---|
| One 40-character limit / one truncation helper exported from `model.ts`, used by `schema.ts` and `parse-text.ts`, local copies deleted, `quote()` output byte-for-byte the same | pass | `model.ts:21-27` adds private `MAX_QUOTED_LENGTH = 40` and exported `shortText()`. `schema.ts` drops `ID_QUOTE_CHARS`/`shortId`, and all 9 call sites now use `shortText`. `parse-text.ts` drops `MAX_QUOTED_LENGTH`, and `quote()` returns `` `'${shortText(token)}'` ``. The old `quote()` was `length > 40 ? slice+... : whole`. The new one is `length <= 40 ? whole : slice+...`, which is the same, and `String(token)` on a `string` is the identity. `git grep MAX_QUOTED_LENGTH\|shortId\|ID_QUOTE_CHARS` finds only `model.ts`. No import cycle: `model.ts` imports nothing from either module. |
| tsc, lint:dup, unit tests and touched acceptance specs green | pass | Run by me at 03be58b: `npx tsc --noEmit` is clean. `npm run lint:dup` found 0 clones. Vitest: 45 files, 1413 passed / 10 skipped. `npx next build` passes. Playwright: narrow-layout, simulate-api-checks, issue-shape, inline-issues, client-check and simulate-api-edges gave 91 passed. |

Mutation (run by me, then reverted): with `MAX_QUOTED_LENGTH = 39` in `model.ts`, 43 tests fail, 42 in `schema.test.ts` (the quoted-ids table) and 1 in `parse-text.test.ts`. Both consumers are pinned to the shared limit.

The edited pre-existing test `data.acceptance.test.ts:343` (model.ts export list gains `'shortText'`) follows from the required new export. It can still fail for a real reason: it pins the exact export list.

## Acceptance criteria

All criteria passed in review-1 at 11a4c0d. The delta only moves the limit and helper, and every message stays byte-identical (shown by the unchanged schema and parse-text tables and the acceptance specs above). So they all still pass, and all are ticked in the ticket along with the two Rework 1 fixes. No criteria are tagged `(rework 1)`.

## Invariants touched

- A3: untouched by the delta.
- S3: holds. Every schema echo site and the paste `quote()` still bound a quoted value to 43 characters through the one helper.

## Doc claims checked

- `docs/aoe4-build-order.md:524` "A quoted id longer than 40 characters is cut to its first 40 characters followed by `...` in every issue message that quotes it.": true, and now enforced by a single constant.
- `model.ts:23` comment "Bounds a user-supplied string quoted in a message to its first 40 characters plus `...`.": matches the code.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty in REPO.md, so there was no bot to run.

## Non-blocking notes

- `model.ts:21-27`: the helper sits between `RESOURCE_KINDS` and the finite-node block, which splits the node/resource list constants. The file header ("Build order input and simulation result types") also describes types only. Next to `nodeKindOf` (`model.ts:50`), or at the end of the value exports, would read more naturally. It is cosmetic.
- `model.ts:23`: the comment repeats the value 40. "to its first `MAX_QUOTED_LENGTH` characters" would not drift if the constant changes. This is minor, because the doc sentence repeats 40 as well.
- Review-1's non-blocking notes on `schema.test.ts` (the `%#` in the table title, and messages computed at collection time) are still open. They were not part of the rework.

## Coverage

Reviewed: all 4 files in 11a4c0d..03be58b (`model.ts`, `schema.ts`, `parse-text.ts`, `data.acceptance.test.ts`). I compared them with the removed copies at 11a4c0d. REPO.md "Every diff": `next build` was run. The delta has no page or UI change, and the narrow-layout and inline-issues specs exercised the page through `next dev`. I did not load the page by hand. AoE4 checklist: the copied-constant rule is now satisfied, and no doc sentence is contradicted. I did not rerun the full acceptance suite, only the six specs that cover issue messages.

No processes were left running. The review worktree was removed.
