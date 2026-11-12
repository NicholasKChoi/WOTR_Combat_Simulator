# Tech-lead gate (rerun): batch SGS-130, SGS-131, SGS-134, SGS-136, SGS-140

## Decision

PASS - five stacked draft PRs opened (#142 to #146). No blockers and no untested hotspots.

## Prior blocker: resolved

The first run blocked on `bumpCounter` counting a failed counter `put` as success when a read-back showed identical
JSON. At tip `1c854a6`, `lib/aoe4-build-order/blob-build-store.ts:89-98` makes no read-back: a 412 or a
create that lost goes to the next attempt with a fresh read, any other error rethrows, and after three attempts it gives
`contended`. A code comment states why. `landed` is used only by `create` (`:66`) and `replaceNamed` (`:118`).
Pinned by `blob-build-store.test.ts:351-365` ("starts a new attempt after %s even when the stored value is the JSON it
sent", for both a 412 update and an "already exists" create, asserting a second put at count+1 on the new etag),
`:366-373` (a network error rethrows after one put and one get), and `:375-385` (two parallel bumps through a fake
that honors ifMatch end at before+2 with distinct results). The acceptance test
`blob-lost-writes.acceptance.test.ts:233` lets only one of three parallel saves through with one slot left. The
ARCHITECTURE.md storage row now describes the no-read-back rule. The old test that pinned the bug
(`322-332` in the earlier tip) is replaced.

## PRs (bottom to top)

1. https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/142 - base `main` - head `sgs-130-blob-landed-write-retry-cap` @ 1c854a6

## Merge risk
**high** - it changes the concurrency outcome of storage writes on the public save routes, including the save-rate counter that is the only cap on Blob writes from those routes.

## Review focus
- [`lib/aoe4-build-order/blob-build-store.ts:89-98`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/142/files#diff-8983ebf0bbbd836e2f0138a9c6ca563aa1f654536775f0d33bd73e759486423dR89-R98) - if a failed counter `put` ever counts as landed, every one of N parallel saves from one client gets through while the counter rises by only one, so the client bypasses the 30-saves-per-hour limit - check that a 412 or a create that lost always goes to a fresh read and a new `put`, and that any other error rethrows - pinned by [`lib/aoe4-build-order/blob-build-store.test.ts`: "starts a new attempt after %s even when the stored value is the JSON it sent" and "gives two parallel bumps over %s different updates"](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/142/files#diff-6375c5c56e9e5cc963070a4329abb7ed759574425ad034b72088afc40a8d3ce4R351-R385), and by [`lib/aoe4-build-order/blob-lost-writes.acceptance.test.ts`: "lets only one of three parallel saves from one client through when one save is left in the window"](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/142/files#diff-9ea8ad94c8ad8f8a008227998d84e2c77428af1db2e38ce1896d99baadd4b549R233-R242)
- [`lib/aoe4-build-order/blob-build-store.ts:112-121`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/142/files#diff-8983ebf0bbbd836e2f0138a9c6ca563aa1f654536775f0d33bd73e759486423dR112-R121) - a wrong branch here either tells the user an edit that saved was a conflict, or answers `replaced` for an edit that never landed, which silently loses it - check that only an exact text match after a fresh read gives `replaced`, and that a read that throws, finds nothing, or gets a weak etag falls back to the old mapping - pinned by [`lib/aoe4-build-order/blob-build-store.test.ts`: "maps a put rejecting with %s and %s after one put and one fresh read" and "does not count the same data with a different %s as landed"](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/142/files#diff-6375c5c56e9e5cc963070a4329abb7ed759574425ad034b72088afc40a8d3ce4R232-R262)
- [`lib/aoe4-build-order/blob-build-store.ts:61-70`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/142/files#diff-8983ebf0bbbd836e2f0138a9c6ca563aa1f654536775f0d33bd73e759486423dR61-R70) - a new build or named build whose create landed but whose response was lost must report `created`, not `exists`, or the client is told its save failed - pinned by [`lib/aoe4-build-order/blob-build-store.test.ts`: "reports created when put fails but a fresh read shows the JSON it sent", "reports exists when put fails and the blob holds other content", "rethrows the put error when the blob is not there"](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/142/files#diff-6375c5c56e9e5cc963070a4329abb7ed759574425ad034b72088afc40a8d3ce4R98-R124)

   Owner action is in the body (Summary and the first Preview check): run `vercel env pull .env.local`, then
   `npm run test:blob-live` on this branch, and record the error class. This is not a blocker.

2. https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/143 - base `sgs-130-blob-landed-write-retry-cap` - head `sgs-131-my-builds-no-wipe-and-backup` @ 398f1cb

## Merge risk
**low** - client localStorage only, with no API, schema or engine change. A revert undoes it, and tests pin the backup-before-replace order.

## Review focus
- [`components/apps/aoe4-build-order/my-builds-storage.ts:84-98`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/143/files#diff-d995c15909787e0d4209e1b80925f3624b043df90a1a11968957be08d6a103eeR84-R98) - if the list is written before the backup lands, or after a backup write that failed, a save over an unreadable value wipes every stored edit secret for good - check that `setItem` of the list runs only after `backUpUnreadable` returned true - pinned by [`components/apps/aoe4-build-order/my-builds-storage.test.ts`: "backs up %s verbatim before writing the list" and "writes no list and keeps the original value when the backup write throws"](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/143/files#diff-8d5251304ce948f4d1b1ad98071f9bc03236019435e95ed8e32cf71990f81f8eR150-R177)

3. https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/144 - base `sgs-131-my-builds-no-wipe-and-backup` - head `sgs-134-chart-layout-model-key-results-collapse` @ b02eddd

## Merge risk
**low** - client-only UI and localStorage. The stored value only gains a `key-results` id in `collapsed`, which the previous reader drops as unknown, so a revert is safe, and tests pin the layout model and the collapse.

## Review focus
No hotspots: the layout functions are pure and table-tested in `chart-layout.test.ts`, the panel's collapsed and expanded rendering is unit-tested in `compare-panel.test.ts`, and a browser spec checks that the collapse survives a reload. A defect costs at most a reset panel layout.

4. https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/145 - base `sgs-134-chart-layout-model-key-results-collapse` - head `sgs-136-simulate-production-buildings-series` @ a771693

## Merge risk
**medium** - it adds a field to the public simulate response (additive and backward-compatible) and changes the `criticalPaths` symbol `simulateBuildOrder`, which now takes a read-only snapshot of the engine's building counts at each sample. A revert undoes it.

## Review focus
- [`lib/aoe4-build-order/simulate.ts:975-1023`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/145/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R975-R1023) - a snapshot taken outside the per-sample loop, or a live reference instead of a copy, would give counts that do not line up with `times` or that all show the final state - check that `new Map(engine.buildings)` is pushed once per sample beside `gatherers`, and that nothing in the loop writes to the engine - pinned by [`lib/aoe4-build-order/simulate-series.test.ts`: "leaves a barracks out while it is under construction and counts it from the sample at its completion" and "is the same for two runs and non-decreasing per series on the prebuilt build %s"](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/145/files#diff-025a9bdbecb157675c10f2869627300043b3f78c9625fd0a2369fe6064415cfbR280-R330)

5. https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/146 - base `sgs-136-simulate-production-buildings-series` - head `sgs-140-editor-compact-mode` @ cf023bb

## Merge risk
**low** - CSS plus one className and one test id. A revert undoes it, it touches no API, schema or engine symbol, and browser specs pin the widths.

## Review focus
No hotspots: the change is styling with no logic. The editor-width spec measures the text column, the hidden finished time and the unchanged step table at phone and desktop widths in real Chromium. A defect is visual and fully undone by a revert.

   Preview checks in the body: iOS focus zoom at the 15.75px compact font, and the ~1.3px margin at 1280.

## Stack check

Clean and linear. Each branch's diff against its intended base holds only its own task's files (`git diff --stat`
per pair). `git range-diff 5564bd0..72be9db origin/main..cf023bb` against the first-run stack shows only the two new
SGS-130 commits (`7634ea5`, `1c854a6`) and one doc context line in SGS-131 that changed on main. Every other
commit is identical, so the first run's per-task review of SGS-131, 134, 136 and 140 still holds.

## What I reviewed

- Combined range `origin/main` (0ba1970)...`sgs-140-editor-compact-mode` (cf023bb): 14 commits. Per-PR LoC (hand-written,
  excluding tests, docs and the OpenAPI JSON): 142 +29/-4, 143 +45/-16, 144 +116/-35, 145 +45/-1, 146 +39/-4.
- I read in full: the SGS-130 production diff (`blob-build-store.ts`, `build-store.ts`, `package.json`, the live test,
  the ARCHITECTURE.md row), the SGS-130 unit test diff, and the acceptance test names. Also the production diffs
  for SGS-134 and SGS-140, `my-builds-storage.ts:55-109`, `production-buildings.ts`, and the `simulateBuildOrder`
  sampling loop (`simulate.ts:966-1023`).
- Invariants checked: S1, S3, A1, A2, A3. No violation. PROJECT.md Open questions: none, so none was answered
  unilaterally.
- Branches were not on origin before this run. I pushed the given tips by explicit refspec and made no new commits.
  The PR bodies were set with `gh api PATCH`, since `gh pr edit` fails here.

## Non-blocking notes

- Commit `f5f4d8c` on the SGS-130 branch is titled "SGS-130: fix retry wording ..." and carries a ticket id. Edit
  the squash message at merge (not reworded, per the manager).
- `moveChartTo` / `moveTo` (`chart-layout.ts`, `use-chart-layout.ts`) has no caller in this stack. It is groundwork
  for the drag handle and becomes dead code if that ticket slips.
- `my-builds-storage.ts:77` keeps only the first backup. This is a documented, deliberate limit.
- A lost response to a counter write that landed now charges one extra count. This is deliberate (errs toward the
  limit) and pinned by the acceptance test "the save rate counter when its Blob write fails".
- `replaceNamed`'s comment (`blob-build-store.ts:110-111`) still says "unverified". Update it once the owner's
  live-test run records the error class.
