# SGS-012 implementer report

Status: **needs_spec**. Scope item 4 (the cold-run flake) could not be done as written. Everything else is done and committed.

- Ticket: SGS-012 Upgrade npm dependencies to current stable majors
- Branch: `sgs-012-upgrade-dependencies` (from `origin/main` 6013fcc)
- Tip: `7ab5aeea6cfdc4019b2ddfafb25324311d70c728`, authored as choinickolas@gmail.com. Not pushed.
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-012-upgrade-dependencies`

## Files touched
- `package.json`: target caret ranges from the ticket table, `@types/node ^24`, `@types/react-dom ^19.3.0` in devDependencies, `engines.node >=22.12.0`.
- `package-lock.json`: rebuilt from scratch with one `npm install` (lockfileVersion 3). The root `name` was put back to `WOTR_Combat_Simulator` (npm had set it to the worktree folder name). Resolved versions: next 16.4.3, react/react-dom 19.3.1, typescript 7.0.2, vitest 5.0.5, @types/node 24.19.2, @types/react and @types/react-dom 19.3.0. `npm audit`: 0 vulnerabilities.
- `pages/index.js`: the 2 app links are now `<Link href>text</Link>`.
- `components/layout.js`: the header image link is now `<Link href="/"><Image/></Link>`. The title link is now `<Link href="/" className={utilStyles.colorInherit}>`.
- `tsconfig.json`: `target` es2017, `moduleResolution` bundler, `jsx` react-jsx (set by `next build`), and the `include` array reformatted by Next. A second `next build` leaves it unchanged.
- No files under `acceptance/` or in `playwright.config.ts` changed. No `app/`, no `next.config.*`.

## Gates (run from the worktree)
- `npm ci`: OK.
- `npx next build`: OK. It lists `/`, `/404`, `/api/fight`, `/apps/combat-simulator`, `/apps/starcraft-helper`. Running it again does not change tsconfig.
- `npx tsc --noEmit` (lint): exit 0.
- `npm test`: 4 files, 57/57 passed. No tests were added or edited.
- Codegen: not configured.
- Acceptance: run 1 started cold (`.next` removed) and passed 209/209. Run 2 followed right after and passed 209/209. No retries are configured.
- `npx playwright test fight-api-contract fight-api-spec-surface`: 61 passed. `docs/api/openapi.json` is unchanged.
- `git grep -nE "retries|test\.(skip|fixme)" -- acceptance playwright.config.ts` prints nothing.
- `git grep -n -A1 "<Link" -- pages components | grep -c "<a"` prints 0.
- A throwaway Playwright check (deleted afterwards) gave these results:
  - The OpenAPI example POST returns 200 with keys battles/outcomes/rounds/survivors/hitsPerRound and outcomes attacker/defender/tie.
  - No anchor is nested inside another on `/`, `/apps/combat-simulator` or `/apps/starcraft-helper`.
  - The header link goes to `/`.
  - Submitting with Fight! renders results.
  - The StarCraft Randomize buttons change the output.
  - No browser console errors or warnings and no page errors on the three pages.
- The Vercel check needs a push, which was not done. It is still pending.

## Why item 4 is needs_spec
The ticket asks me to reproduce the flake, confirm its cause and fix that cause in the harness. I could not reproduce it, and the evidence points away from both suspected causes. Without a fix, two consecutive green runs already pass.

Runs that never reproduced the timeout:
- 8 cold full runs (`.next` removed before each): 209/209 each time.
- 3 cold full runs with 16 CPU-burning processes on a 12-core machine: 209/209 each time.
- 3 runs that followed the trial's order (fresh `next build`, then `npm run acceptance`): 209/209 each time.
- 1 cold run of `--repeat-each=10`: 2090/2090.

Evidence against a pre-hydration click:
- In Next 16 dev, the page body is hidden (`data-next-hide-fouc`) until the client runtime loads. Playwright cannot click a hidden element. When I measured, the gap between the page becoming visible and the form getting its React props was about 25 ms. `networkidle` arrived about 470 ms after hydration.
- I clicked Fight! as soon as it became visible (`goto` with `waitUntil: 'commit'`), with Chromium CPU throttling at 1x, 10x and 40x. All 5 tries still sent `POST /api/fight`, and none fell back to a native GET submit.

Evidence against a slow cold compile of `/api/fight`: the first request after a cold start answered in 82 ms, against a 60 s test timeout.

Adding a hydration wait now would hide an unconfirmed cause rather than fix it. The ticket and the spec gate both rule that out. The spec needs one of these decisions:
- (a) Drop the "name the root cause and fix it in the harness" criterion and record the non-reproduction evidence above. The branch is then ready for review as it is.
- (b) Accept a defensive hydration wait as a harness change without a confirmed cause, and say what signal it should use. I found no framework signal: `window.__NEXT_HYDRATED` is only set when `__NEXT_TEST_MODE` is set. That leaves a `data-hydrated` marker in the page.

## Invariant check
- S2 holds: both apps are still linked from `pages/index.js`, and both app pages still render inside Layout with the header link to `/`.
- H1-H3 hold: `pages/apps/starcraft-helper.js` is untouched, and its Randomize buttons work.
- W1 and W2 hold: there are no changes under `lib/`, `components/apps/` or `pages/api/`. The 57 unit tests and the 209 acceptance specs pass.

## Out-of-scope findings
- **`next-env.d.ts` keeps changing.** Next 16 rewrites this tracked file on every run: `next build` makes it import `./.next/types/*.d.ts`, and `next dev` (including acceptance runs) makes it import `./.next/dev/types/*.d.ts`. I restored the `main` version before committing. `tsc --noEmit` passes with either version, with or without `.next`. Next's current docs suggest gitignoring and untracking this file. Every agent that runs build or acceptance will see it modified until that happens.
- **Next writes an `AGENTS.md` at the repo root.** `next dev` creates it when it detects an AI coding agent (`node_modules/next/dist/server/lib/app-info-log.js`, `syncAgentRulesForDev`). The file asks to be committed. I deleted it and did not commit it. Factory agents running acceptance will keep getting it until it is gitignored or turned off by config.
- **Next 16 dev logs a scroll-behavior message.** On page loads the dev server log shows a forwarded browser message: "Detected `scroll-behavior: smooth` on the `<html>` element ... add `data-scroll-behavior="smooth"`". It is not a console error or warning in the browser. It is cosmetic and dev-only.
- **Vitest 5 config warning.** It warns that `vitest.config.ts` uses ESM syntax in a file loaded as CommonJS (because there is no `"type": "module"`). The tests run fine.
- **`ARCHITECTURE.md` "Stack" is out of date.** It still says Next.js 12, React 18 and TypeScript 4.7. It is a styleSources file the ticket does not name, so it should be updated in On merge or a follow-up.
