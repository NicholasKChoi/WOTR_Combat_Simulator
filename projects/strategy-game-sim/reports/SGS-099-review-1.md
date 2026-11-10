# SGS-099 review 1

Verdict: **REQUEST CHANGES**
Reviewed: eb3212ea03f44ca8191859c016680692ec628e41 against origin/main 1e6d6c2 (full review, first pass), in a detached review worktree (removed after).

## Blocking findings

1. `lib/aoe4-build-order/saved-builds.test.ts:187-193` - test - `caps the issues and counts the rest` asserts only `expect(error.omittedIssues).toBeGreaterThan(0)`. The name says "counts the rest" and the acceptance criterion says "`omittedIssues` is the remainder", but the test never checks the remainder. I confirmed it: changing `saved-builds.ts:66` to `{ omittedIssues: omittedIssues + 1 }` leaves all 51 tests passing. An off-by-one in the count would ship. Direction: assert the exact remainder. Get the uncapped total from the same input, for example `const all = checkBuildOrder(withOrder({ steps }).buildOrder, catalog)`, narrowed to `ok: false`, then `expect(error.omittedIssues).toBe(all.issues.length - MAX_REPORTED_ISSUES)`. Or pin the literal count if one issue per step is guaranteed. Keep the `issues` length and `error === issues[0].message` checks.

## Spec gaps

None.

## Implementer's question: the `sortedKeys` compare (saved-builds.ts:81-86)

Keep it. No test is required.
- The ticket and the design (M6.md C3, part 2) say "compare by value, ignoring key order". If it were deleted, the code would compare raw `JSON.stringify` output, which is key-order sensitive, and the spec would have to change.
- Today it is a no-op. Both sides are zod output from `orderSchema` (`checkBuildOrder` inside `textToBuildOrder`, and `checkBuildOrder` on the body), so key order always agrees. This is the same kind of unreachability as the guard branch itself, which the ticket keeps on purpose.
- `node:util`'s `isDeepStrictEqual` is not browser-safe, and the repo has no deep-equal helper to reuse (grep found none), so a local helper is the cheapest way to meet the spec.
- No test claims to cover it, so the "test must be able to fail" rule is not violated. Pinning it would need a second `vi.mock`, of `./text-to-build`, returning steps with keys in reversed order. That would be an optional addition, not required.

## Acceptance criteria

| criterion | result | evidence |
|---|---|---|
| Exports each C1 name with the stated signatures; import grep empty | pass | `saved-builds.ts:10-113` matches C1 names and types. `git grep -nE "from '(node:|react|next)"` is empty. The transitive imports (schema, parse-text, text-to-build, model) are already loaded by the page bundle. |
| `savedBuildId` table, determinism, key order, change sensitivity | pass | test:48-77. The id hashes `JSON.stringify(record)`. My probe found that for every shipped build, `savedBuildSchema.parse(JSON.parse(json))` re-stringifies to the same `json` and gives the same id. So a saved record read back gives its own id. |
| `isSavedBuildId` table | pass | test:81-96. The table covers every listed case, including the `\n` anchor case. |
| `storageEnv` table | pass | test:100-110 |
| Key tables | pass | test:114-118 |
| `checkSaveBuildRequest` rows (non-object, knigt, duration x5, name 100/101, 413 by bytes via `source`, 60/3600 ok) | pass | test:122-167. The 413 row builds a 30,000 x `€` source, compares bytes and characters, and asserts the exact body. |
| Issue order and cap | **fail** | Order sub-cases pass (test:172-185). Cap: `omittedIssues` is not checked as the remainder (finding 1). |
| Round trip: listBuilds loop, 20001 mock, walkSeconds 2.5, part-2 guard via `vi.mock` both ways | pass | test:197-219. The guard test fails if the compare is dropped and fails if it always fires. |
| `api.ts` exports `BuildsError` and the three types; header updated; tsc and lint:dup pass | pass | The diff matches. tsc is clean, and jscpd found 0 clones. |
| No INVARIANTS.md regressions | pass | See below. |

Ticket criteria left unticked, since the verdict is not APPROVE.

## Invariants touched

- A1 (game numbers from data): holds. The duration bounds come from `outOfRange`/`SIM_INPUT_BOUNDS`. The new literals are storage caps from the design (65,536 bytes, 100 characters), not game numbers.
- A2, A3: not touched. Nothing in the simulation path changes. `crypto.subtle` runs only on the save path.
- S3 (bounded): holds. The record has a byte cap, the name a length cap, and the issues are capped at `MAX_REPORTED_ISSUES`. The 413 check runs before the round trip, so oversized input is never reformatted or re-parsed.
- S1: holds. All imports are inside `lib/aoe4-build-order/`.

## Contract and scope checks

- Names match C1 exactly. `SaveCheck` is a private alias with the exact union from C1.
- Check order matches steps 1 to 8:
  - The object check comes first.
  - The order, duration and name issues are collected in that order, and the name is checked only on a valid order (`saved-builds.ts:97-103`).
  - The record is built in schema key order (`version`, `buildOrder`, `durationSeconds`), then the 413 byte check uses `TextEncoder`, then the round trip runs.
- `badRequest` is never called with an empty array: line 103 returns only when `found.length > 0`, or when `!checked.ok`, in which case zod issues are non-empty.
- No runtime cycle. `api.ts` uses `export type` only, which is erased, and `saved-builds.ts` imports the `MAX_REPORTED_ISSUES` value one way.
- Out of scope: there are no stores, routes, OpenAPI, page or blob changes. The private `isPlainObject` and `notAnObjectError` copies are sanctioned by the ticket.
- No invented constants.

## Linter

`npx tsc --noEmit && npm run lint:dup`: pass, 0 clones. There is no ESLint config in the repo.

## Review bot

`reviewBot.cli` and `rulesFile` are empty, so there was nothing to run or reconcile.

## Conventions

- The source style (2-space indent, semicolons, one-line header comment) matches `lib/aoe4-build-order/builds.ts:1` and `text-to-build.ts`.
- The test style (4-space indent, no semicolons, `it.each` tables, `ENGLISH` from `test-helpers.ts`, `listBuilds()`) matches `text-to-build.test.ts:1-5` and `schema.test.ts`.
- `badRequest` (saved-builds.ts:63-67) repeats the 3-line cap block at `pages/api/aoe4-build-order/simulate.ts:54-56`. The ticket asks for "the same shape as the simulate route", the copy is under the jscpd threshold, and the source is outside `lib/`. Non-blocking; see notes.

## Non-blocking notes

- `api.ts:1`: the header now says the saved-builds types are covered by "docs/api/openapi.json is the contract". That holds once the OpenAPI ticket lands, but openapi.json does not document the builds API yet. Acceptable because the OpenAPI spec is explicitly out of scope here.
- The cap logic in `saved-builds.ts:63-67` and `simulate.ts:54-56` is now in two places. When SGS-103 rewrites `simulate.ts`, it could extract a shared `issuesError(all)` into `api.ts` or `api-route.ts`. Worth a BACKLOG line if SGS-103 does not.
- `test:128` and `test:170` declare the same `knigt` step literal twice. It could be hoisted to one const at the top of the `checkSaveBuildRequest` describe.
- The knigt row (test:127-132) asserts status, issue count, code and step, but not `error`. Not needed for correctness, since the cap test pins `error === issues[0].message`.

## Coverage

- Files reviewed: `lib/aoe4-build-order/saved-builds.ts`, `lib/aoe4-build-order/saved-builds.test.ts`, `lib/aoe4-build-order/api.ts`.
- Siblings read: `schema.ts` (`outOfRange`, `checkBuildOrder`, `buildOrderShape`), `text-to-build.ts`, `pages/api/aoe4-build-order/simulate.ts`, `builds.ts`, and the `text-to-build.test.ts` and `schema.test.ts` headers.
- Ran:
  - lint: pass.
  - `npm test`: 49 files, 1562 passed, 10 skipped.
  - `npx next build`: pass.
  - Saved-builds tests plus a temporary probe (read-back id stability, unknown keys stripped, null duration, missing buildOrder): all pass. The probe was deleted.
  - One mutation: survived (finding 1).
- REPO.md checklist:
  - "Every diff": the build passes. No page is touched, so no page was loaded.
  - "AoE4 build order": no helper copied from another `lib/aoe4-build-order/` module, no engine rule change, no UI change.
