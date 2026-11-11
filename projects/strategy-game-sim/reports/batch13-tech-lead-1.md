# Batch 13 tech-lead gate (SGS-125)

**Decision: PASS - draft PR opened.**

## Opened PRs (bottom to top)

- SGS-125: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/137 , base `main`, head `sgs-125-save-panel` at 731699de99344cf10c24a660dc9c53cc2a6dcf61 (draft). Branch pushed by this gate; no new commits. Body set via REST PATCH (`gh pr edit` is broken here). Single-PR batch, so the body has no stack footer.

### Merge risk (verbatim from body)

**high** - security-relevant code: the page now issues bearer edit secrets, stores them in `localStorage`, and sends them as `Authorization` headers.

### Review focus (verbatim from body)

- [`components/apps/aoe4-build-order/save-build.tsx:149-187`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/137/files#diff-afdd22920794122933cbc29694a577feeb1ffe0b485e212ead3944f600901d2d) - if `remember` is skipped on a path (a late answer, unavailable storage), the edit secret for a build that now exists on the server is lost. If the conflict lock is not recorded on a late 412, a stale tab could try to overwrite. Check that every `ok` outcome stores the secret before calling back, and that `setLock` runs whether or not the input is current. Pinned by [`acceptance/aoe4-my-builds.spec.ts`: a second tab that saved first makes the update fail with the conflict and locks Save a new version](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/137/files#diff-5d1fa33a7100396c1bca5efd0ca7d2a66226976f03eb8f08fe91235399d1642eR943-R968), [`a late 412 shows no message and leaves Save a new version locked`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/137/files#diff-5d1fa33a7100396c1bca5efd0ca7d2a66226976f03eb8f08fe91235399d1642eR1139-R1155) and [`a copy still saves, warns, and can be versioned in this page`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/137/files#diff-5d1fa33a7100396c1bca5efd0ca7d2a66226976f03eb8f08fe91235399d1642eR1035-R1052)
- [`pages/apps/aoe4-build-order.tsx:300-315`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/137/files#diff-aea44dd8df67afd590f57f83436ad63a0375df14a7656d7660754745f759188bR300-R315) - if `recordCreated` selects and flushes after the user kept typing, it replaces their text with the saved one. If `recordUpdated` leaves `loaded` at the old revision, the next version save gets a 412. Check the `sameInput` guard against `settledRef` and the revision written into `loaded`. Pinned by [`acceptance/aoe4-my-builds.spec.ts`: a create released after a settled edit is stored and listed but selects nothing](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/137/files#diff-5d1fa33a7100396c1bca5efd0ca7d2a66226976f03eb8f08fe91235399d1642eR1094-R1107) and [`a new version released after a settled edit keeps the text and stores revision 2`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/137/files#diff-5d1fa33a7100396c1bca5efd0ca7d2a66226976f03eb8f08fe91235399d1642eR1117-R1138)
- [`pages/apps/aoe4-build-order.tsx:113-119`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/137/files#diff-aea44dd8df67afd590f57f83436ad63a0375df14a7656d7660754745f759188bR113-R119) and [`212-223`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/137/files#diff-aea44dd8df67afd590f57f83436ad63a0375df14a7656d7660754745f759188bR212-R223) - when another tab writes the list, the re-read could replace this tab's selected entry and drop its edited state, or drop a secret this tab could not persist. Check that the selected entry is kept and that secrets merge rather than replace. Pinned by [`acceptance/aoe4-my-builds.spec.ts`: a copy saved in one tab appears under My builds in another without changing its selection](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/137/files#diff-5d1fa33a7100396c1bca5efd0ca7d2a66226976f03eb8f08fe91235399d1642eR969-R983)

## Blocker checks (all clear)

- **Invariants.** A3: a save never calls the simulate route. The flush after a create reruns the same text and duration, as the design requires. S3: unchanged, because the routes enforce the caps. S1: imports stay inside the aoe4 app plus `lib/`. W*, H*, and A1/A2 are not touched.
- **Correctness.** Late-answer handling is consistent: `send` compares against `settledNow`, and `recordCreated` compares against `settledRef`, both set in effects. `sendJson` never throws, so `saving` cannot get stuck. `saveVersion` returns early on a null revision without a cast.
- **Irreversibility.** None. No schema or route change. The `saveBuild` route, OpenAPI, and old `?b=` links stay, and a revert restores the snapshot Save.
- **Concurrency.** The cross-tab `storage` listener is new, but it is designed and pinned. A 412 from If-Match prevents lost updates.
- **Security.**
  - The edit secret appears only in `localStorage`, React state, and the `Authorization` header. The spec asserts it is absent from the URL, `page.content()`, and console messages (spec:886-917).
  - No secret values are committed.
  - No new unauthenticated write path: create was already unauthenticated by design, and update requires the bearer secret.
- **Open questions.** CONTEXT.md lists none, and the ticket answers none on its own authority.
- **Contract break.** The `SaveBuild` and `BuildInput` props change, but both are internal and every call site is updated. The public API does not change.
- **Blast radius.** It matches the commit messages. No `criticalPaths` symbol is touched.

## Untested hotspots

None. Each Review focus entry has a pinning acceptance test, and acceptance-test 1 mutation-checked them. These breaks were each caught by a failing assertion:
- dropping `setLock`: spec:955 and spec:1151
- dropping the `recordCreated` `sameInput` guard: spec:1060 and spec:1100
- writing a stale revision in `recordUpdated`: spec:910
- blanking `recordUpdated` `loaded.text`: spec:1131
- removing the `storage` listener: spec:978
- changing the unstored-warning target: spec:1060

## What I reviewed

- Range `origin/main` 4489f09 ... `sgs-125-save-panel` 731699d, 3 commits (be351ae, ac5b1e6, 731699d). The branch was local-only and was pushed by this gate.
- 15 files, +1307/-688 in total.
- Reviewable hand-written logic is +307/-75:
  - `save-build.tsx` +224/-36
  - `pages/apps/aoe4-build-order.tsx` +61/-8
  - `build-input.tsx` +17/-4
  - `build-library.ts` +5/-1
  - `save-build-client.ts` -13
  - `pin-name.ts` -13
- I read every production hunk and `build-fetch.ts` (`sendJson` error handling). I cross-checked the acceptance-test mutation table and the secret-leak assertions.
- Gate reports read: SGS-125-review-2, SGS-125-acceptance-test-1, batch13-suite-1, batch13-simplify.

## Non-blocking notes

- If the page unmounts after the server committed a create but before the response arrives, the request is aborted and the issued secret is never stored. The build then exists server-side with no editor. The design accepts this ("a result of an aborted or unmounted request changes nothing"). Worth a BACKLOG line if orphaned builds matter.
- `recordCreated` puts the new entry at the front of the whole entry list, not the front of the My builds group. Display grouping hides this as long as the select groups by kind.
- `save-build.tsx` repeats `focus()` + `select()` for the name input and the link input. This is a tiny duplication, and simplify left it alone.
- `gh pr create` printed "11 uncommitted changes". These are from the state-branch checkout (the factory's own files), not from the PR branch.
