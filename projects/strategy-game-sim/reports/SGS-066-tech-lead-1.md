# SGS-066 tech-lead 1

## Decision
No blockers; draft PR opened.

- PR: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/78 (draft), base `main`, head `sgs-066-aoe4-workbench-tabs-editor` @ e941c81252e8ae0bab8a596716ff0d29ada71955.
- Branch pushed: it was not on origin before, and no PR existed. No new commits.
- Body set with `gh api -X PATCH`.
- Stacking: single PR, no footer.

## Merge risk (verbatim from the PR body)
**low** - A revert fully undoes it. It touches no API, schema, CLI, config or `criticalPaths` symbol (page and components only). New specs pin each changed behavior: tab selection on every Run outcome, the scroll offset at three widths, the sticky bar, line numbers, auto-size and the toggle. The diff is large because of spec edits, but size does not set the rating.

## Review focus (verbatim from the PR body)
No hotspots: the change is page layout and local UI state with no data, route or engine path. Every branch of the Run-to-tab mapping is pinned by a spec that fails when its `setTab` is removed (mutation-checked). The measured scroll offset is asserted at 1280, 768 and 390 px.

## Rating rationale
You asked for an honest rating. No medium or high factor applies under the rubric:
- A revert undoes everything.
- There is no public API, schema, CLI or config change, and no `criticalPaths` symbol is touched (all of those are in `lib/`).
- There is no concurrency, security or migration content.
- New specs pin the changed behaviors.

What looks big is the spec edit. Those are test-only clicks with no expected values changed, and size does not set the rating.

## Reviewed
- Range: `origin/main` 2607af1..e941c81 (5 commits, all authored as choinickolas@gmail.com, with no ticket ids or PR numbers in the messages).
- Files: 15 files, +598/-106 in total.
- Reviewable business logic is +203/-57 LoC across five files:
  - `pages/apps/aoe4-build-order.tsx`
  - `build-input.tsx`
  - `build-text-editor.tsx`
  - `workbench-tabs.tsx`
  - `text-lines.ts`
- Also read: the CSS module, the docs diff, every existing-spec edit, the helpers, and the rebase commit e941c81 on its own.

Checked:
- **Invariants.** S1: the new imports are only within the app plus `classnames`. S2: `Layout` and the landing link are untouched. S3: the Run path and duration are unchanged.
- **No `lib/`, route or OpenAPI change.**
- **No other importer of `BuildInput`.** Only the page imports it, so dropping the `text` and `issues` props breaks no consumer.
- **Docs.** They match the behavior.
- **Existing-spec edits.** No expected value changed. The one behavioral adaptation is noted below.

## Non-blocking notes
- **The step table remounts on view toggle.** By design, the two views are never mounted together, so a text-view round trip drops per-row UI state: an opened `step-more` section, or an in-progress invalid draft in a required number field. The step-table spec "number fields: ..." now reopens `step-more` because of this. This is a visible UX regression from the old always-mounted table. It is stated in the PR summary.
- **The view toggle is active on the Results tab.** It lives in the sticky bar, so clicking it on Results changes nothing visible until you return to Build. This matches the design.
- **Charts are mounted in a hidden panel.** `line-chart.tsx` uses recharts `ResponsiveContainer` with `onResize`, and that receives a 0 width while hidden. New spec 2 checks that the charts are still drawn after Build -> Results. A window resize while on Build was not checked.
- **The scroll offset is a direct DOM write.** `pages/apps/aoe4-build-order.tsx` (scroll effect) sets `panel.style.scrollMarginTop` directly. It is fine as written: the run bar ref keeps it from silently becoming 0.

## Existing tests edited (also listed in the PR body)
- aoe4-build-order.spec.ts: 4 tests (rule B).
- pin-compare: the `run` helper plus 2 tests (rule B).
- timeline-compare: the `runWith` helper (rule B).
- m3-flow: 3 tests (rules B and C).
- client-check: 3 tests plus `expectPostedChecked`.
- step-table: 17 tests (rule C), plus the `openWith`, `expectText` and `textValue` helpers.

Rebase commit e941c81 adapted the step-table tests that landed on main afterwards (start row, step-more/optional fields, icon-button naming) and made `showTab`/`showView` usage consistent. The PR body states this without ticket ids.

## Not run by me
I did not re-run the parity results the manager reported: tsc, lint:dup, 1283 unit, 649 acceptance, and the repeat-5 suites. Vercel status had not been checked at hand-off.
