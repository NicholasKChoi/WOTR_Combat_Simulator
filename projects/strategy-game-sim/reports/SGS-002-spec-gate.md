# SGS-002 spec-readiness gate

Base: origin/main d54af2e. Ticket: tickets/SGS-002-playwright-acceptance-harness.md.

## Verdict: NEEDS_SPEC

Three small gaps, all closable by the manager without the owner. Everything else checks out.

## Gaps

1. **Scope item 3 (landing spec) and AC 3 / AC 6 - "resolving with a 200" cannot be observed as written; AC 6 contradicts the h1 check.**
   `pages/index.js` uses `next/link`, so clicking is client-side navigation: no document response, so
   `page.click` gives no 200 status to assert. An implementer would guess (goto the href? waitForResponse on a
   JS chunk?). Separately, "showing its page `<h1>`" for starcraft-helper requires loading that page, while AC 6
   says no spec visits it "beyond the link resolving". Proposed fix: for each link, assert the `href`
   attribute equals the route and `request.get(href)` returns 200; then click and assert `page` URL and the
   `<h1>` ("Combat Simulator" / "Starcraft Helper"), with no interaction on the StarCraft page. Reword AC 6 to
   "no spec interacts with controls on /apps/starcraft-helper; loading it via the landing link and reading its
   h1 is allowed".

2. **Scope item 3 (fight-api spec) - valid body values unspecified.**
   Only the simulator spec is told to avoid 0-unit sides. With 0 regs+elts on a side, `rounds` is 0 and
   `averageAttackHitsPerRound` is NaN (serialised as null), so a "valid body" of zeros or an omitted field
   would fail the `survivor`/`rounds` assertion for a bad reason. Proposed fix: state that both sides have at
   least 1 regular or elite (e.g. 3 regs, 1 elite, 1 leader each, leaders <= 5, regs/elts <= 9 to match the form
   options), and whether values are sent as strings (as the form does) or numbers (`parseInt` accepts both).
   Pass `data:` as an object so Playwright sets JSON Content-Type.

3. **Scope item 3 (combat-simulator spec) - hydration race, flakiness risk not addressed.**
   Under `next dev` the first compile is slow. If `Fight!` is clicked before hydration, the form does a native
   submit (page reload with query string) and no results ever render. An implementer would hit this
   intermittently and guess at fixes. Proposed fix: say to start `page.waitForResponse` for `/api/fight`
   before clicking and assert on its 200, and to wait for hydration (e.g. `waitForLoadState('networkidle')`
   after `goto`) before selecting. Also note: use exact heading names; `getByRole('heading', {name: 'Results'})`
   would match the page's h2 "Results" as well as the h4s, so match "Army Results" and "Fighting Stats" exactly.

## Checks passed

- Grounded scope: `pages/index.js` (links "Combat Simulator" and "Starcraft Helper", emoji outside the anchors),
  `pages/apps/combat-simulator.js` (h1 "Combat Simulator", submit input value "Fight!"),
  `components/apps/combat-simulator/army.js` (selects named `<key>-regs|elts|ldrs`, no ids; regs/elts 0-9,
  leaders 0-5), `results.js` (h4 "Army Results", "Fighting Stats"), `pages/api/fight.ts` (keys match),
  `starcraft-helper.js` (h1 "Starcraft Helper") all exist as described. `package.json` has only `dev`; no
  playwright in the lockfile (lockfileVersion 2). The ticket's claim that labels have no matching ids is true.
- tsconfig `**/*.ts` covers `playwright.config.ts` and `acceptance/*.ts`; `next build` will typecheck them too,
  which is covered by AC 8 (needs `@playwright/test` installed; Vercel installs devDependencies).
- Open questions: the directory name is now settled by ARCHITECTURE.md (`acceptance/`); delete that open
  question. The browser-download question is environmental, not a behavior decision, and the ticket says
  what to do (report as blocker). Not blocking the spec.
- Invariants: names S2 in the landing spec; S1, S3, W*, H* untouched (no production change). No contradiction.
  The H1-H3 are respected by not interacting with StarCraft.
- Contracts: `POST /api/fight` field names and `BattleStats` subset match CONTEXT.md Key surfaces. New npm
  script names are not a CONTEXT surface; REPO.md update is the stated H-1 action.
- Dependencies: none, correct. Size ~130 lines, no business logic. Diagram present and consistent.
- LESSONS.md (repo and project): both empty; nothing applies.
- Risk: `standard` is right. No strongModelTriggers hit (no invariant touched, no contract change, no
  production code, under 150 lines); `criticalPaths` is empty.

## Notes (non-blocking)

- Scope item 1: pin the port number in the ticket (or say "implementer's choice, recorded in config") and set
  `reuseExistingServer: false`, since AC 1 requires a self-started server. A developer's `next dev` on another
  port still shares the `.next` directory, so running both at once can corrupt the dev cache; mention it in
  the README note or the config comment only if it bites.
- Browsers are not installed on this host (`~/.cache/ms-playwright` absent). Node is v22.17, which current
  Playwright supports. The WSL2 system-library question remains for the implementer to answer by running
  `npm run acceptance:setup` and, if needed, `npx playwright install-deps` (needs sudo; report as a blocker).
- Pin a `@playwright/test` version compatible with the lockfile's npm 10 output; the lockfile is v2 so keep
  the same lockfileVersion when regenerating.
- A shared helper module is conditional ("only if two or more specs use them"). Fight API post and form fill
  are used by two specs only if the simulator spec reuses the valid body values; consider a one-line default
  armies constant so SGS-003/005 extend rather than copy.
