# SGS-012 acceptance: PASS

Branch sgs-012-upgrade-dependencies at 623a5ff (base 6013fcc). Worktree (detached at the tip):
/home/choin/git/WOTR_Combat_Simulator/.claude/worktrees/agent-ac5134280e0bdc01f. Node v22.17.0.
Setup: `npm ci` (0 vulnerabilities) and `npm run acceptance:setup` (Chromium). No new spec written; no commit made.

## Harness runs
- `npm run acceptance`, cold (`.next/` removed): 209 passed (10.2s).
- Second consecutive run: 209 passed (10.3s). No retries.
- `npm test`: 57 passed, 0 "CommonJS" warning lines.
- `npx tsc --noEmit`: exit 0; `npx tsc --listFilesOnly` lists vitest.config.mts once.

## Criteria checked
- /api/fight contract: fight-api-contract and fight-api-spec-surface are in the 209 and green; `docs/api/openapi.json`,
  `acceptance/`, `playwright.config.ts` have no diff vs 6013fcc; no `retries|test.skip|test.fixme` matches.
- /api/fight behavior vs main: the openapi example request returns 200 with keys battles, outcomes, rounds, survivors,
  hitsPerRound (manual, under `next dev`). The existing battles/validation specs pin the numbers and error paths.
- Three pages: `/`, `/apps/combat-simulator`, `/apps/starcraft-helper` load with zero nested anchors; landing page
  links are single anchors (`/apps/combat-simulator`, `/apps/starcraft-helper`); the Randomize buttons clicked without error.
- `git ls-files next-env.d.ts AGENTS.md` empty; `git status --porcelain` clean after two acceptance runs, test and dev;
  grep for `<a` after `<Link` in pages/components is 0.
- Console on the three pages under `next dev`: no hydration warnings and no page errors. Two console messages seen:
  a Next 16 dev-only HMR "isrManifest" warning, and a 400 on `/api/fight` from clicking Fight! on the empty default form
  (the validation path the specs cover). Neither is a regression.

## Not verifiable here
- Vercel check green on Node 24.x and the PR description evidence (open ticket boxes): need the PR.
- Console-error and hydration checks have no committed spec (only one `pageerror` hook in the validation spec). The ticket
  forbids new tests, so I checked them manually.

## Failures
None (no impl-defect, spec-gap, or stale-test).
