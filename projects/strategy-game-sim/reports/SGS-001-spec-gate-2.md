# SGS-001 spec gate 2

Verdict: READY

Checked against origin/main d54af2e (fight.ts, army.ts, army.js re-read), CONTEXT.md, INVARIANTS.md, REPO.md
review checklist, empty LESSONS.md files. No owner-only blockers.

## Prior gaps
1. Casualty vs takeHit: CLOSED. Scope 5 states the owner rule (more than 5 units and 0 regulars downgrades an
   elite; strength unchanged). Criterion no longer requires matching takeHit. Current-code note matches
   `BaseArmy.takeHit` (verified: >5 units always does `regulars--`, so 0 regulars goes negative).
2. Stale open-question pointers: CLOSED. Reroll = min(misses, leaders, 5); bounds settled; leader cap has its
   own criterion.
3. Nazgul/character leadership: CLOSED. Moved to "Not modeled (settled)", explicitly not tagged.
4. Outcome stats "proposal" tag and open choices: CLOSED. Tag removed, tie named, survivors split and counted,
   hits per round 0-5 kept, nearest-rank percentiles defined (every percentile a whole round count; median = p50).
5. 10-second budget: CLOSED. In section 7 and its criterion.
6. Diagram mismatch: CLOSED. Flowchart criterion added; Diagrams section explains the ticket itself needs none.

## Check results
- Grounded scope: every named function/class/file exists at d54af2e; `docs/` absent on main as stated. UI
  currently offers 0-9 (loop `i < 10`), leaders `< 6`, matching the notes.
- Testable criteria: each has an observable outcome (section presence, stated values, mermaid block, grep).
- Open questions: the two remaining ones (departures; survivor-share denominator) do not decide main-path
  behavior. The doc states today's behavior with an "owner to confirm" tag, and counts are unambiguous without
  a denominator. Non-blocking, as the caller expected.
- Invariants: W1 (this is its rule source), W2, S3 named; no criterion contradicts any. Independence section
  restates W2.
- Contracts: no new schema/field names; "tie" matches CONTEXT.md.
- Dependencies none; size ~220 lines prose.
- Lessons: none exist.
- Risk high: correct (touches W1; strongModelTriggers "touches an invariant"; also defines a cross-component
  contract).

## Notes (non-blocking; fix in the doc or at PR review)
- Scope 9 puts the `survivor` value `n/a` inside the rule bullet while the same section says the doc names no
  response fields. Move that mapping into the Current code note, which may name today's fields.
- CONTEXT.md Decisions still says the design doc "proposes the exact statistics for the owner to confirm",
  while the ticket treats them as settled (and a later Decisions line lists them). Owner may want to tidy
  CONTEXT.md; the ticket's reading matches the later line.
- Input bounds: the rule says 0 units is rejected; state that totals above 10 and leaders above 5 are likewise
  rejected (implied, not explicit). Non-integer or negative values are unaddressed; SGS-003 will need to decide,
  the doc could say "whole numbers" now.
- UI offers 0-10 regulars and 0-10 elites, so 10+10 is selectable but rejected; the doc may note that the form
  does not prevent it.
- 10-second budget is unqualified by environment; fine for a doc, but SGS-005 should measure on the Vercel
  function runtime.
- Mermaid "parses" criterion needs a reviewer to render it (GitHub preview or mermaid-cli); say which.
- Survivor-share denominator and the four departures stay for the owner at PR review, as intended.
