# SGS-174 review 1: APPROVE

Branch sgs-174-aoe4-internals-overview, tip 13fde21. Docs ticket. Diff touches only `lib/aoe4-build-order/README.md` (new) and `docs/aoe4-build-order.md` (+2 lines).

## Blocking findings
None.

## Acceptance criteria
- README exists; every non-test `.ts` in `lib/aoe4-build-order` is named (compared against `git ls-files`). `production-floors.ts` sits on the test-support line. Only `builds.test.ts`, `production-floors.test.ts` and an acceptance spec import it, so that placement is right. PASS.
- Named files, functions and types exist at base. I grepped about 30 symbols and each is defined in the module the README names. Descriptions read against `text-to-build.ts` (issues sorted by line) and `saved-builds.ts:93` (reopen check via `textToBuildOrder`). PASS.
- Data flow: parse, check, simulate, result, in the order the code runs them. `simulate.ts` handler rejects a `text` body (line 17-18) and takes `buildOrder`; `textToBuildOrder` is the paste-only stage. PASS.
- Event loop: `runInstant` order in the README (collectRunOuts, house pass, offerSteps, applyDueEvents, house pass, offerSteps, startProduction, house pass) matches `simulate.ts:706-717`. `nextWake` candidates match lines 800-818. `stepHandlers` entries match line 513. PASS.
- Links: every design-doc anchor (build-order-input, data-sources, model-rules, depletion, technologies, civrules-seams, extension-points, route, builds-routes, named-builds-routes, outputs) matches a heading in the model doc or format doc at the branch tip. Relative paths are correct. No line-number links. The `#the-event-loop` anchor is a heading in the README itself. PASS. I did the check by reading the heading list, not with a script.
- No digits outside file names, anchors and link targets (grep). PASS.
- Model doc diff is only an added pointer line, in the intro beside the format and UI doc links. PASS.
- No code files changed. PASS.
- INVARIANTS: none touched, no regressions.

Handlers directory `pages/api/aoe4-build-order/` (`simulate.ts`, `builds/`, `named-builds/`) and `data/aoe4-build-order/README.md` exist.

## Non-blocking notes
- The README says `api-route.ts` is "Browser-safe". I did not verify this claim. It is not a rule, and I am not filing it.

## Coverage
README and model doc diff read in full. `simulate.ts` loop and `nextWake`, `text-to-build.ts` and `saved-builds.ts` call sites read. Symbol existence checked by grep. No lint, bot or UI inspection (no reviewBot, docs only).
