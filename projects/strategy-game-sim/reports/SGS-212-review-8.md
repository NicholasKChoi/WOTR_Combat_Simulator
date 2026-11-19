# SGS-212 review (8)

Verdict: **REQUEST CHANGES**

- Branch `sgs-212-rename-ui-saved-builds`, tip `e5f987df51ee5a1f400a14a701fec7829cc0502d`, base `origin/main`. Full review as the manager asked, covering the whole branch (`git diff origin/main...HEAD`) and also checking that each Rework 1 Required fix landed (delta `125c2f4..e5f987d`).
- Scratch: `worktrees/review-sgs-212-rename-ui-saved-builds` (removed after this report).

## Blocking findings

1. `acceptance/aoe4-rename-build.spec.ts:356` - test (text) - The test is titled "choosing the build again shows the server name when the stored name is out of date". Its body never chooses the build in the select. It reloads with `page.goto(`${AOE4_PAGE}?n=${created.id}`)` (line 363), which is the opening path (`initialBuildQuery` and the `?n=` load), not `chooseEntry` (page line 269). So the name claims a check the assertions do not make. A break that affects only the choose path (`chooseEntry` at `pages/apps/aoe4-build-order.tsx:287-291`) leaves this test passing. The choose path is covered elsewhere, by `aoe4-my-builds.spec.ts:450` (`CHOSEN_NAME`), so only the title is wrong. Why it matters: criterion 10 distinguishes choosing from opening, and a reader of this spec would think the choose path is pinned here. Direction: replace the title, verbatim, with
   `'opening ?n= shows the server name when the stored name is out of date'`.
   Facts kept: the server name is shown, and the stored name is out of date. Fact dropped because it is the defect: "choosing the build again".

## Rework 1 Required fixes (each landed)

- `save-build.test.ts:67`: the row now passes `conversion: unconvertible`, and line 49 asserts `unconvertible.ok` is false. I checked it by mutation: with `conversion.ok &&` added to `canRename` (`save-build.tsx:113`), "when the text does not convert, Rename enabled is true" fails. I reverted the mutation.
- `aoe4-rename-build.spec.ts:81`: waits for `auto-run-status` `data-status="invalid"` before the submit checks.
- `aoe4-rename-build.spec.ts:264`: `renameButton` is asserted disabled while the PATCH is held. The implementer's report records that removing `!saving &&` fails it at line 264. I did not run acceptance specs.
- `save-build.tsx:276`: `aria-busy={busy ? 'true' : undefined}` is on Rename. The unit test is retitled "marks all three buttons busy while a saved build loads" and asserts `rename-build`. I checked it by mutation: removing the attribute fails that test. I reverted the mutation.
- The delta touches nothing else: one production line, plus the two test files.

## Spec gaps (NEEDS_SPEC)

None.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Rename shown/hidden; disabled while saving, loading, locked, or with no revision; not disabled by stale, unconvertible or edited; unit test over panel states | pass | `save-build.tsx:110-113`. Unit table `save-build.test.ts:60-77` covers shown, hidden, busy, no revision, unedited, stale and unconvertible (mutation-checked). Saving: acceptance line 264. Locked: acceptance line 309. |
| 2 | Form prefilled, focused and selected; one form at a time; another entry closes it; unchanged and invalid states; Enter; Escape/Cancel return focus | pass | `name-form.tsx`, `save-build.tsx:211-224, 314-338`, acceptance lines 101-207, `name-form.test.ts` |
| 3 | (respec 1) Submit `Save name`, found by role; submit enabled exactly when Rename is | pass | acceptance lines 28, 109-112. `canSubmit={canRename}` at `save-build.tsx:333`. Unconvertible: unit row (mutation-checked) and acceptance lines 80-86 with the invalid wait. Stale: lines 89-98. |
| 4 | (respec 1) Full row-order pins have Rename after Save a new version | pass | `aoe4-save-status.spec.ts:21,177-178,195`; `aoe4-split-tab-order.spec.ts:114,125`; `save-build.test.ts:111,122`. Rows without Save a new version keep their expected ids. |
| 5 | Successful rename: trimmed name, secret, revision; form closes; new name everywhere; `Renamed`; link; address unchanged; second rename uses the new revision | pass | `writeMine`/`submitRename`, `recordRenamed`; acceptance lines 211-233 (`if-match` `"1"` then `"2"`) |
| 6 | Reload `?n=<id>` shows the new name and runs | pass | acceptance lines 235-242 |
| 7 | Late answer renames list and storage with no link, status or error; edited stays edited; later Save a new version sends the renamed revision and name | pass | `writeMine` calls `remember` and `onRenamed` whether or not `current`. `send` aborts only on unmount, and `SaveBuild` is not keyed. Acceptance lines 244-276. |
| 8 | 412: conflict, both buttons disabled, name kept; other failures: message, name kept, Rename enabled | pass | `writeMine` `setLock`; acceptance lines 298-334 |
| 9 | Storage unwritable: rename applies and the notice shows | pass | `showSuccess` `!persisted`; acceptance lines 287-294 |
| 10 | Choosing or opening shows the server name; `withLoadedEntry` row; rewritten acceptance test | pass (code and coverage); see finding 1 for a misnamed test | `build-library.ts:103`; `build-library.test.ts:157-180`; `aoe4-my-builds.spec.ts:302-311` (opening) and `:450` (choosing). Choosing and opening both go through `showEntry` (page line 261). |
| 11 | Re-read keeps this tab's `loaded` and takes the re-read name | pass | page `withRereadMyBuilds` line 121; acceptance lines 338-354 |
| 12 | `withRenamedEntry` rows | pass | `build-library.test.ts` `describe('withRenamedEntry')` |
| 13 | Save as copy unchanged on the shared form; `validBuildName` bounds | pass | Ids, label, group name, prefill, `canSubmit={canSave}`, Escape and focus return all keep their old behavior. No existing save-copy spec assertion was edited. `name-form.test.ts:6-17`. |
| 14 | Row does not wrap at 1200/1280/1800 | pass | acceptance lines 369-396; UI inspection below |
| 15 | `lint:dup` and typecheck pass; no duplicated form; no stale doc sentences | pass | I ran `tsc --noEmit && npm run lint:dup`: clean, 0 clones. The UI doc `?n=` and save-button sentences are rewritten. |
| 16 | No INVARIANTS.md regressions | pass | see below |

## Invariants touched

- A1, A2, A3: hold. No simulation, data or game numbers change.
- S1: holds. `name-form.tsx` imports only `lib/aoe4-build-order/saved-builds`, which belongs to the same app.
- S2: not affected. No new page.
- S3: holds. The name is capped at 100 on the client, and the server keeps its cap and rate-limit slot.

## Contract checks

- C10, C11 and C12 match. The one exception is that `NameForm` has an optional `inputRef`, which C10 does not list (noted before; non-blocking).
- CONTEXT.md Key surfaces: no surface is renamed, and `withLoadedEntry` keeps its signature.
- Out of scope: nothing from the ticket's list is implemented. No `golang/` change, no pin rename, no revision comparison in `withRereadMyBuilds`.
- Existing tests edited: all follow the ticket's rule (a test of the changed behavior gets the new expected value). They are `aoe4-my-builds.spec.ts` (two server-name edits), `aoe4-save-status.spec.ts` (row order), `aoe4-split-tab-order.spec.ts` (row order in Tab order), `build-library.test.ts` (`mine` name rule) and `save-build.test.ts` (row order, props, and one assertion added by the rework).
- Doc claims: the docs did not change in the rework. I re-read the UI doc save section, the Tab-order sentence, the `?n=` sentence, the re-read sentence, the Escape focus sentence, `page-help.tsx`, the ARCHITECTURE row, and the `writeMine` and `withRereadMyBuilds` comments against the code at the tip. All hold.

## Lint, build and unit tests

- `npx tsc --noEmit && npm run lint:dup`: clean, 0 clones. No ESLint config exists.
- `npx next build`: passes.
- Unit tests for the three changed test files (`save-build`, `name-form`, `build-library`): 111 passed.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so this section was skipped. No bot findings.

## UI inspection

- I served the task checkout with `npx next dev -p 3877` and ran `inspect.cjs` from the scratch dir. The named-build POST and PATCH were stubbed with `page.route`, so nothing was written to the store. The build name was 50 characters.
- Widths 1200, 1280 and 1800, each in five states: after Save as copy (Rename and link shown), rename form open and unchanged, rename form with an empty name, rename in flight (PATCH held), and after rename.
- Clipped overflow in the save panel: none, in every state and width.
- Overlapping siblings in `save-row` and `rename-form`: none.
- Mid-word wraps: none.
- Document horizontal overflow: 0.
- Row ids, in order: save-build, rename-build, save-build-copy, save-status, saved-build-link, copy-saved-link.
- The row-top count came out as 2 because the status `<p>` is vertically centered with a different top. The screenshots show a single visual line, and the acceptance check that compares items against the copy button's band covers this.
- Rename enabled vs disabled (in flight): opacity 1 vs 0.5 at every width, so the states are visually distinct.
- The option reads the new name after the rename.
- Screenshots read: `1200-renamed.png`, `1200-form-invalid.png` (red border, range message, Save name disabled) and `1800-in-flight.png` (all three buttons dimmed). No visible defect.
- The server was stopped (`serve.sh stop 3877`: port free).

## Non-blocking notes

- `aoe4-rename-build.spec.ts:107-108` reads focus and selection once, without polling, right after `toBeVisible`. The focus effect runs after mount, so it could flake. Wrapping the reads in `expect.poll` would make it robust.
- The notes carried over from review 6 still apply:
  - `withMyBuilds` keeps the stored name when the read lands after a load. I found no reachable path for this today.
  - The UI doc's choose sentence (line 25) could mention the server name.
  - C10 does not list `inputRef`.
  - The first commit subject uses a `feat:` prefix.
  - The `writeMine` comment partly narrates the code.

## Coverage

- Production, read in full or as the full diff: `name-form.tsx`, `save-build.tsx` lines 55-340, `build-library.ts`, `build-input.tsx`, `pages/apps/aoe4-build-order.tsx` (re-read, choose and record paths), `page-help.tsx`.
- Docs: the `docs/aoe4-build-order-ui.md` diff and the `ARCHITECTURE.md` diff.
- Tests: `aoe4-rename-build.spec.ts` (whole file), the diffs of the three edited specs, `name-form.test.ts`, the `save-build.test.ts` diff, and the `build-library.test.ts` diff.
- Repo review checklist: I applied "Every diff" and "AoE4 build order". `next build` passes, and I loaded the page at 1200, 1280 and 1800 for each touched state. No helper is copied across modules (`validName` moved). No Bootstrap utilities are mixed with module CSS on the new elements. I skipped the 390 px check because this diff does not change the below-minimum rules.
- Not run: acceptance specs (this gate does not run them). I judged them by reading and from the implementer's record: 29 passed, plus the mutation list. The LSP tool was not available, so I traced callers by grep.
