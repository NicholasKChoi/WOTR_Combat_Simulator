# SGS-152 review 1

Verdict: APPROVE (tip 5f8a404, base origin/main)

## Blocking findings
None.

## Acceptance criteria
- Pinned-colour sentence: pass. docs/aoe4-build-order.md now gives both cases. It matches `pinnedColor` (chart-rows.ts:56-59): current-series index when the key exists, else `series.length + pinnedIndex`, through `seriesColor`. `legendItems` (chart-rows.ts:77) passes `i` as the pinned index, which fits "its index among the pinned series".
- ARCHITECTURE.md storage row: pass. It now says "only non-test source file that imports `@vercel/blob` (its tests and the live and acceptance harnesses import it too)". `git grep` finds `@vercel/blob` in blob-build-store.ts plus the four test files the ticket lists.
- No other doc states either claim: pass. I grepped README.md, docs/ and ARCHITECTURE.md on origin/main. The docs/aoe4-build-order.md:993 legend sentence makes no colour claim about pinned-only series.
- Only docs change: pass. The diff touches only ARCHITECTURE.md and docs/aoe4-build-order.md. No test or code changed.
- INVARIANTS: none touched.

## Chore check
No behaviour or test assertion changed.

## Lint, bot, UI
Skipped. The change is docs only and no code changed. I did not check REPO.md for a `reviewBot` block, so the bot step is unconfirmed. No UI inspection.

## Non-blocking notes
- "the palette color at the index" does not say the palette wraps (`seriesColor` uses `index % PALETTE.length`). This is harmless and matches the original doc's level of detail.
- The new pinned-run sentence puts a long line in the markdown. This is consistent with the file.
- The code comment at chart-rows.ts:55 ("follows the current series by pinned index") is consistent with the new doc and was out of scope.

## Coverage
Read the diff, `pinnedColor`, `seriesColor`, `legendItems`, and the doc greps. Ran no tests.
