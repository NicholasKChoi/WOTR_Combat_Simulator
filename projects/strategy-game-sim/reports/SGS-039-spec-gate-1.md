# SGS-039 spec gate 1

Verdict: NEEDS_SPEC (two gaps; both small, neither needs the owner)

Checked against design/M3.md, CONTEXT.md, INVARIANTS.md, REPO.md, SGS-037/038/040/042/050/051/054 and `main` f078c11.
Names (`isDepleted`, `nextRunOut`, `runRefs`, `nodeRefIssue(value, finiteOnly)`, `NodeRefProblem`, `availableAt`,
`assignGatherers`, `accrueWait(engine, stepIndexes, seconds)`, `triggerWakeAt`, `triggerAtLeast`) match the design and the
dependency tickets. Invariants A1, A2, A3, S3 are named and not contradicted. Risk `high` is right (criticalPaths `lib/**`,
changes what every default run computes). Size ~210 is fine. Main-branch grep counts in the criteria are correct
(`trigger?.kind === 'time'` 1 line, `trigger.kind !== 'time' && ...` 1 line, no literal amounts in non-test lib code,
Resources-are-infinite doc lines present). Open questions: none, and none left in the design. LESSONS files are empty.

## Gaps

1. **Acceptance criterion "Depletion is on by default" - contradicts Scope - an implementer cannot satisfy it.**
   It says an ENG 1TC run to 3600 s reports `depletions` with "`gold#2` not run out". But `runRefs` only creates a stock
   (and a `depletions` entry) for deposits the order names, and this ticket does not touch `english-1tc.json` (the
   `move all gold to gold#2` reaction is SGS-040). So `gold#2` has no `depletions` entry at all here. The implementer
   must either guess or add a `gold#2` reference to ENG 1TC, which the ticket forbids. Fix: reword to "`depletions` has
   `sheep` and `gold` run out, and no `gold#2` entry (the order does not name it); SGS-040 adds the `gold#2` entry when
   it adds the reaction". Keep the `inputsFor` part (every `gold#k` 4000 for a run that names it) as a test with an order
   that names `gold#2`.

2. **Docs - `data/aoe4-build-order/README.md` goes stale and no ticket owns it - an implementer would leave it.**
   - Line 71 (Known data gaps): "The five starting sheep are not units. They are the `sheep` gather node with unlimited
     food, so sheep food is never depleted". After this ticket sheep start at 3000 and run out near 760 s by default.
   - Lines 35-39 (Prebuilt builds): "any step that does not complete or keep running by 3600 s in the simulation" is the
     old bar. SGS-050 expects "SGS-039's docs" to have rewritten it ("say 'waiting' and 'not reached' the way SGS-039's
     docs do"), but SGS-039's Scope lists only `docs/aoe4-build-order.md` and `openapi.json`. SGS-054 excludes README.
   Fix: add `data/aoe4-build-order/README.md` to Scope: rewrite line 71 (sheep is a finite node with an owner-supplied,
   unverified amount; the herding limit stays), and restate the prebuilt-build sentence as the five-part bar (steps
   `waiting` or never started are the failure, with the horizons). Add a criterion: `git grep -n "never depleted"
   -- data/aoe4-build-order/README.md` finds 1 line on `main` and 0 after. Mention in SGS-050 that the sentence is already
   rewritten (its note assumes so).

## Notes (non-blocking)

- `triggerWakeAt(trigger, state, income)`: say the `trigger` parameter accepts `undefined` (the cursor step may have no
  trigger), or that `nextWake` guards it; otherwise two implementers will differ.
- Criterion "ENG 1TC is unchanged ... all 24 of its steps keep their `startedAt`": the basis (last non-reaction step starts
  at 508 s, sheep runs out near 760 s) lives in SGS-040, not here. One sentence of basis in this ticket would let the
  implementer judge a moved step as a bug rather than an expected change.
- The horizon rule modifies SGS-042's `finalStatus` rule ("`trigger` when it is the cursor step"). The Scope says so; make
  sure SGS-042's tests for that rule are updated in this diff, not just extended.
