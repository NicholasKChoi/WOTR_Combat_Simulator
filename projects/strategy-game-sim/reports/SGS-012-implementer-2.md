# SGS-012 implementer report 2 (respec 2)

Status: **needs_review**

- Ticket: SGS-012 Upgrade npm dependencies to current stable majors
- Branch: `sgs-012-upgrade-dependencies` (base `origin/main` 6013fcc)
- Tip: `623a5ffc0c99dfdddc458772e4022db4fd3b1477` (on top of 7ab5aee), authored by choinickolas@gmail.com. Not pushed, no PR opened.
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-012-upgrade-dependencies`

## Files touched in this pass (commit 623a5ff)
- `next-env.d.ts`: no longer tracked (`git rm --cached`).
- `.gitignore`: adds `next-env.d.ts` and `/AGENTS.md`.
- `vitest.config.ts` -> `vitest.config.mts`: `git mv`, content unchanged (100% rename).
- `tsconfig.json`: adds `"**/*.mts"` to `include`. `next build` keeps the file as it is.

Total branch diff vs 6013fcc: `.gitignore`, `components/layout.js`, `next-env.d.ts` (deleted), `package-lock.json`, `package.json`, `pages/index.js`, `tsconfig.json`, and the vitest config rename. Nothing changed under `acceptance/`, in `playwright.config.ts` or in `docs/api/openapi.json`.

## Acceptance criteria (all re-run on 623a5ff, Node v22.17.0)
- `npm ci`: OK, 0 vulnerabilities. The lockfile is unchanged from 7ab5aee (v3; next 16.4.3, react/react-dom 19.3.1, typescript 7.0.2, vitest 5.0.5, @types/node 24.x).
- `package.json`: unchanged from 7ab5aee and matches the target table. `@types/react-dom` is in devDependencies and `engines.node` is `>=22.12.0`.
- `npx next build`: OK. It lists `/`, `/404`, `/api/fight`, `/apps/combat-simulator`, `/apps/starcraft-helper`, regenerates `next-env.d.ts`, and leaves `git status` clean. `tsconfig.json` is stable.
- `npx tsc --noEmit`: exit 0 without `next-env.d.ts` (deleted, no `.next`). It also exits 0 with the file present (after `next build`).
- `npx tsc --listFilesOnly | grep -c vitest.config.mts`: 1.
- `npm test`: 4 files, 57/57 passed. `grep -c CommonJS` on the output gives 0.
- Two consecutive `npm run acceptance` runs:
  - Run 1 started cold (`.next` and `next-env.d.ts` removed): **209 passed** (9.9s).
  - Run 2 followed right after: **209 passed** (9.7s).
  - Neither log has a flaky or retry line.
  - After both runs, `AGENTS.md` and `next-env.d.ts` exist on disk, but `git status --porcelain` is empty.
- `git grep -nE "retries|test\.(skip|fixme)" -- acceptance playwright.config.ts`: prints nothing.
- `npx playwright test fight-api-contract fight-api-spec-surface`: 61 passed. `docs/api/openapi.json` is unchanged vs 6013fcc.
- `git grep -n -A1 "<Link" -- pages components | grep -c "<a"`: 0.
- `git ls-files next-env.d.ts AGENTS.md`: prints nothing.
- `git grep -n "vitest.config"`: only `vitest.config.mts:1` (its own import).
- `npm run dev` (port 3123, from a state with `AGENTS.md` and `next-env.d.ts` deleted):
  - `/`, `/apps/combat-simulator` and `/apps/starcraft-helper` return 200.
  - It regenerated `next-env.d.ts` (the version that imports `./.next/dev/types/routes.d.ts`) and `AGENTS.md`. `git status --porcelain` stayed empty.
- The OpenAPI example (`attack 3/1/1`, `defend 3/1/1`, `battles 20`) POSTed to `/api/fight` under dev returns 200 with keys battles/hitsPerRound/outcomes/rounds/survivors and outcomes attacker/defender/tie. This matches the shape recorded on main in report 1.
- Browser click-through against `npm run dev` (throwaway Playwright script in the scratchpad, not committed):
  - `/` has no nested anchors, and the two app links go to `/apps/combat-simulator` and `/apps/starcraft-helper`.
  - The header links on the app pages go to `/`.
  - Selecting armies and clicking Fight! posts to `/api/fight` and gets 200, and Fighting Stats renders.
    - The first try left the army selects at their default values; that POST returned a validation 400 and no results rendered, so the script was fixed and run again. That 400 comes from the form's own validation and is not a regression.
  - Both StarCraft Randomize buttons change the output.
  - No console errors or warnings and no page errors on the three pages.
- No `app/` directory and no `next.config.*`.
- Vercel check: not run here, because the branch is not pushed. Tech-lead pushes and confirms "Vercel – wotr-combat-simulator" on Node 24.x.
- Codegen: not configured. Lint (`tsc --noEmit`): see above.

## Invariant check
- S2 holds: both apps are still linked from `/`, and both app pages render inside Layout with the header link to `/`.
- H1-H3 hold: `pages/apps/starcraft-helper.js` is untouched, and both Randomize buttons work.
- W1 and W2 hold: nothing changed under `lib/`, `components/apps/` or `pages/api/`. 57 unit tests and 209 acceptance specs pass.

## Processes
I started the dev server for the `npm run dev` checks and then stopped it. No `next dev`/`next-server` process is left and nothing is listening on 3000 or 3123. Playwright's `webServer` started and stopped the acceptance servers itself.

## PR description draft (for tech-lead)

```markdown
## Summary
Upgrades the site to current stable majors: Next 16.4, React 19.3, TypeScript 7.0, Vitest 5.0, @types/react and
@types/react-dom 19.3, @types/node 24, Bootstrap 5.3.8, classnames 2.5.1. The lockfile is regenerated (lockfileVersion 3).
`engines.node` is set to `>=22.12.0` (Vitest 5 needs `^22.12 || ^24 || >=26`; Next 16 needs >= 20.9). Production on
Vercel runs Node 24.x.

Code changes forced by the upgrade:
- Next 16 rejects `<Link>` with an `<a>` child at render time. The four links in `pages/index.js` and
  `components/layout.js` now put `href`/`className` on `<Link>` directly.
- TypeScript 7 rejects `target: "es5"` and `moduleResolution: "node"`. They are now `es2017` and `bundler`. `next build`
  set `jsx` to `react-jsx`.
- `next-env.d.ts` is untracked and gitignored, because Next 16 rewrites it on every `next build` and `next dev`.
- `/AGENTS.md` is gitignored, because `next dev` writes it at the repo root when it detects an AI coding agent.
- `vitest.config.ts` is renamed to `vitest.config.mts` with unchanged content, so Vitest 5 loads it as ESM without
  warning (the package has no `"type": "module"`). `tsconfig.json` includes `**/*.mts` so it stays type-checked.

No `app/` directory or `next.config.*` was added. Nothing under `acceptance/`, `playwright.config.ts` or
`docs/api/openapi.json` changed.

## Test plan
- `npm ci`, `npx tsc --noEmit`, `npx next build` (all five routes).
- `npm test`: 57/57.
- `npm run acceptance`, two consecutive full runs: the first from a cold start (no `.next/`) passed 209/209, and the
  second passed 209/209. All specs passed on the first attempt, with no retries configured.
- `npx playwright test fight-api-contract fight-api-spec-surface`: 61 passed.
- Manual check under `npm run dev`:
  - the landing links, the header link back to `/`, and the combat simulator Fight! results all work;
  - both StarCraft Randomize buttons work;
  - there are no console errors or hydration warnings on `/`, `/apps/combat-simulator` or `/apps/starcraft-helper`.

## Cold-run acceptance timeout (not reproduced, no harness change)
A trial upgrade in a scratch copy once timed out on its first cold acceptance run. The failing test was
`combat-simulator-battles.spec.ts` "a valid submit posts battles and renders every results section with the response
numbers", which timed out waiting for the `/api/fight` response after clicking Fight!. It passed on rerun. It did not
reproduce on this branch:
- 8 cold full runs (`.next` removed before each): 209/209 each.
- 3 cold full runs with 16 CPU-burning processes on a 12-core machine: 209/209 each.
- 3 runs in the trial's order (fresh `next build`, then `npm run acceptance`): 209/209 each.
- 1 cold `--repeat-each=10` run: 2090/2090.
- Fight! clicked as soon as it was visible (`waitUntil: 'commit'`), with Chromium CPU throttling at 1x, 10x and 40x.
  Every click posted to `/api/fight` and none fell back to a native form submit. Next 16 dev keeps the body hidden
  until the client runtime loads, so a click before hydration is about 25 ms of exposure at most.
- The first `/api/fight` request after a cold start answered in 82 ms, against a 60 s test timeout.

Because the timeout could not be reproduced or tied to a cause, no change was made to the acceptance harness or the
Playwright config for it. If it recurs, it will be tracked separately.
```

## Out-of-scope findings
- `ARCHITECTURE.md` "Stack" still says Next 12 / React 18 / TS 4.7. This is already tracked as SGS-023.
- In dev, Next 16 logs a `scroll-behavior: smooth` message in the server log. It is cosmetic and was already excluded by the ticket.
- The worktree's local `main` ref is stale relative to `origin/main`. A `git diff main` shows unrelated acceptance files, so diff against 6013fcc or `origin/main` instead.
