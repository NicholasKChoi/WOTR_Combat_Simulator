# SGS-031 ticket re-spec 3 (2026-11-01)

- Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-031-aoe4-build-move-ages.md
- Trigger: reports/SGS-031-implementer-1.md (needs_spec). The final criterion said SGS-030's tests stay unchanged except the Seam test. Auto-houses on by default lift the supply-10 stop that 8 SGS-030 tests assert.
- Design check: design/M2.md SimInputs has `autoHouses: boolean // default true`, and its Auto-houses example says production "does not stall at supply 10" with default inputs. The default stays on. No design conflict.

## Changes
- Scope section 5 is now "SGS-030's tests: the Seam test and the supply-bound pins". It lists the 8 tests by file > describe > test name. The only edit allowed in each is `autoHouses: false` added to the inputs of the run the test reads. The two wood-only acceptance tests share one describe-level `run`, so one pin covers both. No assertion, expected number, step list, start, game data or helper may change. The generated-invariants `<= 3` bound stays as written.
- Out of scope: the "any SGS-030 test other than the Seam test" line now also exempts the 8 pins.
- Final criterion, now (respec 3): `INPUT_DEFAULTS.autoHouses` stays `true`. Every SGS-030 test is unchanged except the Seam edit and the 8 pins. The check is a `git diff origin/main` on the two test files: outside the Seam test, only lines that add `autoHouses: false`.
- No other criterion changed. Re-spec log entry `## Re-spec 2026-11-01 (3)` added. No `## Rework` section: the ticket convention keeps those for implementer/review rework, and re-specs go in the Re-spec log.

## Verified
- On branch @ 1d514ee, vitest on simulate.test.ts and simulate.acceptance.test.ts fails exactly the 8 named tests (61 pass). Their names match the ticket text exactly.
- `INPUT_DEFAULTS` is the name of the defaults object in validate.ts (autoHouses: true at l.39).

## Branch work that still stands
- All of 1d514ee. The rework adds only the 8 pins.

## Open questions / owner gaps
- None.
- Note for the manager: 3 of the 8 tests are in simulate.acceptance.test.ts, which the implementer says the acceptance gate owns. The ticket now authorizes the pin there. Route that edit to whichever role is allowed to touch acceptance tests.
