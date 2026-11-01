# SGS-025 review 1

Verdict: **REQUEST CHANGES** (one blocking finding, a one-sentence doc fix)

Branch sgs-025-aoe4-doc-rally-start, tip 548a923 (local only; not on origin, so I reviewed the SHA directly), base 68e004a.
Diff: `docs/aoe4-build-order.md` only, +69/-17. Commit author choinickolas@gmail.com; message has no ticket ids.

## Blocking findings

1. `docs/aoe4-build-order.md:129` - contract/correctness - "Both `start` fields are optional, and `start: {}` is valid."
   For English this can never be true. `rules/english.json` `startingState.buildings` is `["capital-town-center"]`,
   a villager producer, and the doc's own `invalid` rule at l.371 ("no `start.rally` while a starting building is a
   villager producer") makes every English order without `start.rally` `invalid`, `start: {}` and orders with no
   `start` at all included (design/M2.md Owner decisions 3: "`start.rally` is required while a starting building
   produces villagers"). Every downstream ticket (parse, validate, engine, route, page, builds) is reviewed against this
   doc, so a flat "`start: {}` is valid" invites a validate test or fixture that expects `ok: true` for `start: {}`
   or for a startless English order. That expectation contradicts the l.371 rule.
   Direction: say the fields are optional in the schema and that `start: {}` is well-formed (not a `syntax` issue),
   then add that an English order still needs `start.rally` because the capital town center produces villagers. No
   new rule is involved: this follows from l.371 and the English data.
   The same wording is in design/M2.md l.140 and ticket Scope item 3. The manager may want to reword those too
   (one word, "valid" -> "well-formed") so the next ticket does not copy it again. That is outside this branch.

## Spec gaps

None that block. The design's "valid" at M2.md l.140 can only mean schema-valid, given Owner decision 3. Finding 1
is a wording fix, not an open decision.

## Acceptance criteria

| AC | result | evidence |
|---|---|---|
| (respec 1) greps for "required for villagers" and the removed-claim pattern find nothing | pass | both `git grep` runs empty at 548a923 |
| (respec 1) the three issue-location cases, old sentence gone, no `BuildOrderLines` | pass | l.350-353; "A paste error carries" and `BuildOrderLines` greps empty |
| `produce` row has `rally?` optional, villager only, sets the standing rally; `rally` row has `producer`, `instance?`, `to`, `walkSeconds?` | pass | l.291, l.296; matches the SGS-026 `BuildStep` at 3726128 field for field |
| `BuildOrder` has `start?`, `BuildStart { villagers?, rally? }`, a paste `rally` line, a grammar `start` line with three `syntax` cases | pass | l.284-286, l.309, l.345-348; matches the SGS-026 `BuildStart` |
| bounds rows: `start.villagers` int 0..200, `walkSeconds` names `rally` | pass | l.54-55, same as M2.md l.326-327 |
| Task-switch walk: every spawned villager, the source's `walkSeconds`, `inputs.walkSeconds` for `start.rally` | pass | l.174-176 |
| `invalid` row and paragraph list exactly the six rules, plus `unknown-id` and `out-of-range` for `start`; the old "needs rally" claim is gone | pass (see note 1) | l.359, l.361, l.362-373, l.375 |
| Rally rules subsection covers every listed item, same meaning as the design | pass | l.182-197. Same-instant is a pointer to l.138-140, where the rule is stated once, which follows the comment bar |
| Starting state: replaces the split whole, no walk, sum equals the starting count (6 for English) | pass, but l.129 wording is wrong (finding 1) | l.126-129 |
| no "owner", "confirmed" or dates | pass | `git grep -ni "owner\|confirmed\|2026"` empty |
| doc and design agree both ways | fail on l.129 only (finding 1); every other Rally and start rule matches in both directions | rule-by-rule check against M2.md l.126-147, l.176-183, l.326-327, l.360-377, l.443 |
| only the doc changes; tsc and npm test green | pass | `git diff --name-only` shows only the doc; `npx tsc --noEmit` exit 0; `npm test` 127/127 |
| (respec 1) consistent with A2, A3, S3 | pass | A2: l.193 says the `rally` step has no cost or supply. A3: rally state follows only from step order and `startedAt`, with the same-instant rule fixed (l.138-140). S3: l.55 bounds `start.villagers` and l.54 covers `rally.walkSeconds`; `instance` 1..200 covers `rally#k` |

Criteria are not ticked in the ticket because the verdict is not APPROVE.

## Invariants touched

- A2 (resources never go negative): holds. A `rally` step spends nothing and needs no supply (l.193).
- A3 (determinism): holds. Last writer wins by `startedAt`, and the same-instant ordering is fully specified.
- S3 (bounded inputs): holds. `start.villagers` values are int 0..200, and the step count is already capped.
- A1, S1, S2: no code is touched. They do not apply.

## Linter

`npx tsc --noEmit`: clean (exit 0). Docs-only diff.

## Review bot

`reviewBot.cli` and `rulesFile` are unset in REPO.md. There are no bot findings to reconcile.

## Non-blocking notes

1. `docs/aoe4-build-order.md:372-373`: "no earlier `rally` source covering every instance of that `baseId`".
   The design (M2.md l.145) and ticket Scope item 11 say "baseId-wide", meaning a source with no `instance`. "Covering
   every instance" could be read to include a set of instance-scoped rallies (`#1`, `#2`, ...) that together cover
   the existing instances, which the design does not accept. Suggest: "no earlier `rally` source for that `baseId`
   without `instance`" (baseId-wide).
2. `docs/aoe4-build-order.md:311`: "each line stands alone". After finding 1, any of these lines pasted alone
   except the `start` line is `invalid` for English (no `start.rally`). Suggest "each line is a separate example".
   This fits naturally with the finding 1 fix.
3. `docs/aoe4-build-order.md:376-378`: the paragraph is broken after "kind or property. Any issue stops the". It
   renders fine but differs from the doc's wrapping elsewhere. Reflow it.
4. The comment at `lib/aoe4-build-order/model.ts:12`, "rally is required for villagers", is still stale on main. The
   implementer flagged it. I checked that SGS-026 at 3726128 rewrites it to "rally only for villagers and sets the
   producer's rally". No action is needed here.
5. SGS-026 types (3726128) match the doc in field names, optionality and the `rally` action shape: `BuildStart`,
   `BuildOrder.start?`, `{ action: 'rally'; producer; instance?; to; walkSeconds? }`. The doc does not mention the
   SGS-026 `BuildOrderLines` interface, as Scope requires.

## Coverage

- Reviewed: the full diff, plus the surrounding doc sections (Purpose and model, bounds, Starting state, Ordering,
  Queues, Trip model, Task-switch walk, Build order input, Issues, flowchart, Extension points). Also design/M2.md
  Contracts, Line map, Issue codes, Rally and start, Task-switch walk, bounds, paste grammar, Extension points and
  Owner decisions; the SGS-026 `model.ts` diff; and the `rules/english.json` `startingState`.
- REPO.md Review checklist "Every diff": I did not run `next build` or `npm run dev`, because no page or code is
  touched. No path-scoped section (Combat simulator, Starcraft, Shared code, golang) matches `docs/aoe4-build-order.md`.
  There is no AoE4 section in the checklist.
- No REVIEW.md at the repo root. LESSONS.md (repo and project) are empty. ARCHITECTURE.md and tsconfig.json do not
  apply to prose.
- Nothing in CONTEXT.md Out of scope or the ticket's Out of scope is touched. There are no invented constants: 0..200
  and 6 come from the design and `rules/english.json`.
