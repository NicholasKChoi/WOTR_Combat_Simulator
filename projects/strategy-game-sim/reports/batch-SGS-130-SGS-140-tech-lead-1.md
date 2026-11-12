# Tech-lead gate: batch SGS-130, SGS-131, SGS-134, SGS-136, SGS-140

## Decision

NEEDS HUMAN REVIEW - no PRs opened. Nothing pushed.

## Blocker

- `lib/aoe4-build-order/blob-build-store.ts:93` - security (abuse control) / concurrency - `bumpCounter` now
  counts a failed counter `put` as success whenever a read-back shows the JSON it sent. The counter value is
  `{ windowStart, count }` (`nextCounter`, `build-store.ts:42-47`), which carries nothing that tells writers
  apart. When N save requests from one client run in parallel, they all read count `k` and all compute
  `{"windowStart":W,"count":k+1}`. One write wins. The others get a 412 (or "already exists" on the first
  create), `landed` reads back the winner's identical text, and they return the update as their own. All N
  saves are allowed, but the counter only goes up by one. Before this change, the 412 went to the next
  attempt (re-read, count `k+2`) or ended at `contended` (`takeSaveSlot` answers retry-after 1 s). So a client
  that sends bursts in parallel now gets far more than the 30 saves per hour in `SAVE_RATE_LIMIT`, and that
  limit is the only cap on Blob writes from the public save routes. The unit test
  `blob-build-store.test.ts:322-332` ("returns the update after one put for an update rejected with 412 when
  the read-back shows the JSON it sent") pins exactly this behavior.
  - Why a human must decide: the owner-approved design asks for it (`design/M9.md:526` and the Behavior
    rules row at `:521`, which says "a false `true` needs another writer to have stored byte-identical JSON,
    which is the same content"). That reasoning holds for named and saved builds, but not for a counter:
    there, identical content from two writers means one increment was lost. The ticket's Scope repeats the
    rule, so every gate checked it as correct.
  - Direction (pick one): (a) remove the `landed` check from `bumpCounter` only. A lost response to a write
    that landed then costs at most one extra count, which errs on the safe side, and `create` and
    `replaceNamed` keep it. Or (b) add a per-write random nonce to the stored counter JSON, so text equality
    really proves the write was ours. `nextCounter` ignores extra fields, but the memory and file stores
    share it, so check them too. Either way, update the 322-332 test, the `design/M9.md` rows 521 and 526,
    and the ARCHITECTURE.md storage row, which says `bumpCounter` "counts the write as done".

No other blockers. `create` and `replaceNamed` use the same `landed` check safely: saved-build ids are random,
and when two named-build writers store identical text, both got the content they wanted.

## Untested hotspots

None. The Review focus entries I would write each have a pinning test with real assertions:
- `blob-build-store.ts:111-121` (`replaceNamed` landed / conflict / rethrow), pinned by the
  `blob-build-store.test.ts` `replaceNamed` tables at 202 and 225, plus "puts once with overwrite and the
  caller etag as ifMatch" (190).
- `my-builds-storage.ts:84-98` (backup before replace, no replace when the backup write fails), pinned by
  `my-builds-storage.test.ts` 150 "backs up %s verbatim before writing the list", 160 and 168 "writes no list
  and keeps the original value when the backup write throws".
- `production-buildings.ts:22-31` (series set, naming, order), pinned by `production-buildings.test.ts`
  51-82.

## Per-PR assessment (for when the blocker is resolved)

Stack check: clean and linear. Each branch's diff against its intended base holds only its own task.
- SGS-130 (`sgs-130-blob-landed-write-retry-cap` @ 73693ef, base main): merge risk **high**. It changes
  storage write outcomes, and the landed check above alters concurrency semantics. Owner action to put in
  the PR body (not a blocker): run `vercel env pull .env.local`, then `npm run test:blob-live` on the branch,
  and paste the recorded error class for `ifMatch` on a missing key. The `replaceNamed` comment
  (`blob-build-store.ts:109-110`) still says "unverified" and is updated once that run exists.
- SGS-131 (@ c03940d, base sgs-130): **low**. Client localStorage only, a revert undoes it, and tests pin it.
- SGS-134 (@ a5e866c, base sgs-131): **low**. The `chart-layout` stored value gains a `key-results` id in
  `collapsed`. The old reader drops unknown ids, so a revert is safe.
- SGS-136 (@ bbaa171, base sgs-134): **medium**. It adds a required `productionBuildings` field to the
  `simulateBuildOrder` response (OpenAPI 2.6.0, additive) and touches the `criticalPaths` symbol
  `simulateBuildOrder` (`simulate.ts:975,997,1023`) as a read-only snapshot of `engine.buildings` per sample.
  Neither event order nor payment changes, so A2 and A3 are unaffected.
- SGS-140 (@ 72be9db, base sgs-136): **low**. CSS container query and one className.

## What I reviewed

- Combined range `origin/main` (5564bd0)...`sgs-140-editor-compact-mode` (72be9db): 40 files, +1646/-106,
  across 12 commits. The branches are not on origin yet, so I used local refs at the tips the manager gave.
- I read the hand-written logic in full: `blob-build-store.ts`, `blob-build-store.live.test.ts`,
  `package.json`, the ARCHITECTURE.md storage row, `my-builds-storage.ts`, `chart-layout.ts`,
  `use-chart-layout.ts`, `compare-panel.tsx`, `collapse-caret.tsx`, `results.tsx`, the page wiring,
  `production-buildings.ts`, `simulate.ts` hunks (`-W`), `model.ts`, the OpenAPI diff, `step-annotation.*`,
  `workbench.module.css`, and the doc hunks. I also read the bumpCounter and replaceNamed tests and listed
  the test names for my-builds and production buildings.
- Invariants checked: S1, S3, A1, A2, A3. No violation besides the blocker above, which is an abuse-control
  weakening, not an INVARIANTS.md rule. No open questions are answered unilaterally (PROJECT.md: none).

## Non-blocking notes

- Commit `fc011d5` on the SGS-130 branch is titled "SGS-130: fix retry wording ..." and carries a ticket id.
  A squash merge's default body lists commit titles, so reword it or edit the squash message.
- `moveChartTo` / `moveTo` (`chart-layout.ts:61`, `use-chart-layout.ts:32`) has no caller in this stack.
  It is groundwork for the drag handle ticket, so it is dead code if that ticket slips.
- SGS-140: the compact textarea font is 0.875rem x 18px = 15.75px, below 16px. iOS Safari zooms the page
  when a field under 16px gets focus, so tapping the build text at 390 px will likely zoom in. Worth one
  check on an iPhone preview, or a follow-up.
- `my-builds-storage.ts:77` keeps only the first backup. A second unreadable value after that is replaced
  without its own copy, as the docs say. Noted as a deliberate limit.
