# SGS-067 review 1

Branch sgs-067-aoe4-inline-issues-suggestions, reviewed tip 7db4db5fc2a5a840a509a06f3ebdbe84dfd5c161 (local only, not on origin), base origin/main 12639c45aae0210beb9c0ac5037a1cbf138a3200.

**Verdict: REQUEST CHANGES** (one blocking test finding; the production code is correct against the ticket and design C8 / M4.8 rules)

## Blocking findings

1. `acceptance/aoe4-build-order-inline-issues.spec.ts:106-112` - test - "a rejected Run whose issue has no line scrolls to the list" cannot fail on the scroll it names. A 20001-character single line makes an 8-row textarea, so `build-order-issues` is already in the viewport before Run. Verified: with `target.scrollIntoView(...)` commented out in the page, this test still passes, while the line-62 test, the table-view test and my probe fail. Why it matters: a test whose name claims a check its assertions do not make is always blocking, and the no-line branch of the scroll rule (`item ?? issuesBox.current`) is left unguarded. Direction (feasible, verified): use a multi-line text over the cap so the list starts far below the fold, wait for the live length issue, jump to the top without smooth scrolling, assert the list is below the viewport, then `runRejected` and poll that its top is at or below the run bar and inside the viewport. This probe passed 5/5 on the branch and failed with the scroll removed:
   ```ts
   await textarea(page).fill(Array.from({ length: 201 }, () => 'x'.repeat(99)).join('\n'))  // 20099 chars, issue has no line
   await expect(page.getByTestId('build-order-issues')).toBeVisible()
   await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
   // assert list top > innerHeight here (it was 5920 at 1280x720), then:
   await runRejected(page)
   await expectInViewBelowRunBar(page, 'build-order-issues')
   ```
   It is worth starting the line-62 and table-view tests from `scrollTo(0)` too, so their starting position is explicit rather than wherever `fill` left the page.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | live parse issue, gutter line 2 marked, line 1 not; valid text clears | pass | spec :38; mutation `errorLines={[]}` fails it |
| 2 | check issue hidden before first Run; after `runRejected` unknown-id at line 2, `did you mean knight?`, gutter mark, no simulation-error; edit hides, edit back shows | pass | spec :52; mutation "no suggestion" fails it |
| 3 | no suggestion element without `suggestion` | pass | spec :43 |
| 4 | line 62 in viewport below run bar; no-line rejection leaves list in viewport | **fail (test)** | line-62 part passes and fails without scroll; the no-line part passes without any scroll (blocking 1) |
| 5 | edit never removes shown charts | pass | spec :127; page has no `setResult(null)` on text change |
| 6 | first Run of any outcome sets `checked` (valid 200 Run) | pass | `setChecked(true)` is the first statement of `runSimulation`; mutation "checked only on rejection" fails spec :76 |
| 7 | table view rejection scrolls the list, keeps table view | pass | spec :114 fails without scroll; `view === 'text'` guard plus `editorBox` unmounted in table view |
| 8 | `errorLines` sets `data-error="true"` on exactly the listed items | pass | `build-text-editor.tsx:24`; spec :87 counts exactly 2 marks |
| 9 | mocked server 400 stays in simulation-error, no `data-error` | pass | spec :137 (mock with `line: 2`) |
| 10 | `issueLines` unit rows; one-argument grep empty | pass | `text-lines.test.ts` 4 rows; grep empty; 1287 unit tests pass |
| 11 | `errorLines={[]}` grep empty; pages grep one line with `issueLines(...)`; editor grep finds prop and use | pass, with a literal deviation | the page line is `errorLines={issueLines(clientIssues)}`, not `issueLines(issues)`: `issues` is already the page's server-error state (`string[]`), so the name `clientIssues` is needed. Intent met |
| 12 | suggestion test id count 1 in issue-list; grep finds specs | pass | `git grep -c` prints 1; spec :43, :63 |
| 13 | gold run-out info list coverage | pass | spec :156 passes against unchanged `Results` code (no gap, no Results change) |
| 14 | mutations | pass | I re-ran `errorLines={[]}` (4 specs fail), checked only on rejection (spec :76 fails), suggestion removed (spec :52 fails); implementer reports the editor-ignores-errorLines and check-before-Run ones |
| 15 | docs describe live issues, suggestions, gutter, scroll; grep empty | pass | `docs/aoe4-build-order.md:820-827`; grep for `last client rejection|issues of the last|under the textarea` in docs and READMEs is empty |
| 16 | tsc, lint:dup, npm test, acceptance pass (Node 24) | pass | tsc clean, jscpd 0 clones, 1287 unit passed, `next build` clean, full acceptance 659 passed on port 4051 |
| 17 | no invariant regressions | pass | see below |

Criteria are not ticked (verdict is not APPROVE).

## Invariants touched

- S1 holds: new imports are `components/apps/aoe4-build-order/text-lines` and `lib/aoe4-build-order/model` only.
- S3 holds: the 20000-character cap stays in `textToBuildOrder` (`text-to-build.ts:12`), which the page memo calls on every edit; no network request on edit (the only `fetch` is in `runSimulation`).
- A1-A3: no simulation code touched.

## Checks the manager asked for

- `issueLines(issues)`: one argument, `Set` then numeric sort; sorted, unique, line-less skipped.
- `checked`: set at the start of every Run click, before the branch on `converted.ok`, so rejection, 200, 400 and failed fetch all set it; never reset (only `useState(false)` on mount).
- Parse/length issues live (`converted.lines === undefined` shows regardless of `checked`); check issues only after `checked`.
- No `setResult(null)` on text change; spec :127 confirms charts remain.
- Server 400s: `clientIssues` derives only from `converted`; a 400 writes `issues` (server list) only. No gutter mark (spec :137).
- Scroll effect: keyed on `rejection`, a new `{ first }` object per rejected Run, so a second rejection with the same text and Build already open still scrolls. It runs after the commit that sets `tab` to Build, so the panel has layout; offset is the measured run-bar height, block `center`; falls back to the list when the issue has no line or the view is table.
- Scoped `querySelector` (`pages/apps/aoe4-build-order.tsx:92`): **acceptable, need not change.** The SGS-066 objection was to an unscoped, structure-dependent lookup (`closest('section')?.querySelector('form')`) for something a ref could reach directly. Here the query is scoped to a ref'd wrapper and matches `data-line`, which C8 makes a public contract of the gutter. A per-item ref would need a new forwarding prop or imperative API on `BuildTextEditor`, and the ticket puts editor internals beyond `errorLines`, `data-error` and `scroll-margin-top` out of scope. Optional: tighten the selector to `[data-testid="build-order-line-number"][data-line="N"]`.
- Inline `scrollMarginTop` instead of a CSS rule: acceptable. It matches the existing results-panel effect (`pages/apps/aoe4-build-order.tsx:82`), and the run bar's height changes with width, so a fixed CSS value could fall short at narrow widths.
- New spec file instead of appending: acceptable. It follows the per-feature sibling files (`aoe4-build-order-client-check.spec.ts`, `aoe4-build-order-pin-compare.spec.ts`), and the main spec is already about 900 lines.
- Edited existing tests, both justified:
  - `aoe4-build-order.spec.ts:834` `first()` to `last()`: `a\nb\n` now has a live parse issue on line 1, so line 1 correctly carries `data-error`. The check still asserts the attribute is absent on a non-issue line (line 3).
  - `aoe4-build-order.spec.ts:136` `toHaveText` to `toContainText`: required by ticket item 2 and the "Rule for existing tests" (item text is now message plus optional suggestion). The length issue has no suggestion, so the weaker matcher loses nothing in practice.

## Mutations (mine)

| Mutation | Result |
|----------|--------|
| `scrollIntoView` removed | line-62 spec, table-view spec and both probes fail; **the no-line spec passes** (blocking 1) |
| `setRejection(converted.issues[0])`, keyed on the raw issue (memoized, so it is the same object on a repeat Run with unchanged text) | **all 10 branch specs pass**; only my probe "second rejection with Build already open scrolls again" fails. The code is correct today, but nothing guards the per-Run keying (note 1) |
| margin removed and `block: 'start'` | all branch specs pass, because line 62 is the last line and the page cannot scroll it to the top. A probe with the error on line 81 of 151 fails under the mutation and passes on the branch (note 2) |

## Bot reconciliation

`reviewBot.cli` is empty and `rulesFile` is empty, so no bot ran.

## Non-blocking notes

1. Add a repeat-rejection spec (reject, `scrollTo(0)` instantly, reject again with the same text, line back in view). Without it, the simpler-looking `setRejection(converted.issues[0])` would silently break scroll on every repeat Run. This is cheap to add in the same rework.
2. The line-62 spec cannot detect a lost run-bar offset, because the target is at the page bottom. A mid-text error (for example line 81 of 151) from `scrollTo(0)` does detect it. Optional, since the ticket fixed the 62-line layout.
3. `inline-issues.spec.ts:31` picks the bottom-edge check by sniffing `sel.includes('data-line')`. An explicit parameter would read better.
4. `parsed` (`parseBuildOrderText`) and `converted` (`textToBuildOrder`, which parses again) both run per keystroke on up to 20000 characters. This is fine today and could be one parse later.
5. The page effect reads `view` but lists only `[rejection]` in its dependencies. That is intended (scroll only on a new rejection) and correct, since `view` is current in that render.

## Coverage and runs

- Files reviewed: every file in `git diff origin/main...HEAD` (8 files), plus the page's surrounding Run path, `acceptance/helpers.ts` (`runRejected`, `expectFlySyntaxIssue`), `lib/aoe4-build-order/text-to-build.ts` (length issue shape), and docs Page section.
- REPO.md checklist: Every diff (next build run; page flows exercised through Playwright on `next dev`, including Run reject/200/400, table view, tab switch). AoE4 section: no helper copied between `lib/aoe4-build-order` modules; docs sentence matches code; no chart change.
- Stress: the new spec `--repeat-each=10` (100 runs), in parallel with `aoe4-build-order.spec.ts` (53 tests) against one shared `next dev` via a throwaway `reuseExistingServer: true` config: 100/100 and 53/53 passed.
- Full suite: 659 passed (port 4051, Node 24.22.2).
- Probe specs are saved at /tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/d25428ed-0c81-4238-ac7f-4830d6e9a031/scratchpad/zz-review-probe.spec.ts and /tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/d25428ed-0c81-4238-ac7f-4830d6e9a031/scratchpad/zz-review-probe2.spec.ts.
- REVIEW.md: none at the repo root. No project LESSONS entries.
- Servers stopped; port 4051 free.
