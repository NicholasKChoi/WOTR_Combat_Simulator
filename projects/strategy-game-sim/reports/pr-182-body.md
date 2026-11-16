## Summary
Moves the saved-build storage behavior out of one `ARCHITECTURE.md` table cell into a new `## Storage` section of `docs/aoe4-build-order-format.md`, after the Route section and before Outputs. The section keeps every rule the old row stated (store selection, key prefix, named-build compare-and-swap, Blob read-back, weak-etag 503, counter retries, `VERCEL_BLOB_RETRIES`, save limit, live test) and changes none. The "AoE4 saved-build storage", "AoE4 route logic" and "Local saved builds" rows in `ARCHITECTURE.md` shrink to file placement and roles, and the builds routes bullets link to Storage instead of restating it. Non-goals: no code, test or comment change.

## Merge risk
**low** - docs only; a revert fully undoes it, and no public surface or critical path is touched.

## Review focus
No hotspots: documentation moved without a rule change, no code or critical path involved.

## Reviewer guide
Reviewable change: +70/-9 LoC (docs only, no code)
- [`docs/aoe4-build-order-format.md`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/182/files#diff-5535c72f4a82b778feeb06acf538290d6822a9740ffd26ff5d77801db4f6d1d1) - new Storage section and trimmed builds-route bullets; verify each moved rule against `build-store.ts`, `blob-build-store.ts` and `save-rate-limit.ts`.
- [`ARCHITECTURE.md`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/182/files#diff-8f6366fd8e7a5fa30f7f05879999195b7cf5fa1e3d157822eb37f0e91d226cfd) - three "Where files go" rows cut to placement and role; verify no placement rule was lost.

## Invariants and scope
Invariants touched: none. Does not change code, tests, comments or the README.

<!-- cf-stack -->
### Stack

Merge bottom-up (this PR marked `->`):

- -> #182
