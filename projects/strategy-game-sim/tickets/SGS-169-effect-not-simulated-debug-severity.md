# SGS-169: Move "effect is not simulated" research notes to a new `debug` severity

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: standard
- **Invariants**: A3 (same build order and data give the same timings; notes must stay a pure function of the order and data)
- **Unverified assumptions**: none
- **LOC estimate**: 40 (`lib/aoe4-build-order/model.ts` severity type and list, `research.ts` two literals, `messages.ts` filter; tests, docs and OpenAPI excluded)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md bullet "AoE4: move 'effect is not simulated' research notes to a new `debug` severity" (owner request in chat, 2026-11-15)

## Context

The AoE4 build-order sim is mostly an economy simulator, so notes such as "bloomery: its effect on meleeAttack is not simulated; it still costs resources and queue time." are noise in the results. They are emitted by `researchNotes` in `lib/aoe4-build-order/research.ts` at severity `info` and shown behind the page's info toggle. A new lowest severity `debug` lets them stay in the API response while the page stops showing them. Cost and queue-time handling of the research steps does not change.

## Scope

Not a pure no-visible-change chore: the owner sees the research notes disappear from the page's info list, and API clients see a new `severity` value. Simulation timings, costs and queue time are unchanged.

- `lib/aoe4-build-order/model.ts`: add `debug` to the `Severity` type and to `SEVERITIES`, ordered after `info` (the list is most severe first).
- `lib/aoe4-build-order/research.ts` `researchNotes`: emit both `tech-effect-ignored` and `tech-effect-unmodeled` notes at `debug`. Codes, messages, `properties` and ordering stay as they are.
- `components/apps/aoe4-build-order/messages.ts` `resultMessages` (and the UI that consumes it: `results.tsx`, `message-lists.tsx`): `debug` messages are not rendered on the page. They do not appear in the warnings list, the info list, or the info toggle's count and label, and the page offers no toggle or other control to show them. Check that nothing else on the page lists notes by severity.
- `docs/api/openapi.json`: the `Severity` schema enum gains `debug`; the `BuildOrderNote` `severity` description ("every note is info") and the `Severity` description ("No result item is error today...") are updated. The `node-depleted` wording and the example with `severity: "info"` stay true. `acceptance/aoe4-simulate-api-contract.spec.ts` pins the schema enum to `SEVERITIES`, so the two must agree.
- Docs under `docs/` (verified at origin/main): fix every statement the change makes untrue, by file:
  - `docs/aoe4-build-order.md`, Severity section: the sentence listing `error`, `warning` or `info`, the `tech-effect-ignored`/`tech-effect-unmodeled` row of the table, and the closing sentence saying the page lists `info` messages behind a toggle. The Results table row for `node-depleted` is still true.
  - `docs/aoe4-build-order-format.md`, Outputs: the `notes` bullet ("Every note has `severity: 'info'`") and the `warnings` bullet's list of severities.
  - `docs/aoe4-build-order-ui.md`: the Messages paragraph after the chart table (the sentences on the `info` toggle and its label) and the sentence near the top of the page doc saying gold run-outs and other info notes are in the collapsed info list in Results (check that it stays true: research notes are no longer among them).
  - Grep `docs/` for `severity`, `info` and `note` to find any others.
- Tests that pin the old behavior get the new expected value, for example `lib/aoe4-build-order/research.test.ts` ("marks every note info and none error" and "marks info the note of every tech in the data"), `lib/aoe4-build-order/model.test.ts` (`SEVERITIES`), `components/apps/aoe4-build-order/messages.test.ts`, `acceptance/aoe4-simulate-api-research.spec.ts`, and `lib/aoe4-build-order/research.acceptance.test.ts` if it asserts severity. Any acceptance spec that counts the page's info messages from `result.warnings` plus `result.notes` (for example `acceptance/aoe4-build-order-inline-issues.spec.ts`) must count only what the page shows. Any other test keeps its expected value.

**Out of scope:** any control on the page to reveal `debug` messages (the owner decided they are hidden entirely, so the API response is the only place they appear); changing the wording or codes of the notes; the other severities of `node-depleted` and the warnings; research cost and queue-time handling.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] Every note `researchNotes` returns, for both `tech-effect-ignored` and `tech-effect-unmodeled`, has severity `debug`, with its code, message and properties unchanged; a unit test over every technology in the data fails if any note keeps `info`.
- [ ] `SEVERITIES` lists `debug` after `info`, and `docs/api/openapi.json` `Severity` enumerates the same values in the same order (the existing contract spec passes).
- [ ] A `debug` message from `result.notes` is not rendered on the page: a test of `resultMessages` (or the rendered results) with a `debug` note next to `warning` and `info` messages fails if the debug message appears in either list or counts toward the info toggle's label.
- [ ] A run whose only messages are `debug` notes shows no info toggle and no warnings list. (respec 1)
- [ ] The page has no control (toggle, button, link) that reveals `debug` messages; a test of a result containing `debug` notes fails if any such control renders. (respec 1)
- [ ] A POST to the simulate route for a build that researches an ignored-effect tech (for example bloomery) still returns the note in `notes` with severity `debug`.
- [ ] Research steps cost resources and queue time exactly as before: the existing research tests on cost and timing keep their assertions.
- [ ] The simulation timings for a build order with research steps are unchanged (pre-existing timing tests keep their assertions).
- [ ] No file under `docs/` says research notes are `info` or that the page shows every message behind the info toggle; the docs describe the `debug` severity and that the page hides it. (respec 2)
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-15

- Underspecified: whether the page offers any way to see `debug` messages (owner question Q105).
- Changed: owner answered hidden entirely; Scope, out-of-scope note and a new criterion state no control exists; Open question deleted.
- Existing branch work still stands: none existed beyond the ticket.

## Re-spec 2 - 2026-11-15
- Underspecified: Scope put statements in `docs/aoe4-build-order.md` that live in `-format.md` and `-ui.md`, and the docs criterion named only two files.
- Changed: Scope names each doc file and its statements; the docs criterion covers every file under `docs/`.
- Existing branch work still stands: none existed beyond the ticket.
