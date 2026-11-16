# SGS-169 review 1

Branch sgs-169-effect-not-simulated-debug-severity, tip ec70f1d84d1aecabd6222555047892888585bb34, base origin/main. Full review.

**Verdict: REQUEST CHANGES** (one text-only doc fix). The code, tests and the other doc edits are correct.

## Blocking findings

1. `docs/aoe4-build-order.md:482-483` - contract (text) - Step 4 of `classifyTech` still says the `tech-effect-unmodeled` note is "worded with the tech's `baseId` so the user sees its effect is not simulated". After this change the page hides these notes and has no control to show them, so a page user never sees it. The note is visible only in the API response. Ticket Scope says to "fix every statement the change makes untrue", and the diff left this one. Direction: replace
   "`baseId` so the user sees its effect is not simulated (`admiralty: its effect is not simulated; it still costs resources and queue time.`)."
   with
   "`baseId` so an API client sees its effect is not simulated (`admiralty: its effect is not simulated; it still costs resources and queue time.`)."
   The replacement keeps these facts: the note is worded with the tech's `baseId`, the message text says the effect is not simulated, and the example message is unchanged (as are the rest of step 4 and the "With such an overlay row it is `supported`." sentence). Checked against `lib/aoe4-build-order/research.ts:116-122` (message `${entry.baseId}: its effect is not simulated; ...`, severity `debug`) and `components/apps/aoe4-build-order/messages.ts:12` (only `warning`/`info` reach the page).

## Spec gaps / for the manager (not NEEDS_SPEC)

- The ticket's Type is **Chore**, but Scope says outright that the owner sees a change (research notes leave the page's info list, and the API gains a `severity` value). Pre-existing test assertions also change (research.test.ts, model.test.ts, the API research acceptance spec), which a Chore does not allow. Read strictly, review.md calls this NEEDS_SPEC ("it is not a Chore"). I did not return that verdict because the ticket's Scope and criteria decide every behavior explicitly, and the code matches them. The practical gap is routing: acceptance-test does not run on a Chore, so no one has run the edited `acceptance/aoe4-simulate-api-research.spec.ts` (the implementer says it was not run). Manager action: either retype the ticket (Feature/Task) so acceptance-test runs on this branch, or make sure the suite gate runs `commands.acceptance` before merge.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Every research note is `debug`, code/message/properties unchanged; unit test over every tech fails on `info` | pass | `research.ts:112,121` change only the severity literal. `research.test.ts` "marks debug the note of every tech in the data" filters every tech/upgrade in the data, asserts `notes.length > 1`, then asserts no non-`debug` note. Reverting either literal fails it (the implementer's mutation run, and confirmed by reading). |
| 2 | `SEVERITIES` lists `debug` after `info`; OpenAPI `Severity` enum matches | pass | `model.ts:68-70`; `openapi.json` enum `error, warning, info, debug`; `model.test.ts` pins the order. The contract spec pins the enum to `SEVERITIES` (by reading; acceptance not run). |
| 3 | Test with a `debug` note beside `warning`/`info` fails if debug appears in either list or counts toward the toggle label | pass | `messages.test.ts` "leaves debug messages out of both lists" (debug in both `warnings` and `notes`, exact list equality) and "counts only info messages in the toggle label..." (`Show 1 info message<`). |
| 4 | Debug-only run shows no info toggle and no warnings list (respec 1) | pass | `messages.test.ts` "renders no toggle, list or control..." renders `WarningMessages` + `InfoMessages` (expanded) and asserts the exact markup `<div></div>`. |
| 5 | No control reveals `debug` messages (respec 1) | pass | Same test (exact markup means no button renders). `grep` finds no other consumer of `severity`/`notes` in `components/` or `pages/`. |
| 6 | POST to simulate with bloomery returns the note with `debug` | pass | `acceptance/aoe4-simulate-api-research.spec.ts` asserts `debug` (read, not run). In the live inspection, the page's own POST for the Knight/Longbow build returned 8 notes, all `debug`. |
| 7 | Research cost and queue time unchanged | pass | No cost or timing test is edited. Only severity assertions changed. `research.test.ts` and `research.acceptance.test.ts` pass (90 tests in the 4 touched or related files). |
| 8 | Timings unchanged | pass | Only severity literals change in `lib/`, and notes do not feed the event loop (`simulate.ts:1058` only attaches them). |
| 9 | No doc says research notes are `info` or that the page shows every message behind the toggle; docs describe `debug` and its hiding (respec 2) | pass | `aoe4-build-order.md` Severity section, `-format.md` notes and warnings bullets, `-ui.md:148`, openapi descriptions. `-ui.md:57` ("Gold run-outs and other info notes...") stays true. See blocking finding 1 for the one related sentence the scope wording also covers. |
| 10 | No INVARIANTS regressions | pass | See below. |

## Invariants touched

- A1 (game numbers from data): not affected. No numeric literal is added. Holds.
- A2 (resources never negative): no spend path changes. Holds.
- A3 (same order and data, same timings): `researchNotes` is still a pure function of the order and the data. The purity tests in `research.test.ts` and `research.acceptance.test.ts:343-344` pass. Holds.
- S1-S3, W*, H*: paths not touched.

Spec checklist: Contracts (field and enum names consistent with model and OpenAPI; CONTEXT.md Key surfaces names no severity), Scope (nothing out of scope; no `golang/`), Naming (`debug` is used, not an aspirational value: research notes emit it), A1-A3: all hold.

## Linter

`npx tsc --noEmit && npm run lint:dup`: clean (0 clones).

## Bot reconciliation

No `reviewBot.cli` and no `rulesFile` in REPO.md, so this section is skipped.

## UI inspection

The diff changes no component code, but it changes what the Results panel renders, and the REPO.md "Every diff" checklist asks for a page load. I served the task checkout with `npx next dev` on port 3877 and ran `inspect.cjs` (Playwright) at 375 px and 1280 px. It loaded `/apps/aoe4-build-order`, selected "ENG Knight/Longbow (King's Palace)" with a duration of 1800, opened Results, and expanded the info toggle.
- At both widths the response had 8 notes, all `debug`, plus 3 `info` warnings. The toggle read "Show 3 info messages". Once expanded, it listed 3 messages, all `data-severity="info"`. The text "is not simulated" did not appear anywhere on the page. No page errors.
- I looked at the 375 px screenshot. The Results panel and toggle render normally.
- No overflow or wrap checks were run: the diff adds no markup or styles.
- The server was stopped (port free).

## Non-blocking notes

- `components/apps/aoe4-build-order/messages.test.ts` "counts only info messages in the toggle label...": `not.toContain('note 1')` and `not.toContain('note 3')` cannot fail, because the test renders with `expanded: false`, so no message text is ever in the markup. The label assertion carries the test. Suggest rendering with `expanded: true` for the two `not.toContain` checks (or dropping them) in the same rework.
- `docs/aoe4-build-order-ui.md:148`: the added sentence makes this one line about 200 characters long. The surrounding paragraph wraps near 110 characters. Cosmetic.
- `docs/aoe4-build-order-format.md:418-419`: the `warnings` severity list now names `debug`, although no warning carries it. This is consistent with the type (it already listed `error`, which no warning carries), so it is fine.

## Coverage

Reviewed all 10 changed files, plus `messages.ts`, `message-lists.tsx`, every `severity`/`notes` consumer in `components/`, `pages/` and `lib/aoe4-build-order/`, the acceptance specs that filter on severity (inline-issues, m3/m4 flow, knight-longbow page/API, spear-longbow), and `research.acceptance.test.ts`. I ran the unit tests for the touched files (4 files, 90 passed), tsc and lint:dup. I did not run `commands.acceptance` or `next build` (by rule; the implementer reports `next build` succeeded). The live dev-server page load stands in for the "load each touched page" step. REPO.md review checklist: I applied "Every diff" and "AoE4 build order". No helper or constant was copied. The engine rule change matches `docs/aoe4-build-order.md` apart from finding 1. Screenshots were taken at 375 and 1280 px only. The 360/768 widths in the checklist do not apply, since no layout changed.
