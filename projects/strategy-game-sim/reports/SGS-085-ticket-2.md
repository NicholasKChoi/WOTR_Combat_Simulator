# SGS-085 ticket re-spec 1 (ticket agent, run 2)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-085-aoe4-text-editor-issue-ux.md
Base explored: origin/main b9481e3. Risk stays standard. Component aoe4-build-order, ~80 business lines, Depends on none.

## Gaps resolved (spec-gate 1)
1. Line-less ordering: Scope 4 now says the parse-failure merge is a stable sort by `line`, with line-less issues before every
   line-bearing one, check order kept among line-less issues and among issues on the same line. Only line-less check issues in a
   paste are order-level (civ, name, step-count cap). A `start` issue always has a line when `partial` has a start. New criterion:
   `start -> sheep` + 201 x `pause capital-town-center` + `fly` gives the cap issue first, then the `fly` syntax issue.
   Verified on b9481e3 in a throwaway worktree (since removed): that text without `fly` is 5,244 characters long and gives exactly one
   check issue, `steps: 201 steps, more than 200` (out-of-range, no line). The pause lines add no issues.
2. Existing-test rule: Scope 6 is now rules only. Tests that pin paste `in <field>` or the old suggestion text, and tests that assert a
   syntax-error text lists only syntax issues, hides check issues, or equals parseBuildOrderText's failure, take the new expectation.
   A failing text with no check issues on other lines keeps its value. JSON expectations stay. The named examples were removed.
3. Docs: Scope 2 edits the Node references paragraph (` in <path>` only without a paste line). Scope 4 edits the page paragraph
   ("in check order" too), the Issues paragraph and the `t2b` flowchart node, which must show both paths. A new grep criterion
   checks the old `t2b` label is gone; it matches line 663 today.

## Notes folded in
- `. ` join is added whatever the message ends with; there is a component test row for a message ending in `)`.
- Summary keeps tracking N after an edit. An acceptance step was added: after the 2-issue rejected Run, fixing one issue shows `Fix 1 issue ...`.

## Added by this re-spec (my call, reversible)
- Check issues returned on a parse failure have no `step` member, because the index would point into `partial.order.steps`, which
  is not returned. Nothing on the page reads `issue.step` (grep of pages/components/lib on b9481e3). The Issues-paragraph doc
  edit covers it, and the criterion row asserts it.

## Checks run
- `git grep -n "did you mean <id>" docs ...` matches docs line 846 today; end state none.
- `git grep -n 'checkBuildOrder with lines"\]' docs/aoe4-build-order.md` matches line 663 today; end state none.
- Criterion 6 (`start nonsense\npause capital-town-center`) parse gives one syntax issue on line 1, consistent.
- Per-step rule `stable cannot produce longbowman` fires on a 2-line text, consistent with criterion 7.

Diagrams: none (single component, not a control loop), unchanged.
Open questions: none.
Overlap: SGS-082 deletes acceptance/aoe4-build-order.spec.ts; this ticket does not touch it.
