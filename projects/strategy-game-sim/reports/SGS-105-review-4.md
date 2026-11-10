# SGS-105 review 4 (delta, rework 3, text)

**Verdict: APPROVE**

Tip 2b62126b9b2bf9105d14f99755f65561d7873183. Delta from e2bc300, the tip review 3 bounced. Base: origin/main 5b29e9e (merge-base).

## Rework 3 Required fix

| Fix | Landed | Evidence |
|---|---|---|
| Move the "#### Saving a build and opening it by link" block, with no wording change, from inside the Narrow layout paragraph to after "MAA/Crossbow`." and before `## CivRules seams`, with one blank line on each side | yes | `git diff --stat e2bc300..2b62126` touches only docs/aoe4-build-order.md (28+/28-). The 28 removed lines and the 28 added lines are byte-identical (`diff` of the extracted -/+ lines shows no difference), so this is a pure move. The block now sits at docs/aoe4-build-order.md:1030-1056. Line :1028 ("MAA/Crossbow`.") is followed by a blank line, the heading at :1030, the block, a blank line, then `## CivRules seams` at :1058. |

## Placement check

- The Narrow layout paragraph (:898-903) now continues directly into "At 1200 px and wider ..." as on main. `git diff 5b29e9e..2b62126 -- docs/aoe4-build-order.md` has no hunk covering the Narrow layout, 390 px or 1200 px lines, so those lines match base. The only remaining hunks are the rework-approved Page edits at :860-878 and :986-992, plus the added subsection at :1027.
- `### Page` (:860) now runs, without an intervening heading, through the prebuilt builds paragraph. The `####` subsection is its last part and ends at `## CivRules seams`. This is what Scope "Docs" asks for ("after the 'Page' text").
- The forward reference at :864 ("one exception: opening a `?b=` link, see below") still points forward to the subsection and reads correctly.
- The subsection reads on its own where it now sits. Its terms (run bar, settled input, the pause, status `current`, the Build and Results tabs) are all introduced earlier in Page.

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

No code changed since review 3, so every criterion verdict in reports/SGS-105-review-3.md stands as is. The docs criterion (Scope "Docs": add the subsection after the Page text) now passes, per the placement check above.

## Invariants

The delta is docs only and touches no invariant. Review 3's invariant verdicts stand.

## Lint / review bot

Not re-run. The delta is one markdown file with lines moved verbatim, which no linter or bot rule in scope covers. Review 3's results on the same code stand.

## Bot reconciliation

No new bot findings. None was run, for the reason above.

## Non-blocking notes

These notes from review 3 still stand and are not required:
- docs :862-863 has two "and"s, and it lists the run status before Save build, which is the reverse of the DOM order.
- The other notes carried from reviews 1 and 2.

## Coverage

Reviewed `git diff e2bc300..2b62126` (docs/aoe4-build-order.md only), the surrounding Page section (:860-1058) at the tip, and the diff against base 5b29e9e for the moved region. Local `main` is stale (ee7ecb9), so the comparison used origin/main 5b29e9e. No worktree was created; review was by SHA via `git show`/`git diff`.
