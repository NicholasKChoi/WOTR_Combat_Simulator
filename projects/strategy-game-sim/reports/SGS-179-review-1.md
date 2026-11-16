# SGS-179 review 1

Verdict: APPROVE. Tip 212efb7, base origin/main.

## Blocking findings
None.

## Acceptance criteria
- helpers.ts exports `MIN_SUPPORTED_VIEWPORT = { width: 1200, height: 800 }`; SPLIT_VIEWPORT, WIDE_VIEWPORT, TABS_VIEWPORT, SPLIT_MIN_WIDTH, showTab untouched (diff is a one-line add): pass.
- Both narrow/small-screen specs deleted; `tsc --noEmit` passes (run); grep finds no reference to either name outside node_modules/.next: pass.
- 3000-char unknown-id test in inline-issues at default viewport (playwright config sets no viewport, so 1280x720): asserts count 1, `unknown-id`, truncated message, document and `panel-build` scrollWidth <= clientWidth in one evaluate under poll. Implementer's mutation record shows it fails when the panel scrolls: pass.
- Compare fits-box at WIDE_VIEWPORT with a pin and a 300 s run that differs from the 1200 s pin, asserts `compare-scroll` scrollWidth <= clientWidth. Mutation record (width 300 on compare-panel) shows it fails: pass.
- Reload-keeps-pin is a plain default-viewport test; tab-build/tab-results asserts dropped; pin, label, text, status, two POSTs, duration, hydration assertions kept; no tab test ids: pass.
- No showTab or TABS_VIEWPORT remains in the two files (grep, no matches): pass.
- `npm run lint:dup`: 0 clones (run): pass.
- `npm test` and the two edited specs under acceptance: relied on the implementer's record (2623 passed; 56 passed). I ran neither (not permitted for acceptance): unverified by me. Other specs' assertions unchanged (diff touches only five files).
- Invariants: none apply; no page code touched.

## Bug/Chore/Docs checks
Type is Feature. Pre-existing test edits are only `showTab` removals and the reload case's tab asserts, all ticket-authorised. The moved 1800 compare case keeps its assertion unchanged.

## Bot reconciliation
No reviewBot configured.

## Non-blocking notes
- The fits-box case calls `runOk(page, { duration: 300 })` after `setViewportSize` and pin; fine.
- `MIN_SUPPORTED_VIEWPORT` has no importer yet; intended (sibling tickets import it).

## Coverage
Read the full diff of the five files and the narrow spec's moved cases at base. Ran tsc and lint:dup in the scratch. No UI inspection (test-only diff). Scratch removed after the report.
