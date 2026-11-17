# SGS-198 review 6 (delta mode)

Verdict: **APPROVE**

Branch `sgs-198-units-chart-unit-lines`, delta `55c83d7..45e14d2`. The delta is one file, `components/apps/aoe4-build-order/result-series.test.ts`, 2 lines added and 2 removed. No production code changed.

## Required fix from review 4, finding 1

Landed verbatim. The `lines()` fixture is now `spearman-3` [0,1,2], `longbowman-2` [0,3,3], `longbowman-3` [0,0,5]. The expected result is `spearman` [0,1,2] then `longbowman` [0,3,8], and `name` comes from `lineName`.

Mutations, by reading the fixture:
- Sort by key puts `longbowman` first, so the test fails.
- Sort entries by ascending tier puts `longbowman-2` first, so the test fails.
- Key by `unitId` gives three series, so the test fails.
- One tier's counts instead of the sum gives `[0,3,3]` instead of `[0,3,8]`, so the test fails.

The file passes (22 tests). The delta touches no other test, and no assertion outside the fixture changed. Findings 2 and later: none were blocking in review 4.

## Descending-tier sort

It still passes the fixture. `spearman-3` and `longbowman-3` tie at tier 3 and keep input order, so the first-appearance order comes out unchanged. I do not require B-U1 to fail for it. The ticket says "ordered by tier" with no direction. The finding I dictated named the ascending sort, and the fix does fail it. The implementer's report states the gap. Closing it would need a line that spans a lower and a higher tier than the other line (the first-seen line must have a strictly higher minimum tier and a strictly lower maximum tier), which the current tier data may not allow. Non-blocking note only.

## Everything else

Unchanged from review 4 (full review, REQUEST CHANGES only for finding 1). All other acceptance criteria stay as passed there, and the non-blocking notes from review 4 stand. I did not rerun the browser inspection, since there is no UI or production change in the delta.

Scratch checkout removed.
