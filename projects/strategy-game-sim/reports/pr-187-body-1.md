## Summary
Removes the exported `NAMED_BUILD_VERSION` constant and its doc comment from the named-builds module. Nothing in the repo reads it, and the stored and public named-build shapes carry no version field, so it versioned nothing. No behavior changes. Non-goal: adding a version field to named-build shapes or storage.

## Merge risk
**low** - deletes one unreferenced constant; no public surface, no `criticalPaths` symbol, and the typecheck fails on any leftover reference.

## Review focus
No hotspots: a two-line deletion of an export with no references anywhere in the repo (case-insensitive grep), checked by the type checker.

## Reviewer guide
Reviewable change: +0/-2 LoC (no exclusions)
- [`lib/aoe4-build-order/named-builds.ts`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/187/files#diff-943d154aefea0af54959eb58ceca9eed3c58d0d685dfe70fb6a5634e46816270) - deletes the unused `NAMED_BUILD_VERSION` export; verify nothing imports it.

## Invariants and scope
Invariants touched: none. No other line of the file changes.

<!-- cf-stack -->
### Stack

Merge bottom-up (this PR marked `->`):

- -> #187
