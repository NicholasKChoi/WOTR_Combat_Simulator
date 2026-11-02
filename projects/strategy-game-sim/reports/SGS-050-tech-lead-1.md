# SGS-050 tech-lead 1

## Decision: no blockers, so I opened a draft PR

- **PR:** https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/58 (draft, base `main`, head `sgs-050-aoe4-build-spear-longbow-maa-crossbow`).
- **Branch:** tip 26e02d44a9ad010dd9f27e15c3f64d133d4fd20e, pushed to origin with no new commits.
- **Stacking:** a single PR, so there is no stack footer.
- **Body:** set with `gh api -X PATCH`. The title and body contain no ticket ids.

## Merge risk (verbatim from body)
**low** - additive data plus one list entry; a revert fully undoes it, no API, schema or rule data changes, no `criticalPaths` symbol is touched, and unit and acceptance tests pin the build's timings

## Review focus (verbatim from body)
No hotspots: the change is one new build data file and one `listBuilds` entry. The engine is unchanged, and the build's behavior is pinned by the shared prebuilt-build checks at 1200 s and 3600 s, the paste round-trip, the shape test, and an API acceptance spec.

## Required body content (acceptance criteria), all included in the PR body
- Gold `depletedAt` values: 1218.40, 1943.99 and 2669.58 s. `gold#4` does not run out by 3600 s, and nothing runs out by 1200 s.
- The file has 3 reactions.
- The man-at-arms trigger matters: the step arms and starts at 681 s, and Castle completes at 680.31 s. With the trigger deleted, men-at-arms start at 568.58 s.
- The source is hand-authored for this simulator.
- Every mutation check that was run and reverted, as reported by the implementer and review:
  - remove the `gold` reaction;
  - remove the `gold#3` reaction;
  - move man-at-arms before the King's Palace;
  - remove the King's Palace step;
  - put back the old order, with the transition steps after the 760 s rally;
  - delete the man-at-arms trigger, or change it to 600 s.

## Reviewed
- **Commit range:** b5c68d2 (origin/main, the merge base)..26e02d4, three commits. All are authored as choinickolas@gmail.com.
- **Files** (+346/-1 in total):
  - `data/aoe4-build-order/builds/english-spear-longbow-maa-crossbow.json`, +236;
  - `data/aoe4-build-order/README.md`, +16;
  - `lib/aoe4-build-order/builds.ts`, +2/-1;
  - `lib/aoe4-build-order/builds.test.ts`, +38;
  - `acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts`, +54.
- **Reviewable LoC:** +254/-1, excluding the tests.
- **Invariant check:**
  - A1 holds. The only fixed number added is the build order's own time trigger, which the ticket allows.
  - A2 holds. No step is waiting at either horizon (per the review and suite reports, and pinned by the bar tests).
  - A3 holds. The engine is unchanged.
  - S1-S3, W* and H* are not touched.
- **Other blocker categories:** none of these apply.
  - No irreversibility, no concurrency risk, no security surface and no contract break.
  - `builds.ts` is not a criticalPaths file.
  - CONTEXT.md has no open questions.
- **Merge risk:** low. A revert fully undoes the change, it touches no API, schema, CLI or config surface and no criticalPaths symbol, and tests pin the behavior.

## Non-blocking notes
- The acceptance spec hard-codes the step index 23 and the 681 s value. This is intentional pinning, but the spec, the shape test and the README all need editing whenever an earlier step is retuned.
- `README.md:70` is a long line (about 135 characters). Cosmetic only; review already noted it.
