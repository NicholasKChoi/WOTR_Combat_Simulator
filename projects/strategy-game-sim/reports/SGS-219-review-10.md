# SGS-219 review 10 (delta, mutation-record check only)

Verdict: APPROVE

Tip is 65026066fb27e560c2c1cf6cd6a45c75715dbb54, unchanged since review-8. The task checkout's `git status` is clean. Implementer-9 also records matching `tree-record.sh` hashes before and after (6d9b3f28...).

## Review-8 blocking findings re-checked (implementer-9 Mutation checks)

Hide/hover/pin test, Units and Population rows. Each break is in `line-chart.tsx` and fails on the listed line:
- `:278` condition gated on `labelKind === null` fails at `:117`.
- `:278` gated on `hidden.size === 0` fails at `:121`.
- `:278` gated on `!pinned` fails at `:124`.
- `:280` x shifted while hovered fails at `:118`.
- `:280` x shifted while pinned fails at `:126`.

Units `:117,:118,:121,:124,:126` and Population `:118,:126` are all covered, and both rows failed (2 failed each time). I read the spec at `:112-128`: each listed line asserts exactly the value the break changes. `:118` and `:126` use `expect.poll` on `left`, so a persistent shift fails them. The `:278` and `:280` lines in `line-chart.tsx` are the `drawnTimeMark ? (` condition and the `ReferenceLine x=` prop the breaks target.

"Adds only its own label" test. Each break fails on the listed line:
- `:174` (mark count) fails when the Units `timeMark` entry is deleted from `results.tsx`.
- `:177` (`markLabels`) fails when the Units label value is blanked.
- `:178` (`rows`), `:179` (`markerLines`), `:180` (`paths`), `:181` (`dots`) and `:182` (`labels`) each fail on its own break, in `line-chart.tsx` at `:154`, `:127`, `:159`, `:131` and `:153`.

Each break touches code that reads `timeMark` and leaves the other fields equal. The code at `:127`, `:131`, `:153`, `:154` and `:159` is as described. Identifying the failing line through the matcher and value is acceptable, because `toPass` hides the inner line. I did not re-run any break (no mutation runs in this role); the read-through shows each is plausible.

Both review-8 blocking findings are resolved. No production, spec or doc change in this rework.

## Notes
Review-8's non-blocking notes stand: the `:101` and `:164` guards, the `PINNED_LINE` typing, and no Units test for a run with no markers.
