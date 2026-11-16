# SGS-187 ticket report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-187-remove-unused-settled-scroll-y.md (lint clean)

Summary: Chore, component aoe4-build-order, Milestone none, about 5 LOC, Depends on SGS-184. Removes `settledScrollY` from acceptance/helpers.ts. At origin/main c754c4c no file imports it (git grep). `TABS_VIEWPORT` and `showTab` are still defined there, but SGS-184 (unmerged, its checkout has no commits yet) deletes them, so the ticket only covers `settledScrollY`. Scope has two conditionals for after SGS-184 lands. If SGS-184 or a later ticket starts using `settledScrollY`, change nothing and drop the backlog item. If SGS-184 leaves `TABS_VIEWPORT`, `showTab` or `SPLIT_MIN_WIDTH` unused, delete them too and report it as SGS-184's miss. Criteria: tsc passes (a leftover importer is a type error), existing tests keep their assertions, lint:dup and npm test pass. No doc names the helper.

Diagrams: none (no-diagram sentence). Open questions: none. Overlap: SGS-184 Scope touches the same file, so this ticket runs after it. The BACKLOG.md item mentions SGS-182 as reporter and should be marked consumed by the manager.
