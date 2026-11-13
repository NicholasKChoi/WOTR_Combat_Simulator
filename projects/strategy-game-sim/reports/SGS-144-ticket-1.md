# SGS-144 ticket report 1

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-144-rem-basis-compact-threshold.md
Title: Fix rem sizing that assumed a 16px root in the AoE4 editor and save row
Type Bug, Priority medium, Risk low, Component aoe4-build-order, Milestone none, Depends on none. Lint passes.

## Summary
SGS-140 already adapted to the 18px root (compact query `width < 48rem` = 864px; the spec reads the root size), so the code is self-consistent. The defect is that design M9 intended a 16px basis (768px), so a 768px-wide tablet in the tabs layout is now compact, and no gate compared the threshold with the pixel intent. The ticket pins the compact boundary as an absolute px width in a Playwright case, keeps the two container queries (workbench and step-annotation) switching together, and adds a 1200px-boundary check for the save row (12rem/8rem link input in the `min-width: 1200px` rule), fixing the row only if it fails. It also covers docs: the 48rem sentences in `docs/aoe4-build-order.md` and a note that the root is 18px. About 15 LOC.

## Audit
Viewport media queries are px (768, 767.98, 1200) and unaffected. Other rem values (paddings, gaps, `.scrolledTable` 30rem, `.runCell` 4rem) are spacing with no px threshold tied to them. I read only; I ran no browser, so whether the save row holds at exactly 1200px is unverified (the ticket's criterion decides it).

## Open question (owner)
Keep the compact threshold at 48rem (864px) or move it to 768px (about 42.7rem). The ticket needs the answer before implementation.

## Diagrams
None required.

## Overlap
None with open tickets (SGS-140 integrated). `design/M9.md` C14 is factory state, not repo, so it is updated through On merge, not the ticket.
