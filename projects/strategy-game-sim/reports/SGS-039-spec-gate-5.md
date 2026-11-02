# SGS-039 spec gate 5
Verdict: READY.

Verified against sgs-038-aoe4-depletion-engine (4749c13; docs/data identical to 12f0c53):
- docs grep (6 alternatives) finds 6 lines: 27, 155, 344, 351, 494, 607. Matches the ticket's list. 0 after is reachable.
- `else infinite|Shipped node amounts` finds 2 (:62, :708). `grep -c "infinite when absent"` openapi = 1. README "never depleted" = 1, "keep running by 3600 s" = 1.
- Hand-entered values paragraph (~:90-94), OpenAPI nodeAmounts description (:1560), StepTiming.armedAt (:1895 "every earlier step had started") all exist and are made false/incomplete as stated.
- Results depletions sentence (:606-607) exists as quoted, including the "nothing emits step-stuck yet" clause.
- The sweep rule is a process instruction backed by a measurable artifact (PR body lists extra sentences); the criteria themselves are greps with counts, so nothing unmeasurable is demanded.

Notes (non-blocking):
- OpenAPI BuildOrder description (:1059, "each once its trigger holds and every earlier step has started") is also untrue for reactions. It is not hit by the sweep rule's keywords; the implementer may fix it under the "(or reactions)" clause. Optional to name.
