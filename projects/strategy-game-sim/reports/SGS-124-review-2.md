# SGS-124 review 2 (delta, after Rework 1)

Branch `sgs-124-page-library` at df9912a (feature commit d27707d + rework commit df9912a), on origin/main 156bf30.
Compared against review 1's tip 36cab45 on a440406.

**Verdict: APPROVE**

## Blocking findings

None.

## Rework 1 required fixes

| Fix | Landed | Evidence |
| --- | --- | --- |
| Dialog handler before the select in `aoe4-step-annotations.spec.ts` "choosing another build in the select scrolls the text back to the left" | yes | `acceptance/aoe4-step-annotations.spec.ts:179`, `page.once('dialog', (dialog) => dialog.accept())`, placed directly before the `selectOption` |
| Dialog handler before the `OTHER_BUILD` select in `aoe4-build-order-m4-flow.spec.ts` | yes | `acceptance/aoe4-build-order-m4-flow.spec.ts:76`. The following `KNIGHT_LONGBOW` select needs no handler: template entries carry `duration: null` (`build-library.ts:43`), so `isEdited` (`build-library.ts:92-96`) ignores the 1800 duration set earlier, and the text is the `OTHER_BUILD` template |
| docs: "No run selects a tab (one exception: opening a `?n=` or `?b=` link, see below)" | verbatim | `docs/aoe4-build-order.md:852` |
| docs: "except that after opening a `?n=` or `?b=` link, Results is selected ..." | verbatim | `docs/aoe4-build-order.md:856` |
| docs: "with a `?n=` or `?b=` link the opened build runs instead, once its load ends (the default build runs if the load fails)" | verbatim | `docs/aoe4-build-order.md:873` |
| docs: "while no save and no build load is in flight" | verbatim | `docs/aoe4-build-order.md:1035` |

The rework commit df9912a touches only these 3 files and 6 lines. It changes nothing else.

## Rebase and conflict resolution against #133

Method:
- `git range-diff a440406..36cab45 156bf30..d27707d`.
- A context-free diff of the two feature diffs: `git diff -U0 a440406 36cab45` against `git diff -U0 156bf30 df9912a`, with index and hunk lines stripped.

The only differences between the two feature diffs are:
1. The `BuildInput` destructuring line now ends in `runBarRef` on both its `-` and `+` sides. This carries main's prop through, and the feature's change to the line is the same.
2. The two rework spec lines and the four rework doc sentences.

Every other added or removed line in all 16 files is byte-identical to the 36cab45 diff. Nothing beyond the conflict resolution and the Rework 1 fixes was changed.

Main's side (#133) is kept in full. Checked in `git diff 156bf30 df9912a` and in the tree:
- `build-input.tsx`:
  - `runBarRef` stays in `BuildInputProps`, in the destructuring and as `ref={runBarRef}` on the form.
  - The feature replaces `builds` with `entries` and adds `edited` and `data-edited`, as it did before.
- `pages/apps/aoe4-build-order.tsx`:
  - `useRunBarHeight` is imported, and `runBarRef` and `useRunBarHeight(runBarRef)` are kept.
  - `runBarRef={runBarRef}` is passed to `BuildInput`.
  - The editor keeps `labelledBy="build-order-heading"` next to the feature's `disabled={busy}`.
  - The `build-order-heading` h2 is untouched.
  - The page diff against main has no render hunk beyond the feature's own changes.
- `docs/aoe4-build-order.md`, Page paragraph:
  - Main's new sentences are kept as context lines and are not edited: "In the side-by-side layout the page only scrolls above the columns...", the two-columns and headings sentence, and "does not scroll vertically itself (...)".
  - The feature's only edit there is the "(labelled Build, see below)" select parenthetical.
- `build-text-editor.tsx`, `workbench-tabs.tsx`, `workbench.module.css`, `use-run-bar-height.ts`: main's changes are untouched by the branch.

The feature's side is also kept in full. The page drops main's render-time `initialB` write and `savedLoadInFlight`, as the ticket's Scope requires. A grep for `-w initialB`, `urlBaseline`, `PrebuiltBuild`, `pinName`, `buildName` and `savedLoadInFlight` in `pages` and `components` finds nothing. Nothing in `pages` or `components` still uses the old "Prebuilt build" label. The one remaining match is the docs data-files sentence, which is correct.

#132 (route replies) changes only server and route files plus API specs. `loadJson` and `savedBuildSchema`, which the branch's loaders use, are unchanged in shape, and `tsc` is clean.

The newly inherited `acceptance/aoe4-split-scroll.spec.ts` fills the text but never selects a build, reloads or navigates after an edit, so it needs no dialog handler.

## Acceptance criteria (re-check of rework 1 items)

| Criterion | Verdict | Evidence |
| --- | --- | --- |
| Existing tests keep passing with dialog handlers added where a select follows an edit | pass (by reading) | Both sites fixed. Review 1's sweep of the other specs still holds, because the only spec main added that touches the page (split-scroll) has no select after an edit. The implementer reports 160 acceptance tests passing across 8 specs |
| Docs updated, and no sentence made untrue | pass | The four sentences are fixed. Each matches the code: the `setAwaitingLoadTab(true)` ok branch covers both `named` and `link`, `hold: initialQuery === null \|\| initialLoadInFlight`, and `busy = initialLoadInFlight \|\| choosing` |
| `tsc --noEmit`, `lint:dup`, `npm test` | pass | Re-run on df9912a: tsc clean, jscpd found 0 clones, and vitest passed 71 files with 2209 passed and 13 skipped |

The other criteria are unchanged from review 1.

## Invariants

- A3 (the saved payload carries only the build order and duration): holds. The rebase does not change the save path.
- A1, A2, S1-S3: not touched.

## Lint

- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones.

## Bot reconciliation

`reviewBot.cli` is empty and not required, and no `rulesFile` is configured, so no bot ran.

## UI inspection

The rebase combines this branch's select with #133's run-bar-height and split-scroll layout, so the inspection was run once.

Setup:
- Served the task worktree at df9912a with `npx next dev -p 3487`, then stopped it.
- Script: `inspect.cjs` in the reviewer scratch dir.
- Loaded `/apps/aoe4-build-order` at 360x760, 768x760 and 1280x760.
- States: default; text edited; a stubbed `?b=` link with a 70-character name and the duration edited (label `<name> (<id>) (edited)`).

Results:
- `--aoe4-run-bar-height` matched the measured bar height plus its margin in every state: 266 px at 360, 205 px at 768, and 112 px at 1280. With the long link label at 1280, Duration wraps, and the variable followed it to 205 px, so the columns shrank to fit (648 px down to 555 px).
- Clipped overflow: only the split columns, which scroll by design, and the textarea's sideways scroll, which is documented. Nothing else.
- No overlap among run-bar children, no mid-word wraps, and no horizontal document scroll.
- Optgroups were `Templates`, or `Opened links` + `Templates`. `data-edited` flips to `true` and the option text gains ` (edited)`.
- The textarea keeps `aria-labelledby="build-order-heading"`.
- A `beforeunload` dialog fired on navigation from an edited page.
- Screenshots read: `link-edited-1280`, `link-edited-360` and `edited-768`. None shows a visible defect.

## Non-blocking notes

Review 1's notes stand and are not repeated here. No new notes.

## Coverage

- Rework commit df9912a, read in full.
- Rebased feature commit d27707d, compared line by line with 36cab45 through range-diff and the diff of diffs.
- `git diff 156bf30 df9912a` for `build-input.tsx` and `pages/apps/aoe4-build-order.tsx`, read in full.
- The main changes between a440406 and 156bf30 that touch the page, the run bar, the docs and the specs.
- `use-run-bar-height.ts`, `build-library.ts` (`isEdited`, `templateEntries`) and `aoe4-split-scroll.spec.ts`.
- REPO.md checklist: the AoE4 section was applied to the rebased UI. `next build` was not run; the implementer did not run it in this pass either, so the Vercel preview check is the build signal.
- Not run, by gate rules: acceptance, browser and e2e tests.
