# SGS-045 review 1

Verdict: **REQUEST CHANGES** (one blocking test/contract finding; code is otherwise correct)

Branch `sgs-045-aoe4-severity-message-lists`, tip 5ecb2c8 (1 commit on origin/main 77fa279). The branch is not pushed to origin; reviewed from the local branch ref in a detached worktree.

## Blocking findings

1. `acceptance/aoe4-build-order.spec.ts:210-258` - test/contract - Acceptance criterion 2 requires "with none, `simulation-warnings` has count 0 (Playwright, patched response)". No test asserts that on a successful run. The only `simulation-warnings` count-0 assertion (line 256) is on a 400, where `Results` does not render at all, so it cannot catch a regression in `WarningMessages`. Evidence: I removed the `if (messages.length === 0) return null` guard from `WarningMessages` (`message-lists.tsx:16`), and all 17 tests in the AoE4 page spec still passed. Why it matters: "absent when there is none" is a design rule (M3.md "page lists" row; test-id table line 480), and right now nothing checks it. Direction: add a 200 run through `page.route` + `route.fetch()` whose body has no `warning`-severity entries (for example `warnings` holding only an `info` entry, or `warnings: []`), then assert `simulation-warnings` has count 0. Don't use an unpatched RALLY_PASTE run: the design says it will produce a `node-depleted` warning once SGS-038 lands.

## Spec gaps

None blocking. The open question (what happens to `error` severity) is still open. `resultMessages` drops `error` items, and since M3 never emits `error`, no criterion depends on it.

## File name deviation (`message-lists.tsx` vs `messages.tsx`)

The deviation is sound. The ticket asks for both `messages.ts` and `messages.tsx` in the same directory, and with `allowImportingTsExtensions` off, `./messages` resolves to only one of them. The ticket can't be done as written. No later ticket imports `messages.tsx`: I grepped `tickets/` for `messages.tsx`, `WarningMessages`, `InfoMessages` and `resultMessages`. SGS-055 and SGS-047 use only the test ids and `results.tsx`. **Manager action:** update the wording in `design/M3.md:91` (the "used by" column says `messages.tsx`), `design/M3.md:92` (module row) and `plans/M3-20261101.md:32` (outline K) to `message-lists.tsx`. Not a blocker.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | `resultMessages` per-severity order; empty result gives two empty lists | pass | `messages.test.ts` covers the split, warnings-before-notes, result order and the empty case. `messages.ts:11` concatenates `warnings` then `notes`. |
| 2 | warnings list shows exactly the warning messages with `data-severity`/`data-code`; with none, count 0 (Playwright, patched) | **fail** | The first half passes (spec:226-229). The count-0 half has no test (finding 1). Manual check: research run, `simulation-warnings` count 0. |
| 3 | info present: notes visible, list count 0, toggle `Show N info messages` / `Show 1 info message`, `aria-expanded="false"` | pass | spec:233-235 checks the plural form. I checked the singular `Show 1 info message` manually (fitted-leatherwork run). |
| 4 | toggle expands with every info message, `Hide info messages`, `aria-expanded="true"`; second click removes list | pass | spec:237-244 |
| 5 | expanded state persists after a second run; no-info run shows no `simulation-notes` | pass | spec:246-248 and spec:265. Mutation check: adding `setInfoExpanded(false)` after `setResult` in the page made the persistence test fail 3 of 3 times. |
| 6 | 400/failed run shows only `simulation-error` | pass | New test spec:251-258. Manual: 400 after an expanded run showed error only; the next successful run restored the expanded list. |
| 7 | existing notes test expands first; "no notes" test keeps `toHaveCount(0)` | pass | spec:205-207, spec:265 |
| 8 | `result.notes` no longer in `results.tsx`; no `data` imports | pass | `git grep result.notes -- components pages` matches only `messages.ts:11`. Both new files import only `./messages` and types from `lib/aoe4-build-order/model`. |
| 9 | doc no longer says notes are always listed; describes both lists | pass | `docs/aoe4-build-order.md:612-618`. Every sentence matches the code: warnings first, toggle texts, collapsed on load, persists across runs, message text only, no list when empty, and a 400 removes charts and lists. |
| 10 | No invariant regressions | pass | UI-only change. A1-A3 untouched (no `lib/` edit), S1 holds (imports stay inside the app), no new page (S2), no numeric input (S3). |

I left the ticket boxes unticked because the verdict is not APPROVE.

## Invariants touched

None in practice. I checked S1 (no cross-app import: holds) and A1-A3 (no simulation code changed: hold).

## Spec checklist

Names match the design test-id table (`simulation-warnings`, `simulation-notes`, `simulation-notes-toggle`, `simulation-notes-list`, `simulation-message`, `data-severity`, `data-code`) and the `Results` props `infoExpanded`/`onInfoToggle`. Nothing out of scope is touched: no engine, API, OpenAPI or `golang/` change. No invented constants.

## Lint and checks (Node 24.22.2)

- `npx tsc --noEmit`: clean
- `npm run lint:dup`: 0 clones
- `npm test`: 759 passed
- `npx next build`: ok
- `npm run acceptance`: 381 passed
- Manual flow with `next dev` at 1280x900 in Chromium: research run gave the collapsed toggle `Show 1 info message` with `aria-expanded=false` and no list. Expanding showed `Hide info messages` and the message text `fitted-leatherwork: its effect on meleeArmor is not simulated; ...`, without the old `<code>` prefix. A re-run kept it expanded. A 400 showed only the error. The next successful run was still expanded. Collapsing worked, and after a reload it started collapsed. In the screenshot, the alert sits above the charts and nothing overlaps at 1280px.

## Review bot

`reviewBot.cli` is empty and no rules file is set, so nothing to reconcile.

## Non-blocking notes

- `message-lists.tsx:24-32` - convention - `InfoMessages` declares its three props as an inline object type. The sibling multi-prop components use a named `interface ...Props` (`build-input.tsx:8`, `line-chart.tsx:6`, and `results.tsx:7` in this same diff). A maintainer would probably extract `InfoMessagesProps`.
- `acceptance/aoe4-build-order.spec.ts:246-248` - test - The second run returns the same patched body, so `toHaveCount(2)` can match the old DOM before the new response renders. It still caught a reset placed after `setResult` (3 of 3 runs, see criterion 5), but making the second response differ (for example, one more info entry, then expect 3) would remove the timing dependence.
- `message-lists.tsx:7` - `key={i}` uses the list index. That's acceptable for a list that is replaced wholesale on each run, and it matches the error list at `pages/apps/aoe4-build-order.tsx:93`.

## Coverage

I reviewed all 7 changed files plus their siblings (`build-input.tsx`, `line-chart.tsx`, the page, the spec helpers), design M3 (module table, test-id table, Behavior rules for messages), and the SGS-047/048/054/055 tickets for downstream references. REPO.md checklist done: the "Every diff" steps (build, dev page flow) and the AoE4 section (no copied helpers or constants; doc sentences checked against the code; 1280px check). There is no chart change in this diff. Nothing was left unreviewed. The dev server I started on port 3877 has been stopped and the port is free.
