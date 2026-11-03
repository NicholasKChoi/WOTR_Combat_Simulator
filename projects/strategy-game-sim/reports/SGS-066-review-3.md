# SGS-066 review 3 (rework 2 delta re-review)

Verdict: APPROVE

Branch sgs-066-aoe4-workbench-tabs-editor, tip 6e1a5d01d9b8e73d141fffdea3695794f56fc72d (one commit on fb4ca86, which review 2 passed apart from the flaky client-check test). The branch is still stacked on the old sgs-059 tip 41e648d. Delta reviewed: `git diff fb4ca86..6e1a5d0` (4 files, +16/-9). Node 24.22.2. Review worktree `worktrees/review-sgs-066-r3`, removed afterwards. Dev server on port 4011, stopped afterwards.

## Blocking findings

None.

## Rework 2 items: verification

1. **Client-check test reads both rects atomically (fixed).** `acceptance/aoe4-build-order-client-check.spec.ts:76-81` now takes both `getBoundingClientRect()` values in one `page.evaluate`, so they run in one synchronous JS task. Smooth scrolling only moves on animation frames, so the scroll offset cannot change between the two reads. The test still asserts `listTop >= textBottom`.
   - Mutation: moving `<IssueList>` above the editor in the page makes the edited test fail (`Expected: >= 793.75, Received: 427.08`). It can still fail for a real reason.
   - Stability under parallel load: one shared `next dev` on port 4011, a throwaway config that sets `reuseExistingServer: true`, and a second spec file run against the same server at the same time:
     - Whole client-check file with `--repeat-each=20` while `aoe4-build-order.spec.ts` ran `--repeat-each=2` in parallel: **260/260 passed**, including this test 20/20. The load run passed 102/102.
     - This test alone with `--repeat-each=60` under the same parallel load: 60/60.
     - This test with `--repeat-each=40`, three rounds, while the full acceptance suite ran in parallel: 120/120. The full suite itself passed 631/631.
   - Old version: I ran a throwaway copy of the fb4ca86 file under the same loads, side by side with the new one: 60/60 with one spec file as load, and 3 x 40 = 120/120 with the full suite as load. **I could not make the old test fail in this session.** The race behind it does reproduce. A probe that logged `scrollY` around the two old `boundingBox()` reads under parallel load saw the offset change in **23 of 60 runs** (mostly 0 to 92 px). In those runs the move fell outside the narrow gap between the two reads, so the old assertion still held. In the same 60 runs the atomic read was true every time. CPU throttling (4x and 8x) made the scroll settle before the reads (0 of 40 changed), so it did not help reproduce the failure. My evidence is therefore: the race is still present, the new form cannot see it by construction, and the new test was stable across 440 loaded runs. I do not have a reproduced old failure.
2. **Run bar held by a ref (fixed).** `pages/apps/aoe4-build-order.tsx:69` adds `runBar = useRef<HTMLFormElement>(null)` and passes it as `formRef={runBar}` (line 136). `build-input.tsx:22,41` adds `formRef?: Ref<HTMLFormElement>` and puts it on the form as `ref`.
   - `git grep -n "closest(\|querySelector" -- pages components` prints nothing, so no DOM query is left.
   - Test ids are unchanged: `run-bar` is still on the same form.
   - Re-measured after a 200, with the page scrolled to the bottom first and the scroll settled:

     | width | bar bottom | Results heading top | inline scrollMarginTop |
     |-------|------------|---------------------|------------------------|
     | 1280 | 93.89 | 94.08 | 93.8906px |
     | 768 | 186.78 | 186.48 | 186.781px |
     | 390 | 247.28 | 246.88 | 247.281px |

     These match review 2 to the hundredth of a pixel, and the margin equals the bar height.
   - Mutation: deleting `formRef={runBar}` (so the margin falls to 0) makes new spec 2 fail at 1280, 768 and 390. The offset can no longer drop to 0 without a test failing.
3. **Docs rewrap (fixed).** `docs/aoe4-build-order.md:812-815`. Script check: splitting the whole file on whitespace gives the same sha1 at fb4ca86 and 6e1a5d0 (`fefea07...`). Both have 11090 words, and `git diff --word-diff=porcelain` shows no word additions or removals.
4. **Rest of the tree identical.** `git diff --stat fb4ca86..6e1a5d0` excluding the four files above prints nothing. Rework 2's "No other change" holds, and the client-check edit is the allowed exception.

## Spec gaps

None.

## Acceptance criteria

All ticked in the ticket (24 boxes: 15 original criteria plus Rework 1 and Rework 2).

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1-8 | Workbench specs 1-8 | pass | Full suite 631/631 on 6e1a5d0. Spec 2 re-measured as in the table above. |
| 9-10 | `lineCount` rows and mutation | pass | Unit 1225 passed and 8 skipped. The mutation was checked in review 1, and this delta does not touch it. |
| 11-12 | Greps | pass | This delta does not touch them (verified in review 2). |
| 13 | Old specs pass; counts; edited tests listed | pass | Full suite 631/631 with no flake, and the counts are unchanged. As in reviews 1 and 2, the edited-test list is in `reports/SGS-066-implementer-1.md`, not in the ticket body. |
| 14 | Docs | pass | Same words, rewrapped. |
| 15 | tsc, lint:dup, npm test, acceptance | pass | tsc clean; jscpd found 0 clones; unit 1225 passed and 8 skipped; acceptance 631/631; `npx next build` OK. |
| 16 | No invariant regressions | pass | S1: the new import is `type Ref` from react only. S2 and S3 are untouched. A1-A3 are not touched. |
| R1 (5 boxes) | Rework 1 | pass | Verified in review 2, and the measurements still hold. |
| R2 (4 boxes) | Rework 2 | pass | Items 1-4 above. |

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are both empty, so no bot ran.

## Non-blocking notes

- `acceptance/aoe4-build-order-client-check.spec.ts:77-79`: the `evaluate` body is indented 8 spaces, but the file uses 2-space steps, so it should be 6 (compare lines 11-18). The textarea is also found with `querySelector('textarea')`, while the list on the next line uses its test id. A probe confirmed the page has exactly one textarea, but `[data-testid="build-order-text"]` would match the `textarea()` helper at line 5. Both are cosmetic, and a simplify or pre-PR pass can fix them.
- `docs/aoe4-build-order.md:815`: the rewrap leaves a 46-character line ("with that build's paste text; editing the text") before the untouched next line. The words are identical, so this is only ragged wrapping.
- `pages/apps/aoe4-build-order.tsx:77` keeps `?? 0` for a null ref. That only happens if the form is not mounted, and the mutation above shows spec 2 catches it.
- I found no implementer report for rework 2 (`reports/` has only implementer-1 and -2). The manager may want the rework-2 pass count recorded there or in the ticket.

## Coverage

- Reviewed the full delta: the client-check spec, `build-input.tsx`, the page and the docs.
- Ran: tsc, lint:dup, unit, `next build`, the full acceptance suite, the loaded repeat runs, the scroll-race probe, the 3-width measurement, and two mutations (formRef removed; IssueList moved above the editor).
- Could not do: reproduce an actual failure of the old test (see item 1).
- REPO.md checklist: "Every diff" (build plus loading the touched page) done. "AoE4 build order": no copied helper, no engine rule change, no chart change.
