# SGS-072 implementer report 1

Status: needs_review
Branch sgs-072-aoe4-pin-persistence-label, tip 9e4c4e05f279ae287baae07ff0f4723a26a795fe, base origin/main c7ca461.
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-072-aoe4-pin-persistence-label

Files: pin-storage.ts (new, C13), pin-name.ts (new), build-input.tsx (controlled select, no useState), compare-panel.tsx (pinnedName, alreadyPinned, pinned-label),
results.tsx (stale prop and notice), pages/apps/aoe4-build-order.tsx (selected, run snapshot, pin object, stale, restore effect with cancelled flag and pinTouched ref),
docs/aoe4-build-order.md (pin paragraph), pin-name.test.ts, pin-storage.test.ts, acceptance/aoe4-build-order-pin-compare.spec.ts (15 new tests in a second describe).

Tests: npm test 1307 passed, 10 skipped (44 files). npm run acceptance 678 passed. New spec group 15 tests, --repeat-each=5 --workers=3 in parallel with the full run on one shared server (throwaway config, deleted): 75 passed.
Pre-existing tests edited: none (all pass unchanged; the pin-run clicks in m3-flow and aoe4-build-order.spec.ts did not hit a disabled button).
Mutation checks (each failed, then reverted via git checkout):
- pin-name: empty-builds check, exact vs trimmed match fail rows. pin-storage: no key removal, no isFinite (needed an added 1e999 row), no version check, rethrowing write fail rows.
- page: alreadyPinned=false fails "pin is disabled" test; stale=false fails stale test; no write on pin fails 4 tests; no clear on unpin fails write-through; no clear on 400 fails 400 test; no clear on non-converting text fails that test;
  removing the pinTouched guards fails "Pin or Unpin before the restore lands"; restore also setting the result fails the Run-race test (via the delta check); label hidden in compare-panel fails 6 tests.
- Removing only one of the two pinTouched guards passes (the other guard covers); both removed fails.
Build (next build), tsc, lint:dup (0 clones): pass. codegen n/a.
Invariants: S1 imports only lib/aoe4-build-order and components; S3 restore goes through textToBuildOrder and the route; A3 alreadyPinned decided on text and duration of the run snapshot.
Docs: "survives later runs" no longer appears. Node 24. Port 4101 free at end.
Out-of-scope: none. The "Unpin before restore" half of the race rule is covered by the same ref but only Pin is tested.
