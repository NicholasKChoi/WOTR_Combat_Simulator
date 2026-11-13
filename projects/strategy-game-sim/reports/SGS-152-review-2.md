# SGS-152 review 2

Verdict: APPROVE

Branch tip 985fd77 is based on origin/main f55e0aa (ancestor check passed). The diff against main is exactly two files, ARCHITECTURE.md and docs/aoe4-build-order.md. No .ts or .tsx file changes.

## Rebase check
- ARCHITECTURE.md: the diff against main changes only the one phrase in the storage row. It now reads "the only non-test source file that imports `@vercel/blob` (its tests and the live and acceptance harnesses import it too)". Main's newer storage-row content is intact (VERCEL_BLOB_RETRIES, `W/` etag, read-back, bumpCounter, live test, VERCEL_ENV).
- docs/aoe4-build-order.md: only the pinned-colour sentence changes.

## Acceptance criteria
1. Pinned-colour sentence: pass. `pinnedColor` (chart-rows.ts:56-59) uses the colour of the current series with the same key, else `seriesColor(series.length + pinnedIndex)`. `legendItems` (line 77) and line-chart.tsx:172 pass the index among all pinned series. The doc states both cases and matches this.
2. Storage row restricted to non-test source: pass. At the tip, `@vercel/blob` is imported by blob-build-store.ts and by four test or harness files: blob-build-store.test.ts, blob-build-store.live.test.ts, blob-lost-writes.acceptance.test.ts and named-build-store.acceptance.test.ts. These match the doc's parenthetical.
3. No other doc repeats either claim: pass. `git grep -i "only file|same color|same colour"` over *.md at the tip found nothing.
4. Only docs change: pass. No test changes.
5. INVARIANTS: ticket lists none, and a docs-only diff touches no invariant.

## Findings
- Blocking: none.
- Non-blocking: `seriesColor` wraps by modulo (`PALETTE[index % PALETTE.length]`). The doc's "palette color at the index" does not mention the wrap. This is acceptable as written.

## Other gates
- Lint, bot, UI inspection: not run. The diff is docs only, and the ticket sets no review bot. REPO.md checklist was not consulted beyond the checks above.

## Coverage
- Both changed files, chart-rows.ts, line-chart.tsx call site, and the importer grep at the tip.
