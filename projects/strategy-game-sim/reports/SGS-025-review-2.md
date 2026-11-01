# SGS-025 review 2 (after rework 1)

Verdict: **APPROVE**

Branch sgs-025-aoe4-doc-rally-start, tip a86b6ea (local only, not on origin, so I reviewed the SHA directly in a
detached worktree), base 68e004a. Review 1 was at 548a923. I ran the full review again, not delta mode.
Diff: `docs/aoe4-build-order.md` only, +71/-18 against the base and +7/-6 for the rework. Both commits are authored
by choinickolas@gmail.com, and the messages contain no ticket ids or factory pointers.

## Blocking findings

None.

## Rework 1 required fixes

| fix | result | evidence |
|---|---|---|
| l.129: fields optional in the schema, `start: {}` well-formed (not `syntax`), English still needs `start.rally` | done | l.129-131. No new rule: this follows from l.373 and `capital-town-center` in the English starting buildings |
| l.372: rally source is baseId-wide | done | l.374-375: "no earlier `rally` or `produce` source for that `baseId` without `instance` (baseId-wide)". This matches design/M2.md "no earlier baseId-wide `rally` source", and the writers are the ones l.189 defines |
| l.311: "each line stands alone" reworded | done | l.313: "each line is a separate example". `git grep "stands alone"` finds nothing |
| l.376-378: reflow the broken paragraph | done | l.377-379 now wraps normally |

## Spec gaps

None. The "valid" wording in design/M2.md l.140 is already on the backlog, so it is not raised again.

## Acceptance criteria (all pass, all ticked in the ticket)

| AC | result | evidence |
|---|---|---|
| (respec 1) "required for villagers" and removed-claim greps find nothing | pass | both `git grep` runs are empty at a86b6ea |
| (respec 1) three issue-location cases, old sentence gone, no `BuildOrderLines` | pass | l.352-354; the `A paste error carries` and `BuildOrderLines` greps are empty |
| `produce` row has `rally?` optional, villager only, sets the standing rally; `rally` row lists its fields | pass | l.293, l.298 |
| `BuildOrder` has `start?` and `BuildStart`; paste `rally` line; grammar `start` line with three `syntax` cases | pass | l.286-288, l.311, l.347-350 |
| bounds: `start.villagers` int 0..200; `walkSeconds` row names `rally` | pass | l.54-55 |
| Task-switch walk: every spawned villager, source `walkSeconds`, `inputs.walkSeconds` for `start.rally` | pass | l.176-178 |
| `invalid` row and paragraph list exactly the six rules, plus `unknown-id` and `out-of-range` for `start`; old claim gone | pass | l.361, l.363, l.364, l.367-375, l.377 |
| Rally rules subsection covers every item, same meaning as the design | pass | l.184-199 compared with M2.md "Rally and start". Same-instant is stated once at l.140-142, and l.197 points to it |
| Starting state: replaces the split whole, no walk, sum equals the starting count (6 for English) | pass | l.126-131 |
| no "owner", "confirmed" or dates | pass | `git grep -ni "owner\|confirmed\|2026"` is empty |
| doc and design agree both ways | pass | The review 1 mismatch at l.129 is resolved. The doc's "well-formed" is the reading of M2.md l.140 that Owner decision 3 forces, and the backlog tracks the design wording |
| only the doc changes; tsc and npm test green | pass | `git diff --name-only 68e004a...HEAD` lists only the doc; `npx tsc --noEmit` exit 0; `npm test` 9 files, 127/127 |
| (respec 1) consistent with A2, A3, S3 | pass | see below |

## Invariants touched

- A2 (resources never go negative): holds. A `rally` step has no cost and no supply (l.195).
- A3 (determinism): holds. Last writer wins by `startedAt`, and the same-instant order is fully specified (l.140-142).
- S3 (bounded inputs): holds. `start.villagers` is int 0..200 (l.55), `rally.walkSeconds` is 0..60 (l.54), and
  `instance` is 1..200, which covers `rally#k`.
- A1, S1, S2, W*, H*: no code is touched, so they do not apply.

## Spec checklist

Names match CONTEXT.md Key surfaces and the design Contracts (`BuildStart`, `start.villagers`, `start.rally`, the
`rally` action). Nothing from Out of scope is implemented, and nothing under `golang/` is touched. No constant is
invented: 0..200 and 6 come from the design and `rules/english.json`. No dead names were added.

## Linter

`npx tsc --noEmit`: clean (exit 0). `git diff --check`: clean.

## Review bot

`reviewBot.cli` and `rulesFile` are unset in REPO.md, so there are no bot findings to reconcile.

## Non-blocking notes

1. `docs/aoe4-build-order.md:129` is 131 characters. Every other prose line in the doc wraps at about 110; only
   table rows and the l.160 formula line run longer. It renders the same, but a reviewer reading the diff will
   see it. This is the same kind of issue as Rework item 4. Suggest a two-line reflow of l.129-131 before the PR
   (move "(not a `syntax`" onto the next line). Not blocking: there is no rendered or semantic impact.
2. l.374-375, "`rally` or `produce` source for that `baseId` without `instance`": "without `instance`" attaches to
   the source, and "(baseId-wide)" makes that clear. A `produce` counts as a source only with `rally`, which
   l.178 and l.189 already define. It could be tighter, but it is correct.

## Coverage

- Reviewed: the whole doc at a86b6ea (all sections, including the result, the step-status diagram, Extension points
  l.488 with the military rally / more `start` fields row, and the issues flowchart); the rework delta
  548a923..a86b6ea; design/M2.md "Rally and start", the Issue codes and the Task-switch walk; the prior review and
  the rework report.
- REPO.md Review checklist "Every diff": `next build` and `npm run dev` were not run because no page or code
  changed. No path-scoped section (Combat simulator, Starcraft, Shared code, golang) matches `docs/`, and the
  checklist has no AoE4 section.
- There is no REVIEW.md at the repo root. Both LESSONS.md files are empty. The style sources (ARCHITECTURE.md,
  tsconfig.json) do not apply to prose.
