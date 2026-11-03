# SGS-077 ticket author report 2 (re-spec)

- Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-077-aoe4-gathered-resources-chart.md
- Mode: re-spec after implementer bounce (reports/SGS-077-implementer-1.md). Branch `sgs-077-aoe4-gathered-resources-chart` @ a471dab, base main ee7ecb9.

## Changes to the ticket

- Scope item 6 rule widened: a list of the result's charts, fields or per-sample series gains the entry; a test that
  pins the OpenAPI version moves to 2.1.0; a whole-result digest leaves `gathered` out and keeps its pinned value; no
  other expected value changes.
- Three tests named under item 6 (respec 2):
  - `acceptance/aoe4-simulate-api-edges.spec.ts`: result-key list gains `'gathered'`.
  - `acceptance/aoe4-simulate-api-issue-shape.spec.ts`: version assertion and title move to 2.1.0.
  - `lib/aoe4-build-order/simulate-house-warnings.test.ts`: destructure excludes `gathered`, title and comment updated,
    three pins kept (`e7f2436b024f722f`, `a0105e4a512765a0`, `46f521f50e92ca03`). Chosen over re-pinning because
    unchanged pins prove no existing field moved. SGS-080 note: if it lands after SGS-077 it re-pins with `gathered`
    excluded.
- Listed as checked and unaffected: `research.acceptance.test.ts` (`rest` vs `plainRest`, same engine both sides),
  `aoe4-simulate-api-house-lead-time.spec.ts` (named-field digests), contract spec `withoutTimes`,
  `fight-api-spec-surface.spec.ts` (`info.version` truthy only). No snapshot files in the repo.
- Criteria: the "no existing field changes" criterion is now (respec 2) and names the kept digests and every
  test-edit category; a new (respec 2) grep criterion on the version pin.
- Appended `## Re-spec 2026-11-03 (2)`.

## Searches run (on ee7ecb9)

- `git grep -E "2\.0\.0|info\.version"` over acceptance/lib/components: issue-shape (pins 2.0.0), fight-api-spec-surface
  (truthy only). docs/aoe4-build-order.md "in API 2.0.0: a body with a `text` key ..." is a historical statement, still
  true, not changed.
- `Object.keys(body|result)` lists: only edges lists result keys (others list request keys, `spent`, outcomes, waitBreakdown).
- `...rest` destructures and `createHash`/digest: only simulate-house-warnings digests the whole result.
- `toMatchSnapshot`: none.

## Criteria run

- `git grep -n "toBe('2.0.0')" -- acceptance lib components`: one match on main and on a471dab (issue-shape:16); the
  end state requires zero. `toBe('2.1.0')` absent on a471dab; end state requires the issue-shape match.
- `git grep -c chart-gathered-resources -- acceptance` on main: none (unchanged criterion holds).

## Branch work

a471dab stands, including its edges and house-warnings edits. Remaining: the issue-shape assertion and title to 2.1.0.

## Diagrams

None (unchanged: "no diagram required").

## Open questions

None.

## Overlap

SGS-080 re-pins the same house-warnings digests; ordering note added to item 6. SGS-076 touches results.tsx (unchanged note).
