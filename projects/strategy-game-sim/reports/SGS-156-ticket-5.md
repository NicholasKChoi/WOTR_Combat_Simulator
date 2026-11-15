# SGS-156 ticket 5 (re-spec 4)

- Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-156-aoe4-auto-houses-plan-ahead-for-wood.md
- Lint: `ticket-lint.py` clean.

## Summary

SGS-156, "Auto-houses plan ahead for wood and hold their cost back from steps and orders" (Bug, aoe4-build-order, standalone, risk high, about 220 LOC, no dependencies). The implementer bounced (implementer-2) because, with the fix, `ENG 1TC` and `ENG 1TC Council Hall` float more than `MAX_FLOATING_AT_1200` (2000) wood at 1200 s. That check runs in `lib/aoe4-build-order/builds.test.ts` and in `acceptance/aoe4-simulate-api-prebuilt-farms.spec.ts`. The spec gap was in Scope 8. Its rule for existing tests covered house-timing tests and tests that pin engine output. It did not cover the prebuilt-build thresholds. Those are owner-confirmed values from SGS-081 ("70% floors and the 2000 cap", owner-confirmed 2026-11-03). SGS-081 also says floors are never lowered on a branch.

## Changes

- New Scope 10, "Prebuilt-build bars" (respec 4):
  - names the bar's doc (`docs/aoe4-build-order.md` "Prebuilt builds"), its checker (`productionChecks` in `production-floors.ts`) and the two tests that run it;
  - forbids lowering a floor, raising the cap, or narrowing the cap's scope on the branch;
  - states the cause (no supply cap, more villagers on wood, pop 200 before 1200 s with no wood sink);
  - keeps the other prebuilt-build bars holding, and puts any doc made untrue by the chosen option in scope (the docs paragraph and `data/aoe4-build-order/README.md` `## Prebuilt builds`).
- New criterion (respec 4): every prebuilt build meets its floors and cap at 1200 s in both the unit test and the acceptance spec. The other bars still hold. No floor is lowered, and the cap changes only as the owner's answer says.
- Appended `## Re-spec 4 - 2026-11-15`.
- The base moved from e50e074 to c5bd608. The two new commits (#166, #167) touch no aoe4 engine, data or doc file, so the branch work is unaffected.

## Diagrams

The existing Mermaid read/act/record flowchart of `runInstant` is unchanged.

## Open questions

- **owner:** how `ENG 1TC` and `ENG 1TC Council Hall` get back under the 1200 s floating cap. Options:
  - (a) raise `MAX_FLOATING_AT_1200`. It is one shared constant, so this loosens the bar for every build.
  - (b) add a late wood-spending step to those two builds in `data/aoe4-build-order/builds/` and keep the 2000 cap. This edits build content, and `ENG 1TC` follows an aoeivbuilds source.
  - (c) apply the cap only up to the time a build reaches the population cap, or set it per build.

  Recommendation: (b). SGS-081 set the cap to make a build spend its economy, and (a) and (c) weaken that bar for every build to fix two. Once answered, the ticket author rewrites Scope 10 to the chosen option. The ticket stays blocked until then.

## Branch work

All of the work at ff47225 stands: engine, docs, new tests, and the pinned-value updates. Only the two floating-cap failures remain to be resolved, after the owner answers.

## Overlap

None found with other open tickets.

No scratch checkout was used.
