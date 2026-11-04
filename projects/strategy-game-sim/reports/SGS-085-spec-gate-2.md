# SGS-085 spec-gate 2

Verdict: READY. Risk standard stands.

The three gaps from gate 1 are closed in the ticket:
- Line-less ordering: Scope 4 now sorts line-less issues first, and a 201-step test row covers it.
- Existing-test rule: Scope 6 states a rule, not a list of tests.
- Docs: the Node references paragraph, the Issues paragraph and the `t2b` node are in Scope.

The owner's answer to Q11 (check issues on a parse failure drop `step`) is in Scope 4 and in two criteria. Open questions holds nothing that decides main-path behavior. CONTEXT.md has no open questions or Decisions.

Spot-checks against the code:
- **Schema:** `Problem` and `report` params carry `suggestion` today. `knownId` and `nodeAt` build `in ${name}`. `toOrderIssue` uses `located(...)`, which always sets `step`. This matches the ticket's plan for an optional field member and a step-less path.
- **Fourth argument:** the `superRefine` in `orderSchema` runs the start and cross-step rules, so a limited-check argument has a natural seam.
- **Step cap:** the 200-step cap is in `SIM_INPUT_BOUNDS.steps`, and a `pause` step has no per-step cross-field problem. The 201-line row therefore yields the cap issue and then the `fly` syntax issue.
- **Page:** `rejection` is set only in `runSimulation`. `clientIssues` already shows issues live when `converted.lines` is undefined, so a parse failure with no `lines` stays live.
- **Gutter and helpers:** `data-error` is set in `build-text-editor.tsx`, and `workbench.module.css` has no rule for it. `INVALID_PASTE` and `runRejected` exist in `acceptance/helpers.ts`.
- **Docs:** `docs/aoe4-build-order.md` has the `in <path>` text at line 511 and `did you mean <id>?` at line 828. The `t2b` node is at line 651.
- **Other checks:** the invariants (A1-A3) are not touched. Criteria hold in the end state Scope requires. No stale count or list is pinned. The LOC estimate is about 80 and the component is a single one. No LESSONS entry is violated. There are no `On merge` command or doc items beyond the BACKLOG bullets. Input validation does not apply, because there is no new trust-boundary input.

Gaps: none.

Notes, non-blocking:
1. The repo lesson on Playwright layout checks applies to criterion 1. Read both gutter computed styles (line 2 and line 1) in one `page.evaluate`, or wrap them in `expect.poll`.
2. Scope 4 does not say whether the schema or `text-to-build.ts` drops `step`. The criteria test only the observable result, so either is fine. Preferably the limited-check path omits `step` itself, so `text-to-build.ts` does not strip it afterwards.
3. Comments at the seam (the header of `parse-text.ts`, and the `text-to-build.ts` flow) may need a touch. Keep them to the comment bar.
