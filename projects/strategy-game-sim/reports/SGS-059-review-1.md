# SGS-059 review 1

Verdict: **REQUEST CHANGES** (three small test-only fixes; production code, docs and contract are correct)

Scope reviewed: `git diff 7037d48..77b501b` (one commit stacked on SGS-075). Worktree detached at
77b501b. Note: `origin/sgs-059-aoe4-page-posts-build-order` does not exist; the commit is only on the local
branch `sgs-059-aoe4-page-posts-build-order`.

## Blocking findings

1. `acceptance/aoe4-build-order.spec.ts:324` - contract - the notes test ("warnings list warnings ... info
   expansion survives a failed run ...") was rewritten to `runRejected(page)` but does not assert the one
   `syntax` issue on line 2 containing `fly` or `simulation-error` count 0. Ticket Scope 5 and the design's
   "page specs / client rejection" row require every listed rewrite (including 304-307 on main) to assert
   that. The other five rewrites call `expectFlySyntaxIssue`. Direction: add `await expectFlySyntaxIssue(page)`
   after `runRejected(page)`.
2. `acceptance/aoe4-build-order-pin-compare.spec.ts:187` - test - title "a 400 run removes charts and table
   but keeps the pin; ..." now runs a client rejection that `runRejected` asserts sends no POST at all.
   The title claims a 400 that cannot happen. A reader will assume a server 400 + pin case is covered, and it
   is not. Direction: rename it, for example "a rejected paste removes charts and table but keeps the pin;
   the next valid run restores both".
3. `acceptance/aoe4-build-order.spec.ts:676` - test - same problem: "a 400 run and a start-only run show no
   timeline" now has no 400. Direction: rename it, for example "a rejected paste and a start-only run show
   no timeline".

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Valid paste posts `buildOrder` = `buildOrderFrom(text)`, no `text`, with inputs; charts draw | pass | spec.ts:88-95 (rally, `not.toHaveProperty('text')`); step-table.spec.ts:215 (post-edit textarea). Page builds the body as `{ buildOrder: converted.order, inputs: { durationSeconds } }` (page:75) |
| 2 | Unparseable paste: no POST, one syntax issue, line 2, `fly`, simulation-error 0 | pass (fails only in the notes test, finding 1) | `runRejected` + `expectFlySyntaxIssue` in spec.ts:106, 142, 338, 676, pin-compare:187 |
| 3 | `knigt` gives one unknown-id issue at its line, no POST | pass | new test spec.ts:121 (`data-line="2"`, `unknown-id`, `knigt`, simulation-error 0) |
| 4 | After success, a rejection clears charts/notes/warnings/timeline/compare, keeps the pin, Run stays enabled; next valid run hides issues and redraws | pass | pin-compare:187, spec.ts:142/294/338/676; spec.ts:106 asserts `build-order-issues` count 0 after the valid run. Mutations below confirm the Run-enabled and clear-result parts are covered |
| 5 | 20001 chars gives one `out-of-range` issue with the exact text, no POST | pass | new test spec.ts:133 (`toHaveText` on a strict locator also implies count 1) |
| 6 | Duration, mocked 400 (with/without omitted) and mocked 500 tests unchanged, assert simulation-error; server 400 never in build-order-issues | pass | those tests are untouched by the diff and pass. Server 400 only reaches `setIssues` (page:82-85), never `setClientIssues`. No test asserts `build-order-issues` count 0 on a mocked 400 (note N1) |
| 7 | `git grep -n "options" -- pages/apps/aoe4-build-order.tsx` and the step-table prop grep print nothing | pass | both empty (run myself) |
| 8 | `git grep -nE "postData(JSON)?\(\)[^;]*\.text" -- acceptance` prints nothing | pass | empty |
| 9 | `toBe(400)` count is 2 and 0 | pass | `aoe4-build-order.spec.ts:2`, pin-compare has no hits |
| 10 | Mutation: post anyway / issues into simulation-error makes the `runRejected` specs fail | pass | reproduced; see Mutations. All 8 `runRejected` tests fail under each mutation, not 4 |
| 11 | Docs no longer say Run posts the text | pass | `git grep -nE "Run posts the$\|posts the text\|posts the paste" -- docs` empty; README.md has no AoE4 text |
| 12 | tsc, lint:dup, npm test, acceptance pass (Node 24) | pass | Node v24.22.2: tsc clean; jscpd 0 clones; vitest 41 files, 1221 passed / 8 skipped; `next build` ok; Playwright 605/605 on ACCEPTANCE_PORT=3845 |
| 13 | No invariant regressions | pass | below |

Criteria not ticked (REQUEST CHANGES).

## Mutations (run myself, each reverted)

- **Issues into simulation-error** (`setIssues(converted.issues.map(m => m.message))` in place of
  `setClientIssues`): 8 failed, every `runRejected` test: spec.ts:106, 121, 133, 142, 294, 338, 676 and
  pin-compare:187, all on `build-order-issues` `toBeVisible`. The implementer's "4" is an undercount; the
  coverage is better than reported.
- **POST anyway** (rejection branch also fires a `fetch` with `{ text, inputs }`): the same 8 failed, on
  `expect(posted).toEqual([])`.
- **Run left disabled after a rejection** (`setRunning(true)` in the rejection branch instead of
  `setResult(null)`, which also drops the clear): 5 failed. spec.ts:106 timed out on the next Run, which shows
  Run-enabled is covered. spec.ts:142, 294, 676 and pin-compare:187 failed on result elements still being
  shown, which shows the clear-result part is covered.

## Invariants touched

- S3: holds. The browser enforces the 20000-character cap through `textToBuildOrder` (`SIM_INPUT_BOUNDS`).
  The route still checks `buildOrder` and `inputs`. The duration is still unchecked in the browser and
  bounded by the route.
- S1: holds. New imports come only from `lib/aoe4-build-order/` and `components/apps/aoe4-build-order/`.
- S2: unchanged.
- A1-A3: not touched. There is no engine change. `catalog` comes from `loadGameData('english')` in
  `getStaticProps`.

## Contract checks

- C8 `PageProps { builds, catalog }`, `StepTable` prop `catalog`, `IssueList({ issues: readonly
  BuildOrderIssue[] })` returns null on empty, `role="alert"`, `data-testid` ids, and `data-line` is left
  out when `line` is undefined (React drops undefined attributes). All match.
- Run steps 1-7: page:65-95. Both issue lists are cleared first. A rejection sets client issues, calls
  `setResult(null)`, never touches `running` or `pinned`, and returns before any fetch. `setRunning(true)`
  now runs only on the POST path. The 400, HTTP and network paths are unchanged and still go only to
  `simulation-error`.
- `runRejected` matches the C8 helper contract. `api.ts`, `docs/api/openapi.json`, `schema.ts` and
  `text-to-build.ts` are not touched, which matches the ticket's Out of scope.
- No invented constants. No `golang/`.

## SGS-060 conflict risk

Low. SGS-060 (`sgs-060-aoe4-api-specs-send-build-order`, same base 7037d48) touches only
`acceptance/aoe4-simulate-api*.spec.ts` and does not edit `acceptance/helpers.ts`. Its ticket also says
helpers.ts is not edited. `git merge-tree --write-tree 77b501b sgs-060-...` merges cleanly. The two branches
share no files.

## Bot reconciliation

`reviewBot.cli` is empty, so no bot ran. `rulesFile` is also empty.

## Non-blocking notes

- N1: no test asserts `build-order-issues` count 0 on a mocked server 400. It holds by construction today
  (page:84), and the M4.8 live-issues ticket will be the one at risk. Consider adding
  `expect(page.getByTestId('build-order-issues')).toHaveCount(0)` to the mocked-400 test.
- N2: `runRejected` (helpers.ts:95) adds a `page.on('request')` listener and never removes it. It is
  harmless at one call per test, but `page.off` after the check would keep it from spanning later runs.
  This follows the existing pattern at aoe4-step-table.spec.ts:193.
- N3: `expectFlySyntaxIssue` lives in helpers.ts but depends on `INVALID_PASTE`, which is defined separately
  in three spec files. Moving `INVALID_PASTE` into helpers.ts beside it would keep the two together.
- N4: the docs sentence "Server 400 issues and network or HTTP failures show in the error list as before"
  (docs/aoe4-build-order.md:812): "as before" is process history in a shipped doc. Drop it. Line 826
  ("... Run reports it as an issue under the textarea. Number fields") runs past the paragraph's wrap width.
- N5: the import order in aoe4-build-order.spec.ts:9 (`expectFlySyntaxIssue, buildOrderFrom, ...`) is not
  alphabetical, unlike the line it replaced.

## Coverage

Reviewed every changed file: the page, issue-list.tsx, build-input.tsx, step-table.tsx, acceptance/helpers.ts,
the three specs, and docs/aoe4-build-order.md. Compared against message-lists.tsx (list component shape),
compare-panel.tsx and results.tsx (signatures), and aoe4-step-table.spec.ts:193 (request recording).
Checked the REPO.md review checklist "Every diff": `next build` passes, and the page was loaded by the
605-test Playwright run. AoE4 section: no copied helper or constant, and the docs Page section matches the
code. No chart changes, so there was no 1280px check. Nothing was left unreviewed. No processes are left
running.
