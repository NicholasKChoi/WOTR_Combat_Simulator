# SGS-074 review 2 (delta, rework 1)

Verdict: **REQUEST CHANGES**

I reviewed branch `sgs-074-aoe4-m4-docs-audit-playwright` at `103871ed84220bac1b47d5d237bc3cb45cc7aaec` in delta mode. The delta is `git diff 6465ca8..103871e`: one commit on `6465ca8e`, whose base is `origin/main` `e6cad358`. The branch is not on origin, so I reviewed the local ref in a detached worktree. I used Node v24.22.2.

## Blocking findings

1. `docs/aoe4-build-order.md:930` - contract (a doc sentence added in this diff that the code contradicts) - the new parenthetical says that each 400 issue `message` "starts with where it applies: a line, a step, a field path such as `inputs.durationSeconds`, or `request body`".
   - **"a line" never happens on a 400.** The 400 comes from the route. The route calls `checkBuildOrder` without `lines` (`pages/api/aoe4-build-order/simulate.ts:26`). As a result, `located()` (`lib/aoe4-build-order/schema.ts:550-551`) always uses the fallback label (`steps[i]` or `start`) and never uses `line N`. The doc already says so at line 589: "The route never sets `line`". So the new sentence contradicts both the code and the doc's own Issues paragraph. This is exactly the imprecision that rework item 4 asked to remove.
   - **The list also misses two real prefixes:**
     - `build order:` comes from `schema.ts:582` when the path is empty.
     - `request:` comes from `simulate.ts:22,25` for the removed `text` field and for a missing `buildOrder`. It is `request:`, not `request body:`. Only the non-object body uses `request body:` (`simulate.ts:37`).
   - **I checked this against the live route** on port 4221:
     - `{buildOrder:{...},inputs:{durationSeconds:0}}` returned messages starting `name:`, `start:`, `steps[0]:` and `inputs.durationSeconds:`.
     - `{buildOrder:5}` returned `build order: must be an object`.
     - `{text:"x"}` returned `request: text is no longer accepted; ...`.
     - No message started with `line`.
   - **Direction:** drop "a line" and name the real shapes. For example: "(each starts with what it applies to: a step such as `steps[2]`, a field such as `start` or `inputs.durationSeconds`, or `build order`, `request` or `request body` for the order or request as a whole; no route issue names a line)". A shorter version: "(each starts with the step or field it applies to, such as `steps[2]` or `inputs.durationSeconds`; the route never names a line)".

The rest of that sentence is accurate. After a 400, `setResult(null)` runs (page line 168), so the Results component unmounts. With a pin, `resultsEnabled = result !== null || pin !== null` (page line 104) stays true. `ComparePanel` still renders `unpin-run` (enabled) and `pinned-label`. It renders `CompareTable` only when `current !== null && pinned !== null` (`compare-panel.tsx:52`), so no table and no `compare-empty` appear. `pin-run` also renders, disabled; the doc does not mention it, which is fine.

## Spec gaps

None.

## Delta checks requested by the manager

1. **Unpin step can now fail: pass.** Spec line 80 asserts `localStorage.getItem('aoe4-build-order.pinned-run')` is null right after the `unpin-run` click and before the reload.
   - Mutation: I replaced `if (storage) clearStoredPin(storage)` in `unpin()` (page line 204) with `void storage`. The flow spec **failed** at line 80 (`expect(received).toBeNull()`; Received: the stored JSON with `"durationSeconds":1800`). I then reverted the change (`git checkout`).
   - No race: the click handler runs synchronously during `click()`, so the one-shot read is deterministic.
2. **Doc line 822: pass.** "The view survives runs and tab switches but not a reload; the selected tab follows each run (see above) and a reload starts on Build." This matches the code:
   - `view` is changed only by `onViewChange={setView}` (page line 224). `runSimulation` never resets it.
   - The tabs use `hidden` panels, so a tab switch leaves `view` alone.
   - `useState<EditorView>('text')` and `useState<WorkbenchTab>('build')` reset on reload (page lines 96-97).
   - The pin-restore effect (lines 110-133) never calls `setTab`, so a reload with a pin still starts on Build.
   - `setTab('results')` runs on success (line 177). `setTab('build')` runs on rejection, non-ok and network failure (lines 160, 170, 182). This matches "see above" at doc lines 818-819.
   - It also matches `design/M4.md:480` ("The view survives runs and tab switches, not reloads") and the `tabs | default` row ("Build on load").
3. **Doc line 930: fail.** See blocking finding 1. The pin, compare panel and no-table part is correct; the message-prefix list is not.
4. **Listener removed in a finally: pass.** `page.on('request', onRequest)` at spec line 50, `try` covers the edit window, and `page.off('request', onRequest)` is in the `finally` (lines 64-66). This matches `runRejected` in `acceptance/helpers.ts`. `type Request` is imported from `@playwright/test`.
5. **Nothing else changed: pass.** `git diff --stat 6465ca8..HEAD` lists only the two files:
   - `acceptance/aoe4-build-order-m4-flow.spec.ts`: 24 added and 17 removed lines across both files, made up of the `PIN_KEY` const, the listener refactor, and the storage assert.
   - `docs/aoe4-build-order.md`: the two sentences.

Rework item 5 (re-audit other tab and view sentences): I grepped the doc for `reload`, `survive`, `tab` and `tabs`. The hits are lines 817-822, 837, 849 and 903. All are accurate:
- 849: tab switches do not remount the step table.
- 903: the pin survives a reload.

The implementer found no other wrong sentence, and neither did I.

## Stability

I used a throwaway config with `reuseExistingServer: true` and one `next dev` on port 4221.
- Run 1: flow plus contract spec, `--repeat-each=10 --workers=5`, gave **660 passed**. `aoe4-build-order-pin-compare.spec.ts --repeat-each=2 --workers=3` ran at the same time and gave 64 passed.
- Run 2: flow alone, `--repeat-each=10 --workers=5`, gave **10 passed** (3.6-4.6 s each). `aoe4-build-order.spec.ts --workers=3` ran at the same time and gave 53 passed.

Afterwards I stopped the server (killed its process group; port 4221 is free) and deleted the config.

## Lint

- `npx tsc --noEmit`: exit 0.
- `npm run lint:dup`: 0 clones.

## Acceptance criteria

I left the criteria unticked because the verdict is not APPROVE. Their state at this tip:

| criterion | result |
|---|---|
| m4-flow file count; acceptance passes | pass (review 1 ran the full suite; the delta is test-only, and the flow and contract specs pass) |
| Flow: tabs, info list, inline error | pass (only the listener wrapper changed; the assertions are identical) |
| Flow: pin | pass. The final step can now fail (mutation above) |
| Deterministic, webServer | pass |
| Docs stale phrases, paths, Route, More control, OpenAPI | pass (unchanged since review 1) |
| Contract spec unedited | pass (not in the diff; 650 passed under load) |
| Every doc edit listed in the PR | PR-time check |
| Mutation criterion | pass (review 1) |
| No INVARIANTS.md regressions | pass (prose and test only) |
| (rework 1) unpin step can fail | pass |
| (rework 1) docs ~822 | pass |
| (rework 1) `page.off` in a finally | pass |
| (rework 1) docs ~932 | **fail** (blocking finding 1) |
| (rework 1) re-audit tab and view sentences | pass |

Invariants touched: none. A3 prose is unchanged.

## Bot reconciliation

`reviewBot.cli` is empty and no `rulesFile` is set, so no bot ran.

## Non-blocking notes

- `docs/aoe4-build-order.md:822`: the edited line is about 170 characters long, while the paragraph wraps at about 115, and the next line ("with that build's paste text; editing the text") is short from an earlier edit. Consider rewrapping. Line 930 was already one long line.

## Coverage

Files reviewed (delta):
- `acceptance/aoe4-build-order-m4-flow.spec.ts`
- `docs/aoe4-build-order.md`, lines 814-835, 845-852, 586-600, 895-912 and 925-935

Compared against:
- `pages/apps/aoe4-build-order.tsx`: state, restore effect, `runSimulation`, `errorMessages`, `unpin`
- `components/apps/aoe4-build-order/compare-panel.tsx`
- `pages/api/aoe4-build-order/simulate.ts`
- `lib/aoe4-build-order/schema.ts`: `issue`, `located`, `toOrderIssue`, `checkSimInputs`
- `design/M4.md`: 470-485

Not re-run: the full acceptance suite, unit tests and the build. The delta changes no production code, and review 1 ran all three on `6465ca8`. The REPO.md review checklist sections were applied in review 1, and nothing in the delta changes their outcome.
