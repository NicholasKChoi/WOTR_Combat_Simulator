# Tech-lead: batch SGS-113, SGS-117, SGS-119 (run 1)

## Decision

PASS. No blockers and no untested hotspots. I pushed three branches and opened three stacked draft PRs (footer stacking, marker `cf-stack`). I made no new commits.

## Opened PRs (bottom to top)

### SGS-113: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/123 (base `main`, head 41357ec)

## Merge risk
**low** - UI-only change to legend items and line hiding; no API, schema, config or critical-path code; a revert fully undoes it and unit plus acceptance tests pin the new legend.

## Review focus
No hotspots: the change only regroups legend items and maps a pinned line's key back to its series key for hiding; `legendItems` and `isLineHidden` are pinned by table tests in `chart-rows.test.ts` and the rendered key by `line-chart.test.ts`.

### SGS-117: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/124 (base `sgs-113-chart-legend`, head 89b5d32)

## Merge risk
**low** - tests, a test helper, test-runner config and a behaviour-preserving extraction of the auto-run initial state; no public surface or critical-path symbol; a revert fully undoes it.

## Review focus
No hotspots: the only production edit replaces `firstPaintState` with `initialAutoRunState`, which builds the same fields from the same `settledFields`; the type checker covers the shape and the auto-run tests exercise it.

### SGS-119: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/125 (base `sgs-117-unit-test-debt`, head 3524d12)

## Merge risk
**high** - security-relevant code: edit-secret generation, hashing, constant-time comparison and `Authorization` parsing that later routes rely on to gate edits.

## Review focus
- [`lib/aoe4-build-order/named-builds.ts:37-42`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/125/files#diff-943d154aefea0af54959eb58ceca9eed3c58d0d685dfe70fb6a5634e46816270R37-R42) - a comparison that exits early, ignores the length check, or checks only some characters would let a wrong or truncated secret pass the edit check, or leak the hash by timing - check the length guard and that every character is XOR-folded - pinned by [`named-builds.test.ts`: sameSecretHash table](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/125/files#diff-c6302ed1c7e0c89a373f338be9dba0e524af899af2d26114111fd170ca3f8f16R97-R109)
- [`lib/aoe4-build-order/named-builds.ts:73-84`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/125/files#diff-943d154aefea0af54959eb58ceca9eed3c58d0d685dfe70fb6a5634e46816270R73-R84) - a looser parser would accept a malformed bearer token or a weak or out-of-range ETag, so a write could skip the secret format check or the revision precondition - check exact `Bearer ` prefix plus full-pattern secret, and the strong-ETag, no-leading-zero, safe-integer bounds - pinned by [`named-builds.test.ts`: parseEditSecret and parseIfMatchRevision tables](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/125/files#diff-c6302ed1c7e0c89a373f338be9dba0e524af899af2d26114111fd170ca3f8f16R111-R144)
- [`lib/aoe4-build-order/saved-builds.ts:36-44`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/125/files#diff-50a49070e32cf266a0cf7ea96a8356cf9eaeb26b93cbf07d38ff6e5355010de5R36-R44) - any change in the shared encoder changes every content-addressed saved-build id, so existing `?b=` links stop resolving - check the `+`, `/` and `=` replacements are unchanged - pinned by [`named-builds.test.ts`: editSecretHash matches node's base64url SHA-256, and the all-0xff id](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/125/files#diff-c6302ed1c7e0c89a373f338be9dba0e524af899af2d26114111fd170ca3f8f16R34-R95)

## What I reviewed

- Commit range `b3da879..3524d12` (origin/main..sgs-119-named-build-shapes), 4 commits, 20 files, +473/-110 in total.
- The stack is linear. Each branch's diff against its base holds only its own task: 113 has 7 files (+150/-56), 117 has 10 files (+39/-52), 119 has 3 files (+280/-2).
- Reviewable hand-written LoC: 113 is +39/-17, 117 is +9/-31, 119 is +90/-2. These exclude unit tests, the acceptance spec, test helpers, vitest config and docs.
- Read INVARIANTS.md, CONTEXT.md open questions (none), the M8 design C1 contract (MILESTONES has no M8 Safety and contracts section), and the SGS-119 ticket.
- The batch is not all-low because SGS-119 is standard, so I read every task in full.
- Hotspot pinning check. I computed the base64 of SHA-256("hunter2") independently: `9S+9MrKzuG/4jvbEkGKChfSCrxXdyylUH5S89Saj9sc=`. It contains `+`, `/` and `=`, so the editSecretHash oracle test pins all three replacements in `base64UrlEncode`.
- No criticalPaths symbol is touched. A3 holds: randomness exists only in the default argument of the id and secret makers, and no simulation calls them. No `node:` import or `Buffer` appears in `named-builds.ts`.

## Non-blocking notes

- SGS-117 `lib/aoe4-build-order/simulate-house-gate.test.ts:61`: the old assertion `population(off, hold) == population(off, 595)` claimed production was blocked between `hold` and 595. The new assertion `population(on, 595) > population(off, 595)` only shows that auto-houses help, so the "blocks production" claim in the test name is now pinned more weakly. The test gate already accepted this.
- SGS-119 `named-builds.ts:29-31`: the default random source for `newEditSecret` is not exercised on its own. It shares `cryptoRandomBytes` with `newNamedBuildId`, which the distinct-ids test does exercise.
- The base64url regex for `secretHash` is written inline (`named-builds.ts:48`) instead of reusing `EDIT_SECRET_PATTERN`. It is the same pattern, so this is cosmetic.
- REPO.md notes: `gh pr edit` fails here. I set the bodies with `gh api -X PATCH .../pulls/<n> -F body=@file`. `gh pr create` printed an "11 uncommitted changes" warning, which comes from the state checkout and is harmless.
