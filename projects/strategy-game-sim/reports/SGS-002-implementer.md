# SGS-002 implementer report

Status: BLOCKER (Chromium cannot launch on this host; no pass claimed for browser specs)

Branch sgs-002-playwright-acceptance-harness, worktree /home/choin/git/WOTR_Combat_Simulator-factory/worktrees/sgs-002-playwright-acceptance-harness. Tip SHA: see summary (git log -1).

## Files
- package.json, package-lock.json (lockfileVersion 2): @playwright/test devDependency, scripts `acceptance`, `acceptance:setup`.
- .gitignore: test-results/, playwright-report/, blob-report/, playwright/.cache/.
- playwright.config.ts: testDir acceptance, chromium only, port 3100, `npx next dev -p 3100`, reuseExistingServer false, webServer timeout 120s, test timeout 60s.
- acceptance/helpers.ts: DEFAULT_ARMIES (strings), fillArmies, postFight.
- acceptance/landing.spec.ts, fight-api.spec.ts, combat-simulator.spec.ts.

## Results
- `npm ci`: ok. `npm run acceptance:setup`: ok (chrome-headless-shell downloaded).
- `npm run acceptance`: server started on 3100 and stopped; 1 passed (fight-api), 5 failed (all landing and simulator specs) at browser launch: `libnspr4.so: cannot open shared object file` (exit 127).
- `npx playwright install-deps chromium`: failed, needs sudo password ("sudo: a password is required"). BLOCKER per scope item 6.
- `npx tsc --noEmit`: pass. `npx next build`: pass. No lint beyond tsc configured; no codegen.
- Not verified: browser specs passing, the occupied-port failure AC (not run), and whether `networkidle` settles under next dev. The simulator spec uses `networkidle` as ticketed; if it does not settle, switch to another hydration signal.
- git status clean after the run (Playwright output ignored). No files under pages/components/utils/styles changed.

## Needed from the human
Install the Chromium system libs (e.g. `sudo npx playwright install-deps chromium`), then rerun `npm run acceptance`.

## Out-of-scope findings
None.
