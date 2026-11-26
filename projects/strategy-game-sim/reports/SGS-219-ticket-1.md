# SGS-219 ticket author report

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-219-units-chart-population-cap-mark.md

Summary: Chore, component aoe4-build-order, Milestone none, Risk standard (A1-A3 adjacent by path), about 5 business-logic lines, no dependencies. At origin/main, `results.tsx` already supplies `timeMark` per chart and `SeriesChart` draws it, so the change is `timeMark: populationCapMark` on the `chart-units-produced` entry, in both views. Scope also lists the docs and help text that call the mark Population-only. They are the UI doc's "No other chart draws a mark" and related sentences, the format doc Outputs sentence, the `page-help.tsx` Charts section, and a check of ARCHITECTURE.md and `docs/aoe4-build-order.md`. It also covers the acceptance spec `aoe4-population-cap-mark.spec.ts`, whose two "no other chart has a mark" loops now fail, plus new Playwright cases for the Units chart in that same spec.

Criteria cover: the mark on Units in both views, no mark when the cap is not reached, no mark on the other three charts, the mark behaving as on Population (marker hiding, pinning, per-chart zoom), unchanged Units chart content, docs and help, and spec runs.

Diagrams: none (single-component).

Open questions: none.

Overlap: none. SGS-216 and SGS-217 are integrated, and the ticket changes none of the code they added. The mark's label sits at the bottom of the plot, so it may sit near the Units chart's upgrade-dot tier text. I put an overlap check into Scope: the implementer reports overlap and stops if the label is drawn through text.

Lint: `ticket-lint.py --graph ... --spec` printed no errors or warnings. No scratch checkout was used. The ticket has no mutation criterion.
