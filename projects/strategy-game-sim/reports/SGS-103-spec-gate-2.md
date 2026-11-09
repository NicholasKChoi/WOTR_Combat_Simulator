# SGS-103 spec gate 2

Ticket: `tickets/SGS-103-builds-api-routes.md`. Design `design/M6.md` C3 (pass 4), C4, C7. Checked against origin/main (1e6d6c2) and the SGS-099 and SGS-101 tickets as drafted.

## Verdict: READY

## Earlier gaps

1. SavedBuild / SavedBuildWithId composition: closed. Scope item 7 and the contract criteria now use an open `SavedBuild` (all three properties required, no `additionalProperties`) and `SavedBuildWithId` as `allOf` plus `unevaluatedProperties: false`. This matches amended C3 word for word. The three closed response-side schemas are named. Ajv `2020` with `strict: false` is stated.
2. One-source grep: closed. It now searches `request body: must be a JSON object`, which `pages/api/fight.ts` (`request body must be a JSON object`) does not match. The other two greps allow `fight.ts`, which still holds its own `isPlainObject` and 405 on main.

The gate-1 notes are also taken up: the Invariants S3 wording, the `webServer.env` filter and `VERCEL_ENV` removal, the `postBuildRaw` content type, the surface spec title, the stray memo clause removed, and the CONTEXT.md Key surfaces entry under On merge.

## Check results

| # | Check | Result |
|---|-------|--------|
| 1 | Grounded scope | Pass. Simulate handler, `playwright.config.ts` (`webServer` has no `env` today), the 2.3.0 pins and `fight-api-spec-surface.spec.ts` exist on main. New files are marked new. `test-results/` is git-ignored. `Date.now` has no match in non-test `pages` or `lib` on main, so the end-state grep holds. |
| 2 | Testable criteria | Pass. Each row has an observable status, headers and body. Existing tests: the rule is stated (version, path and schema-name pins take the new value, the rest keep theirs). Counts (30, 31, 3600, 65536) are design constants. |
| 3 | Open questions | None in ticket or CONTEXT.md. |
| 4 | Invariants | S3 and A3 named, no contradiction. S3 text quoted. |
| 5 | Contracts | Matches C3, C4, C7. Matches SGS-099 (`checkSaveBuildRequest` union, `BuildsError`, the private copy SGS-103 deletes, `storageEnv`) and SGS-101 (`BuildStore`, `buildStoreFromEnv`, `clientKey`, `takeSaveSlot` with `'contended'` giving 1 s, Playwright env left to this ticket). |
| 6 | Dependencies and size | Stated. About 180 lines of logic. |
| 7 | Diagrams | No trigger. |
| 8 | Lessons | None apply. |
| 9 | Decisions | CONTEXT.md Decisions empty; body agrees with design. |
| 10 | On merge | Names the CONTEXT.md Key surfaces addition and the two new lib files. |
| 11 | Risk | `standard` holds: no `strongModelTriggers` or critical path symbol changes behavior (simulate responses stay byte-identical). |
| 12 | Docs | `docs/aoe4-build-order.md`, `ARCHITECTURE.md` and OpenAPI are in Scope with a grep step. |
| 13 | Input validation | Pass: the nested save request goes through SGS-099's zod-backed check; `id` uses `isSavedBuildId`. |

## Notes (non-blocking)

- Scope item 9: "the same file's bounds table (`aoe4-simulate-api-contract.spec.ts`...)" follows a sentence about `fight-api-spec-surface.spec.ts`, so "same file" is ambiguous. The parenthesis names the right file; say "that contract spec's bounds table".
- The test title in `aoe4-gathered-resources.spec.ts` ("...at version 2.3.0") and in `aoe4-simulate-api-issue-shape.spec.ts` embeds the version. Update the title text along with the value (as the ticket already says for the surface spec title).
- The `ReplyTarget` structural fit with `NextApiResponse<T>` (`json(body: T)`) relies on method bivariance. `tsc --noEmit` is in the criteria and will catch it; if it fails, the fix is a cast-free generic on `sendReply`, not a looser type.
