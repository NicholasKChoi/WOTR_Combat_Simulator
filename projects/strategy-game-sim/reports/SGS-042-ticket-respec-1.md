# SGS-042 re-spec 1

Folded in designer pass 4 rows 2, 5a, 5b, 5c, 1c. Risk stays high (lib/** criticalPath, core event loop).

- 5a: item 5 names `accrueWait(engine, stepIndexes, seconds)`, skips trigger/earlier-step/null, only writer of `waitBreakdown`; criterion adds a grep for writes outside it.
- 5b: item 7 and the step-stuck criterion pin the message `step <index + 1> (<action>) was still waiting on <reason> at <m:ss horizon>, from <m:ss at>.`; field stays 0-based.
- 5c: item 4 and the criterion: handler-less action gets `prerequisite`, stays `waiting`, gets step-stuck.
- 1c: times use `formatMinSec` from `lib/aoe4-build-order/format-time.ts` (SGS-035 moves it).
- 2: item 7 uses `sortWarnings`.
- Four open questions removed; none remain.

Check: today `git grep "waitBreakdown\["` in non-test lib finds nothing (field does not exist yet), consistent with the pre-change state. The "None.-count" criterion for `{ started: false }` (5 sites) was unchanged.
