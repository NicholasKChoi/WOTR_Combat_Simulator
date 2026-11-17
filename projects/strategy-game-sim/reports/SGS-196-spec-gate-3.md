# SGS-196 spec gate (report 3)

**Verdict: READY**

## Gaps

none

## Checks

- The gap from report 2 is closed. The `panStepSeconds` criterion is now a rule: Math.round of half the span, floored at 1, with the floor tested through a direct 0 s or 1 s span. Scope states where the floor applies. The empty-rows case for `rowsInWindow` is specified.
- Grounded scope: `lib/aoe4-build-order/format-time.ts` `formatMinSec`, `chart-rows.ts` `ChartRow`, `chart-legend.test.ts` and `chart-header.test.ts` all exist at origin/main. The four new files do not exist there.
- Contracts: the C10 and C12 names, signatures, test ids and accessible names match `design/M11.md` word for word. The rows B-Z3, B-Z4, B-Z8 and B-Z12 are cited correctly. The edge-row rule for `rowsInWindow` is C10 read literally.
- Criteria are all rules or properties. None searches code, and none pins a count or a list that goes stale. "Only the four new files" is a diff property of this ticket, not a stale number.
- No existing test or doc depends on this change, because the files are new and nothing imports them.
- The remaining fields are consistent with a pure-math plus markup change: risk `low`, about 110 LOC, no dependencies, `On merge: none`, Invariants `none`, Unverified assumptions `none`, no open questions.
- No input validation at a trust boundary. No overlap with another open ticket was found.

## Notes

- The range-text separator is left to the implementer. This is fine, since the criterion only requires both `formatMinSec` values to appear.
- Q129 (the owner answer in Source) was not found by grep in PROJECT.md or `design/M11.md`. The ticket body states the rule itself, so this is not blocking.
