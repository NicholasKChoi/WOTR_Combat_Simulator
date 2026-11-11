# SGS-115 ticket author, re-spec 2

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-115-split-scroll-columns-headings.md

## Summary

SGS-115 "Scroll the build and results columns separately and make the headings consistent" (component
aoe4-build-order, LOC estimate 80 business logic, no dependencies, risk standard). Re-spec scoped to review 2's
only finding. Criterion 2 now says exactly what the precondition is: the page must have room to scroll further
down from where it is (`window.scrollY < document.documentElement.scrollHeight - window.innerHeight`, under
`expect.poll`). It says outright that overflow alone (`scrollHeight > innerHeight`) does not count. The test must
fail on the `window.scrollY` assertion when `overscroll-behavior: contain` is removed from `.column` in
`workbench.module.css`, and the implementer records that failing run. A new Scope bullet makes the verbatim
line-67 replacement in `acceptance/aoe4-split-scroll.spec.ts`, followed by the mutation run and restore, the only
remaining implementer work. No production code changes. All other criteria are unchanged.

I confirmed at tip 637e1ad that the precondition line is in the "each column scrolls on its own" test exactly as
review 2 quotes it, and that `.column` in `workbench.module.css` sets `overscroll-behavior: contain`. I did not run
the mutation myself. The new guard does not exist on the branch yet, so running it is the implementer's job. The
implementer's earlier run (scrollY 194 before the wheel, 245 after) satisfies the new guard, so the mutation
should still fail.

## Tag numbering

The ticket already had `## Re-spec 1` (dated before Rework 1). The tag rule is "existing Re-spec count + 1", so
this section is `## Re-spec 2` and the changed criterion is tagged `(respec 2)`, not `(respec 1)` as the launch
prompt said. The existing `(respec 1)` tags on criteria 1, 4 and 5 stay as they were.

## Lint

`ticket-lint.py` finds no errors.

## Diagrams

None. The ticket keeps its "no diagram required" sentence.

## Open questions

None.

## Overlap

None new. The change only affects the SGS-115 acceptance spec.
