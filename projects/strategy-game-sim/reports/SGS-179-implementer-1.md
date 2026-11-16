# SGS-179 implementer report 1

Ticket SGS-179, branch `sgs-179-min-viewport-delete-narrow-specs`, tip `212efb7a6f00de8c274c27a858d4d824f7a16059`, base `origin/main` (6411526).
Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-179-min-viewport-delete-narrow-specs`

## Files touched
- `acceptance/helpers.ts`: added `MIN_SUPPORTED_VIEWPORT = { width: 1200, height: 800 }`; nothing else.
- `acceptance/aoe4-narrow-layout.spec.ts`, `acceptance/aoe4-small-screen.spec.ts`: deleted.
- `acceptance/aoe4-build-order-inline-issues.spec.ts`: added the 3000-character unknown-id case at the default viewport; removed all `showTab` calls and the import.
- `acceptance/aoe4-build-order-pin-compare.spec.ts`: added "the compare table fits its box at 1800 px wide" (`page.setViewportSize(WIDE_VIEWPORT)`, pin, `runOk` duration 300, poll `scrollWidth <= clientWidth`; the `WIDE_VIEWPORT` import was added as the spec-gate note asked); removed all `showTab` calls and import; the reload-keeps-pin case is now a plain test at the default viewport (dropped `tab-results` enabled and `tab-build` aria-selected asserts, `TABS_VIEWPORT` import removed).

## Spec-gate note
The 3000-character case binds to the document `scrollWidth <= clientWidth` and `panel-build` `scrollWidth <= clientWidth` (not PHONE.width), read in one evaluate under `expect.poll`.

## Tests
- `npm test`: 2623 passed, 15 skipped (84 files passed, 1 skipped).
- `npx playwright test` on the two edited specs: 56 passed (inline-issues 14, pin-compare 42).
- Invariants encoded: a long unknown id is truncated in its issue and never widens `panel-build` or the document; the compare table fits its scroll box at 1800 px.
- Pre-existing tests edited: none changed in assertions except `showTab` removal in pin-compare and inline-issues (ticket-authorised), and the reload case's tab asserts dropped (ticket-authorised).

## Mutation checks
- 3000-char case: set `lib/aoe4-build-order/model.ts:27` `MAX_QUOTED_LENGTH` 40 to 5000, `workbench.module.css:170` `.issues` `overflow-wrap` to `normal`, and temporarily removed the truncation `toContainText` line. Failed at the `.toEqual({ page: true, panel: true })` poll: received `panel: false`. All reverted (`git checkout lib components`), test line restored; the document did not scroll sideways in the mutation, so the panel assertion is what catches it.
- Fits-box case: added `style={{ width: 300 }}` to `components/apps/aoe4-build-order/compare-panel.tsx:76`; failed at the `scrollWidth <= clientWidth` poll (`.toBe(true)`). Reverted.
- Reload case and removed-`showTab` edits: assertions kept unchanged otherwise, no new logic to mutate.

## Stages
- codegen: none set. build (`next build`): passed. lint (`tsc --noEmit` and `lint:dup`, both configs): 0 errors, 0 clones.
- Diff stat reviewed: only the five files above; no tool-made changes.

## Doc claims
None added. No comments added.

## Invariant check
No page code touched; INVARIANTS.md entries not affected.

## Unverified assumptions added
None.

## Out-of-scope findings
None.

## Status
needs_review
