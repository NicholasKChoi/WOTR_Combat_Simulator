# SGS-084 CI-parity suite run 1

- Branch: sgs-084-aoe4-gather-rate-per-villager
- Tip SHA tested: 94a0c7b6cfab642aba3165113a7be6aa9f8031c6 (detached suite worktree, removed after the run)
- Base: origin/main fad1e41 is an ancestor of the tip (SGS-089 engine guards included)
- Verdict: PASS on every command. No failures to classify.
- Working tree after the run: clean (`git status --porcelain` empty; only gitignored build output present).
- Logs: /tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/fe37a078-0455-4b3a-a6fa-5c6b2dc1f4c4/scratchpad/ (npm-ci.log, unit.log, tsc.log, lint-dup.log, next-build.log, acc-setup.log, acceptance.log)

## Results

| Step | Command | Result |
|------|---------|--------|
| Install | `npm ci` | exit 0, 0 vulnerabilities |
| Unit (verdict) | `npm test` (`vitest run`) | exit 0. Test Files 47 passed (47); Tests 1470 passed, 10 skipped (1480) |
| Typecheck | `npx tsc --noEmit` | exit 0, no output |
| Duplication | `npm run lint:dup` (jscpd) | exit 0, 0 clones over 94 files |
| Build | `npx next build` (Next 16.4.3, Turbopack) | exit 0, compiled and generated 6 static pages; routes include /apps/aoe4-build-order and /api/aoe4-build-order/simulate |
| Acceptance setup | `npm run acceptance:setup` (Chromium) | exit 0 |
| Acceptance (verdict) | `npm run acceptance` (Playwright, webServer on its own next dev port) | exit 0, 727 passed (1.3m), 0 failed, 0 skipped reported |

The new spec `acceptance/aoe4-gather-rates-per-villager.spec.ts` ran inside the full acceptance run and passed both tests:
- "the checkbox starts unchecked and switches the tooltip food value and y label between raw and per villager" (1.8s)
- "with a pin, the pinned tooltip value is also per villager and a hidden legend entry stays hidden across the toggle" (3.3s)

These two tests cover the two unchecked page and pinned acceptance criteria in the ticket. The ticket still shows those boxes unchecked; the manager may want to tick them.

Note: the unit suite reports 10 skipped tests. I did not check whether they are skipped on main too.

## Environment

- Node installed: v24.22.2. Declared: `engines.node` = `24.x` in package.json. Match, no mismatch. No `.nvmrc`, `.node-version`, `.python-version`, `.tool-versions` or `go.mod` at the repo root.
- Install commands used: `npm ci`, then `npm run acceptance:setup` (`playwright install chromium`). System libraries for Chromium were not checked; the acceptance run launched Chromium without error.
- codegen: not set in REPO.md, not run.

## Cleanup

- Playwright started and stopped its own `next dev` server on the port derived from the suite worktree path. Nothing from this run is still listening; `ps` shows no process tied to the suite worktree.
- Other processes are running from other sessions: a Playwright run and a `next dev` on port 3784 under `worktrees/sgs-084-aoe4-gather-rate-per-villager`, and `next-server` processes on ports 3525 and 3775. I did not touch them.
- The suite worktree `worktrees/suite-SGS-084-1` is removed with `git worktree remove --force`, followed by `git worktree prune`.

## Blockers

None.
