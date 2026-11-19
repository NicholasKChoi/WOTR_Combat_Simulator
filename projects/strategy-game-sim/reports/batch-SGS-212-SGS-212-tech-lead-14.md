# Tech-lead gate: batch SGS-212-SGS-212

## Decision

PASS. No blockers and no untested hotspots. Opened the stacked draft.

## Opened and updated PRs (bottom to top)

- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/220 - base `main` - new - head 9a9a464f0ad915c4f6fb9bc5b85ad30df34e538c (SGS-212, branch `sgs-212-rename-ui-saved-builds`)

### Merge risk
**low** - client-only UI change on an already-merged API; no API, schema, CLI or config change, no `criticalPaths` symbol, a revert fully undoes it, and unit and acceptance tests pin the new behavior.

### Review focus
- [`pages/apps/aoe4-build-order.tsx:314-317`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/220/files#diff-aea44dd8df67afd590f57f83436ad63a0375df14a7656d7660754745f759188bR314-R317) and [`components/apps/aoe4-build-order/build-library.ts:107-110`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/220/files#diff-f0728285f8da72a304aa0629280e80f6e4d6d7d344e7ac0f8f128eb0a5a025de) - if the renamed entry does not advance its loaded revision to the one the rename returned, the next rename or Save a new version sends the old revision and gets a 412, locking the user out of saving that build until they reload it - check that the revision from the response, not the sent one, reaches the entry - pinned by [`acceptance/aoe4-rename-build.spec.ts`: sends the trimmed name with the secret and revision, then shows it everywhere, twice in a row](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/220/files#diff-7368bdafaa437cc7dfb168bfa6f6fcb7ef995be1b99ef74484e94de09e99b891R239-R260) and [`components/apps/aoe4-build-order/build-library.test.ts`: withRenamedEntry](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/220/files#diff-5309d44cc47b6347b835812370774245073facfd0824a498d4ec2dab6b1ff129R201-R233)

## What I reviewed

- Range `453b7054737f0e2298e18077800c9d5e06745ed0...9a9a464` (merge-base with origin/main to the tip), 4 commits (125c2f4, e5f987d, 582806d, 9a9a464).
- 15 files, +862/-123 in total; reviewable production code +200/-88: `save-build.tsx`, `name-form.tsx` (new), `build-library.ts`, `pages/apps/aoe4-build-order.tsx`, `build-input.tsx`, `page-help.tsx`. Also read the test and doc changes (`aoe4-rename-build.spec.ts`, `build-library.test.ts`, `save-build.test.ts`, `name-form.test.ts`, three edited acceptance specs, `docs/aoe4-build-order-ui.md`, `ARCHITECTURE.md`).
- Checks: invariants A1-A3 and S3 (not touched: no simulation, data or input-cap change); irreversibility (none: client-only, no schema or storage format change; a rename writes through the already-integrated PATCH route); concurrency (the double-submit guard `abort.current !== null` and the `saving` flag cover the rename the same way they cover the existing saves; abort happens only on unmount); security (the edit secret goes only in the existing Authorization header, nothing logged); contract (the `SaveBuild` and `BuildInput` props gain a required `onRenamed`, with the single page consumer updated); open questions (none open; the re-read name rule follows the recorded owner decision Q146).
- Stack check: a single member on `main`; its diff holds only SGS-212 work. No existing PR before this run.
- Issue line: the ticket's Source names no `GitHub issue #<n>`, so no Fixes/Refs line.

## Non-blocking notes

- The ticket listed `workbench.module.css` for the row width; the branch has no CSS change, and the layout acceptance test (row items share one line at 1200, 1280 and 1800 px) passed in the suite, so none was needed.
- `withRereadMyBuilds` stays page-local and is covered only through acceptance (`a tab that has this build selected takes the name another tab stored and keeps its own text`), which the ticket allows.
- A rename whose request is in flight when the page unmounts is aborted on the client but may still apply on the server; the same holds for the existing saves, and the next load shows the server name (D17), so nothing is lost.
