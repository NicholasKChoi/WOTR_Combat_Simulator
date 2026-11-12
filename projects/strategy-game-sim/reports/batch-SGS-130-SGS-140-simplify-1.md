# Batch simplify SGS-130..SGS-140 (1)

Stack (bottom to top), all rebased with no conflicts, nothing pushed, no PRs touched.

| Branch | Old tip | New tip | Trim commit |
|---|---|---|---|
| sgs-130-blob-landed-write-retry-cap | d2b7669 | 73693ef6a798bd09edac6e7bf189f18715afbd4a | yes |
| sgs-131-my-builds-no-wipe-and-backup | bbda9ed | c03940d606811ccec307af943087c5aacf6246e4 | yes |
| sgs-134-chart-layout-model-key-results-collapse | 1ea93cb | a5e866c021f9caa6788aedfea34be8e645a0f65d | none (rebase only) |
| sgs-136-simulate-production-buildings-series | 38a7cdf | bbaa1715aae751ab74778fa96235cb08700df07a | yes |
| sgs-140-editor-compact-mode | 2f18733 | 72be9db6aa1e0c8e495863d6256035b3710e3469 | skipped (low risk), rebase only |

## Trims
- 130: removed the duplicate "caps the SDK retries through VERCEL_BLOB_RETRIES" describe from `lib/aoe4-build-order/blob-lost-writes.acceptance.test.ts` (and its now-unused import and `unstubAllEnvs`). `blob-build-store.test.ts` covers the same behavior directly. Production code left alone.
- 131: `my-builds-storage.ts`: flattened `readStored` (one try around JSON.parse only) and extracted `orderedBuilds`, shared by `readMyBuilds` and `upsertMyBuild`.
- 134: reviewed; every piece (`moveChartTo`/`moveTo`, `CollapseCaret`, hook effect) is required by the ticket and used or tested. No change.
- 136: `production-buildings.ts`: replaced filter-then-forEach side effect with a plain loop.

## Conflicts
None in any rebase (git reported clean for every branch, including docs/aoe4-build-order.md and ARCHITECTURE.md).

## Checks after each branch's final state
Unit tests (`npm test`), `tsc --noEmit`, `npm run lint:dup`: all pass on every branch, including after rebase.
- 130: 2397 passed, 15 skipped
- 131: 2409 passed
- 134: 2426 passed
- 136: 2441 passed
- 140: 2441 passed
Lint:dup found 0 clones on each. No browser or end-to-end tests were run. Branch-local acceptance specs untouched except the 130 trim above.
