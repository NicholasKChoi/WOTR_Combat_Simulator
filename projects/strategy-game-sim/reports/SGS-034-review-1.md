# SGS-034 review 1

- Branch: sgs-034-aoe4-build-order-page, tip 1bfff2a (local only; not on origin at review time), base main 25a4e18 (= origin/main)
- Mode: full review
- Verdict: **APPROVE**

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Page in Layout, h1/title, landing link, landing spec | pass | `pages/apps/aoe4-build-order.tsx:71-78`; `pages/index.js:33-36`; `acceptance/landing.spec.ts:6`; landing specs pass |
| 2 | Build JSON, owner source, transcription, omissions in README and PR | pass for the code; **unchecked** | `english-1tc.json` present, source correct, README "Prebuilt builds" lists the 0:40 omission and "No step was removed". I compared the build with the live guide (I loaded it in headless Chromium and dumped the table with icon names): English, Season 13, and every row maps to a step (times 20/40/60/140/230/240/300/315/360/420 s, the abbey at 9 vils, horticulture and double-broadax at 5:00, spearman and longbowman at 5:15, steeled-arrow and iron-undermesh at 7:00). Left unchecked because no PR exists yet, so the PR-description half can't be verified. |
| 3 | builds.test.ts passes; mutation check recorded in the PR | tests pass; **unchecked** | I re-ran both mutations: `walkSeconds: 4.5` fails the round-trip test, and `nonexistent-unit` fails validate and simulate. Left unchecked because "recorded in the PR" is pending. |
| 4 | result-series.test.ts | pass | 7 tests, covering key, tier name, resource order, alignment through `toChartRows`, and no mutation |
| 5 | Prebuilt run draws all series | pass | Playwright passes. My own run of the default build got a 200 and drew every series |
| 6 | Pasted start + rally run | pass | Playwright |
| 7 | Invalid paste, 59, emptied duration, non-JSON | pass | Playwright. Also checked by hand: 300.5 gives a 400 with "inputs.durationSeconds: 300.5 is not an integer" |
| 8 | Legend toggle | pass | Playwright |
| 9 | Notes present and absent | pass | Playwright; live run shows steeled-arrow and iron-undermesh notes |
| 10 | networkidle + waitForResponse, no waitForTimeout | pass | grep finds nothing; every test uses `openPage` and `runSimulation` |
| 11 | No S1 or snapshot imports on the client | pass | grep is empty. `.next/static` has no `patchSource`, `walkSecondsCamp`, `aoe4guides` or tech ids |
| 12 | Docs | pass | `docs/aoe4-build-order.md` "### Page" sits under "## Outputs"; README table row and opening sentence are reworded; the stale-text grep finds nothing contradictory |
| 13 | tsc, npm test, acceptance, next build | pass | I ran all four: tsc is clean, 695/695 unit, 340/340 acceptance, and the build succeeds with the page as SSG |
| 14 | No invariant regressions | pass | see below |

## Invariants touched

- S1 holds. The page and components import only `lib/aoe4-build-order`, their own components and `components/layout`.
- S2 holds. The page is linked from `pages/index.js` and renders inside `Layout`.
- S3 holds. The only numeric client input is `durationSeconds`. It is sent unchecked and bounded by the route (59, 0 and 300.5 are each rejected with a 400).
- A1 holds. The build JSON holds user step inputs, not game numbers, and the README says so.
- A2 is not touched. The engine is unchanged.
- A3 holds. The page adds no randomness or clock to results.

## spec-checklist

- Contracts: test ids, series keys and the route path match design "Page test ids" and "Charts". `duration-seconds` is page-local, as the ticket says.
- Scope: nothing out of scope is implemented. No `golang/`, route, engine or chart changes.
- Open questions: no invented constants. The 1200 default comes from the ticket.
- Naming: fine.

## Implementer deviations

1. **Notes show `<code>{tech}</code>: {message}`.** Accepted. Item 5 says "each note's message", but the ticket's own Playwright case requires the id `fitted-leatherwork`, and the message carries only the display name. The doc says the list shows "technology id and message". The visible result reads "steeled-arrow: Steeled Arrow: ...", which is redundant but harmless. The engine-side wording is out of scope.
2. **`noValidate`.** Accepted. Without it, `step={1}` would block 4.5 in the browser. With it, every duration reaches the route and the route's message is shown, which matches the item 4 rule of "no client-side check".
3. **`home={false}`.** Accepted. It is needed for tsc, because `layout.js` destructures `home` with no types, and it renders the same as the combat page's `<Layout>`.
4. **Omitted 0:40 "termina house".** Accepted. The guide row is "[rally] [villager] termina [house] después a [mining-camp] [resource_gold]", and nothing in v1 adds a builder to a building already under construction. Non-blocking note: no guide row explicitly builds the mining camp. The `build mining-camp from gold then gold` @0:40 step is inferred from the "a [mining-camp][gold]" destination icon. That is reasonable, since gold villagers need a drop-off, and the README states it. The owner may want to confirm it.
5. **Extra Playwright specs** ("a failed run after a successful one removes the charts", "a non-JSON failure shows the HTTP status message"). Accepted. Both back ticket item 6 and criterion 7, and both can fail for real reasons (stale `result`, or a wrong fallback message).

## Bot reconciliation

`reviewBot.cli` is empty and no `rulesFile` is set, so no bot ran.

## Linter

`npx tsc --noEmit` is clean. There is no ESLint config.

## Conventions

- The page mirrors `pages/apps/combat-simulator.js:13-21,28-55`: an `errorMessage` helper with an empty `catch {}`, the same HTTP-status fallback wording, the "Please try again." network message, `setResult` cleared on failure, the `cn(utilStyles.headingMd, 'container')` section and the `<h2 className="border-bottom">Results</h2>`.
- The components follow `components/apps/aoe4-build-order/line-chart.tsx` style: 4-space indent, no semicolons, named exports, an interface for props.
- `lib/aoe4-build-order/builds.ts` follows the `data.ts` style (semicolons, 2-space indent, static JSON import, `as unknown as` cast).
- The Playwright spec reuses `SIMULATE_PATH` from `acceptance/helpers.ts:48`, and the vitest layout matches the sibling `*.test.ts` files.
- Hygiene: no ticket ids or factory pointers in the diff. The commit author is choinickolas@gmail.com. `git diff --check` is clean.

## Correctness

- All route 400s carry a non-empty `issues` array (`pages/api/aoe4-build-order/simulate.ts:51,65`), so the HTTP-status fallback for a 400 only covers Next's plain-text malformed-JSON 400.
- Double submit: the button is disabled while running, and implicit submission (Enter in the number input) does nothing while the default button is disabled. Enter submits when idle (checked: 200).
- `issues` is cleared at the start of a run. `result` is cleared on every failure path. `running` is reset in `finally`.
- Note keys `${step}-${code}` are unique: `researchNotes` emits at most one note per step. There were no React key or hydration warnings in the browser console during a full click-through.

## Non-blocking notes

- `docs/aoe4-build-order.md:574-575` says "Any other failure shows 'The simulation could not be run (HTTP <status>).'" A network failure (fetch rejects) shows "The simulation could not be run. Please try again." instead (`pages/apps/aoe4-build-order.tsx:63`). The doc could say "any other HTTP failure".
- The mining-camp step inference (deviation 4 above) is for the owner to confirm, if they care about fidelity.
- Manager: the PR body must carry the omission list and the mutation record (criteria 2 and 3 stay unchecked until it does). No "engine does not complete it" removals exist, so there is no out-of-scope engine finding to report there.

## Out-of-scope findings

- `lib/aoe4-build-order/research.ts:86,94`: note messages use display names (`entry.name`) rather than ids, so the page shows both. This repeats the implementer's finding.

## Coverage

- Reviewed every file in the diff (13 files).
- Read siblings: `pages/apps/combat-simulator.js`, `components/layout.js`, `components/apps/aoe4-build-order/line-chart.tsx`, `lib/aoe4-build-order/{api,model,data,research}.ts`, `pages/api/aoe4-build-order/simulate.ts`, `acceptance/helpers.ts`, `ARCHITECTURE.md`.
- REPO.md "Every diff": I ran `next build`, then loaded the page and the landing page on `next dev` and clicked through (default run, notes, decimal duration, Enter submit, landing link).
- REPO.md "Shared code" (`pages/index.js`): the only change is an added `<li>`. The landing spec covers all three links, and the new-app layout follows ARCHITECTURE "Adding an app".
- The combat simulator and StarCraft sections are not touched.
- I could not review the PR description, because no PR exists.
- All processes I started are stopped, and port 3977 is free.
