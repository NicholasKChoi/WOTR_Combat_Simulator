# SGS-085 review 2 (delta)

**Verdict: APPROVE**

Branch `sgs-085-aoe4-text-editor-issue-ux` (local only, not on origin), tip `75f074f`, base main `2a36296`.
Delta reviewed: `bd85765..75f074f`. Previously approved content: `cd0493a`, now rebased to `bd85765`.

## Rebase check

`git range-diff fad1e41..cd0493a 2a36296..bd85765` gives `1: cd0493a = 1: bd85765`. The patch is identical, so the rebase changed nothing in the branch's own diff.

## Rework 1 Required fixes

- [x] Rename: `fieldRulesOnly` became `skipWholeOrderRules` in `orderSchema` (schema.ts:534,536,540) and in `checkBuildOrder` (schema.ts:617,619). `fieldSchemasByCatalog` became `stepRulesSchemasByCatalog` (schema.ts:532,536). The schema.test.ts:248 title is now `skips the start and cross-step rules when asked to skip the whole-order rules`. The caller `text-to-build.ts:25` passes `true` positionally, so it needed no change. Behaviour is unchanged: the diff is identifiers and one test title only (7+/7-).
- [x] No stale names: `git grep -n -i -E "fieldRulesOnly|fieldSchemasByCatalog|field rules only|field-rules"` across the worktree finds no match. No doc or comment names the option.
- [x] Rebased onto `2a36296`. Re-ran `npx tsc --noEmit` (clean), `npm run lint:dup` (0 clones) and `npm test` (48 files, 1483 passed, 10 skipped).

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

These are unchanged from review 1 because the delta is a rename only.
- Ticked: 2-9, 12, 13, 14.
- Left unchecked: 1, 10, 11.
  - Review 1 confirmed the behaviour of all three by probe.
  - Criteria 1 and 11 name acceptance cases (gutter computed style; Run summary 1/2 and edit tracking) that the branch does not add. `git diff 2a36296..HEAD -- acceptance/` changes only one line each in from, inline-issues and m4-flow.
  - The hide-after-fix half of criterion 10 has no acceptance case and was not probed.
  - These belong to the acceptance-test gate.

Criterion 13 evidence:
- `npm run acceptance` on 75f074f gave 726 passed and 1 failed. The failure was `aoe4-build-order-step-band.spec.ts:101` (keyboard focus band and blur), a spec main added in the step-span band change.
- This branch touches no chart or step-band file.
- Re-running that spec alone with `--repeat-each=3` gave 27/27 passed, so the failure is load flakiness, not this branch.
- `acceptance/aoe4-build-order.spec.ts` has no diff.

## Invariants

A1-A3 (engine) and W1/W2 (combat) still hold. The delta touches no criticalPaths symbol.

## Bot reconciliation

`reviewBot.cli` is empty and `rulesFile` is empty, so there was no bot run.

## Non-blocking notes

- schema.ts:539: inside `orderSchema`, the local `const fields = orderObject(catalog)` (added in bd85765) still says "fields", but the schema it holds also runs each step's cross-field rules. This is the same naming slip review 1 raised, now on a local in a 10-line function. Renaming it to `stepRules` or inlining it would match the new names. Not blocking.
- Unit tests still pin only `knigt` for criterion 2 (carried from review 1).

## Coverage

- Reviewed `lib/aoe4-build-order/schema.ts` (orderSchema, checkBuildOrder, toOrderIssue), `lib/aoe4-build-order/schema.test.ts:248`, `lib/aoe4-build-order/text-to-build.ts` and the range-diff.
- Ran `next build` only through tsc, and loaded no page. The delta is a lib-only rename with no UI change, and review 1 did both on identical branch content.
- REPO.md Review checklist: I applied Every diff and AoE4 build order. The delta adds no copied helper or doc sentence.
