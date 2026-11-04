# SGS-085 review 1

Branch `sgs-085-aoe4-text-editor-issue-ux`, tip `cd0493a` (local; not on origin, so I reviewed the local ref), base `main` `fad1e41`. Full-branch review (not delta). Reviewed in a detached worktree at `worktrees/review-sgs-085-aoe4-text-editor-issue-ux`, which I removed afterwards.

**Verdict: REQUEST CHANGES** (one blocking naming finding; behaviour, docs and tests otherwise match the contract)

## Blocking findings

1. `lib/aoe4-build-order/schema.ts:534,617` (with `:532`, `lib/aoe4-build-order/text-to-build.ts:25`, `lib/aoe4-build-order/schema.test.ts:248`) - checklist(Naming) / convention - The new exported `checkBuildOrder` option is called `fieldRulesOnly`, but with it set the check still runs each step's cross-field rules (`stepSchema`'s `crossFieldProblems` superRefine, schema.ts:443-445). Only `withCrossChecks` is skipped, which holds the `start` rules and the cross-step rules. The design doc's tier vocabulary (`docs/aoe4-build-order.md:645-649`) names "Field checks" and "a step's cross-field rules" as separate tiers, so the name says the option does less than it does. The ticket (Scope 4) asks for a name that states what the option does. The text-to-build test `keeps a per-step cross-field issue on a parse failure` depends on cross-field rules running under this flag. A later caller who takes the name at its word, wanting field checks only, would get cross-field issues. - Direction: rename the option for what it skips, for example `skipWholeOrderRules` (the `start` and cross-step rules need every line), or for what it keeps (field and per-step rules). Rename `fieldSchemasByCatalog` to match, and retitle the schema.test.ts case `skips the start and cross-step rules when asked for the field rules only` to the new name. No behaviour change.

## Spec gaps

None.

## Acceptance criteria

The verdict is REQUEST CHANGES, so I ticked nothing in the ticket.

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Gutter font-weight 700 and a colour unlike a non-error line, acceptance case in inline-issues spec | Behaviour passes; **criterion unmet** (no acceptance case) | Probe at 360/768/1280: line 2 and line 3 `700 rgb(220, 53, 69)`, line 1 `400 rgb(108, 117, 125)`. No case added to `aoe4-build-order-inline-issues.spec.ts`; the implementer left it to the acceptance-test gate. |
| 2 | Paste messages `line 2: unknown unit "knigt"` (suggestion knight), `unknown building "hous"`, `unknown node "wod"` | pass | Probe: all three exact. Only `knigt` is pinned in a unit test (text-to-build.test.ts:23). |
| 3 | JSON messages keep ` in unit` / ` in producer`; route 400 unchanged | pass | schema.test.ts:110,202,227 unchanged; `acceptance/aoe4-simulate-api-quoted-ids.spec.ts:25` passes. Mutating the `where.line === undefined` guard fails 3 tests. |
| 4 | `li` text `... "knigt". Did you mean knight?`; span text; no `.` without a suggestion; `. ` after a message ending in `)` | pass | issue-list.test.ts:21-33; browser li text confirmed at all three widths. |
| 5 | knigt + `build hous` gives two issues in line order; 4-issue row ordered 2,3,4,5; no check issue has `step` | pass | text-to-build.test.ts:59-69 (first row `toStrictEqual`, so no `step`). Removing `withoutStep` fails 2 tests. |
| 6 | 201-step cap issue first, then the `fly` syntax issue (line 203) | pass | text-to-build.test.ts:71-77. Mutating `?? 0` to sort line-less issues last fails it. |
| 7 | A failed `start` line or a repeated research shows only syntax issues | pass | text-to-build.test.ts:79-86. Running the full check on `partial` fails both rows. |
| 8 | A per-step cross-field issue on a parse failure has `line` and no `step` | pass | text-to-build.test.ts:88-92 (`toStrictEqual`). |
| 9 | `partial` holds only the parsed lines, with shifted indexes | pass | parse-text.test.ts:658-666 (line 2 fails, `steps: [3]`). |
| 10 | Browser: two live issues and both gutter marks without a Run; fixing line 3 hides line 2 until a Run | partly verified, no acceptance case | Probe: two issues and both marks with no Run. I did not check the hide-after-fix half in the browser. The code path (`converted.lines !== undefined && !checked`) is unchanged. |
| 11 | Run summary 1 / 2 issues, nothing POSTed, absent before and after a converting Run, count tracks edits | Behaviour passes; **criterion unmet** (no acceptance case) | Probe: `Fix 2 issues ...` after `runRejected` (nothing POSTed). An edit leaving one issue gives `Fix 1 issue ...`. Absent before the first Run and after a converting Run. No case added to client-check or inline-issues. |
| 12 | Docs: live rule, `Did you mean <id>?`, Node references, Issues paragraph, `t2b` node, summary; both greps empty | pass | docs/aoe4-build-order.md:525, 601-602, 665, 846-855; `git grep "did you mean <id>"` and `git grep 'checkBuildOrder with lines"\]'` both return nothing. |
| 13 | tsc, lint:dup, npm test, npm run acceptance pass; `acceptance/aoe4-build-order.spec.ts` untouched | pass | tsc clean; jscpd 0 clones; vitest 1471 passed / 10 skipped; Playwright 725 passed; that spec has no diff. |
| 14 | No INVARIANTS regressions | pass | See below. |

## Invariants touched

- A1, A2, A3: the diff touches `lib/aoe4-build-order/` checking and display only, not the simulation path. No literals, spending or nondeterminism added. All three hold.
- S1: issue-list imports only its own app's lib. Holds. S2: no new page. S3: no new input or loop. The merge sorts at most the existing capped issue lists. Holds.

## Test edits against Scope 6

- `acceptance/aoe4-build-order-from.spec.ts:16` drops the paste-sourced ` in unit` (rule 1).
- `acceptance/aoe4-build-order-inline-issues.spec.ts:71` and `acceptance/aoe4-build-order-m4-flow.spec.ts:57` change the suggestion text to `Did you mean knight?` (rule 1).
- `lib/aoe4-build-order/schema.test.ts:243` is a paste-sourced message (lines given), so ` in producer` is dropped (rule 1).
- `lib/aoe4-build-order/text-to-build.test.ts:23` is the paste-sourced knigt row (rule 1).
- The `returns a parse failure unchanged` test became `returns the syntax issues without lines when every other line is valid`. Rule 2 names that test shape. The failing text has no check issues, so the expected issues are unchanged; only `partial` is excluded.
- No JSON-sourced expectation was edited, and `acceptance/aoe4-build-order.spec.ts` was not touched.

All edits are within the rules.

## Linter

`npx tsc --noEmit`: clean. `npm run lint:dup`: 0 clones. There is no ESLint config in the repo (REPO.md).

## Review bot

`reviewBot.cli` and `rulesFile` are empty, so there was nothing to reconcile.

## Conventions

- `issue-list.test.ts` renders with `renderToStaticMarkup` and reads the output with regexes, like `line-chart.test.ts:1-32`. The summary cases are an `it.each` table, like `workbench-tabs.test.ts:5`.
- The CSS descendant rule `.gutter li[data-error='true']` matches `.runField select` (workbench.module.css:~80). It sits on the module-styled `ol`, with no Bootstrap utility on the same element.
- The summary `<p>` uses the same ternary-or-null render as the suggestion span in the same file.

## Non-blocking notes

- issue-list.tsx:12: the plural reads `Fix ${issues.length === 1 ? '1 issue' : `${issues.length} issues`} ...`. The sibling `message-lists.tsx:35` uses `${n} info ${n === 1 ? 'message' : 'messages'}`. Same output; `Fix ${n} ${n === 1 ? 'issue' : 'issues'} ...` would match it.
- text-to-build.test.ts:68: the 4-issue row checks only line numbers. Its line-4 `unknown node "wod"` (a nodeAt rule) is not checked for a missing `step`. `withoutStep` applies to every issue alike, so this is low risk.
- Unit tests pin only `knigt` for criterion 2. `hous` and `wod` were confirmed only by my probe. One more row in the existing `it.each` at text-to-build.test.ts:20 would pin them.
- Once a Run is rejected, the summary returns if the text breaks again after it had been fixed without a Run. This matches Scope 5 ("stays while `rejection` is set").
- `knownResource` (schema.ts:330) still hard-codes ` in trigger.resource`. The ticket's Scope 2 names only knownId and nodeAt, and paste rejects a bad resource word in the parser. Out of scope.

## Coverage

- **Files read in full or in their changed regions:** every file in the diff. Also `build-text-editor.tsx`, `message-lists.tsx`, `line-chart.test.ts`, `workbench-tabs.test.ts`, the run handler and rejection effect in `pages/apps/aoe4-build-order.tsx`, `parse-text.ts` `parseBuildOrderText`, and schema.ts 100-135 and 240-630.
- **Doc sentences checked against the code:** docs/aoe4-build-order.md:51, 525, 596-602, 645-656, 665, 845-855.
- **Commands run:**
  - `npx tsc --noEmit`, `npm run lint:dup`, `npm test`, full `npm run acceptance` (725 passed), `npx next build` (ok).
  - Mutation checks: full check on `partial`; line-less issues sorted last; `withoutStep` removed; the field-suffix guard removed. Each made tests fail, and every mutation was reverted.
  - A temporary Playwright probe at 360x760, 768 and 1280. I looked at the screenshots: gutter marks visible, summary a plain sentence, no horizontal overflow (scrollWidth - clientWidth = 0). The probe and screenshots were deleted.
- **REPO.md checklist:** "Every diff" and "AoE4 build order" sections applied. No shared code is touched.
- **Not reviewed:** the implementer's Doc claims list. The implementer report is a stub, so I checked every doc sentence the diff adds or edits directly.
