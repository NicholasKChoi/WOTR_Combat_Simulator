# SGS-078 review 1: APPROVE (tip b6daa13)

## Blocking findings
None.

## Acceptance criteria
- Header order and unchanged values: pass (step-timeline.tsx th order; spec edits at aoe4-build-order.spec.ts 643/652/664/670, timeline-compare 47-48, all repointed; nth(4) readers unchanged; compare-panel rows untouched).
- data-kind on every row, unit cover per kind: pass (step-timeline-rows.test.ts it.each covers all 7 kinds incl. missing step; stepKind uses VILLAGER_ID from engine-common).
- catalog.landmarks via shared LANDMARK_CLASS, engine behavior unchanged: pass (landmarks.ts; simulate.ts only swaps the inline test for isLandmark(entry); same condition). English list pinned in schema.test.ts.
- Border + badge, table-warning kept: pass (screenshots at 360 and 1280: border and badge visible on warning row; 768 had no overflow).
- Legend div above the table, wraps, visible: pass (360 px: legend wraps to two lines, no horizontal overflow at 360/768/1280; acceptance asserts visibility).
- Catalog test / later-age landmark: pass (kind has no age argument; stated in docs).
- Existing specs repointed: pass by reading. Full unit and acceptance suites: not re-run by me (I ran tsc, lint:dup, and vitest for components/apps/aoe4-build-order and lib/aoe4-build-order: clean/pass); relied on implementer's 690 acceptance pass. Left unchecked in the ticket.
- Docs: pass; the colour and column statements match the code (age-up bold + primary, research info, military danger, villager success, building secondary, economy gray-400).
- Invariants: S1 holds (styles stay in components/apps/aoe4-build-order; landmarks.ts is in lib/aoe4-build-order). A1: no new game literal. A3: no nondeterminism added.

## Linter / bot
npx tsc --noEmit: clean. lint:dup: 0 clones. reviewBot.cli not set (not required); no bot run.

## Visual check (done here, the implementer skipped it)
Screenshots at 360x760, 768, 1280 of the knight/longbow build: legend wraps at 360 and is visible; border and badges visible; age-up row bold with blue border on a yellow row; no document horizontal overflow at any width. The temporary spec was removed and the dev server stopped.

## Conventions
Siblings checked: results.module.css (existing scrollBox/scrolledTable), schema.ts catalog fields (comment style, semicolons), step-timeline.tsx pre-existing structure. No departures. No bootstrap utility mixed with module CSS on one element (`fw-bold` is on a td with no module class). Conditional classes use cn.

## Non-blocking notes
1. No acceptance check asserts what the user sees for the kind styling (badge text or border colour); the new checks read `data-kind` and legend visibility only, as the ticket specified. A regression that drops the badge or border would pass. Consider asserting badge text in a later ticket.
2. Implementer's mutation note: dropping the `type === 'building'` filter or `.sort()` in the catalog is not caught because the data has no such case. Acceptable.
3. `.kindOther` sets a transparent colour and `.kindBorder` still reserves 4 px; fine and intentional.
4. results.tsx adds a `landmarks` prop in the middle of ResultsProps; harmless.

## Coverage
All 14 changed files reviewed. Not run by me: full acceptance suite and `next build`.
