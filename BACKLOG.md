# Backlog

Follow-ups noticed during work that are not yet tickets. `/code-factory:new-project` and milestone planning
pull from here; triage moves an item into a milestone or deletes it.

- **AoE4 data freshness check (CI).** Add a scheduled CI job that compares the pinned aoe4world snapshot
  under `data/aoe4-build-order/` (its recorded aoe4world/data commit) with the latest upstream and fails or
  opens an issue when it is out of date. Note: the repo has no GitHub Actions yet (REPO.md CI behavior), so
  this would be the first workflow. Depends on M2's data snapshot existing. (owner, 2026-10-29)
- **AoE4 base gather rates are provisional.** Replace the unverified values copied from
  SichYuriy/aoe4-production-calculator with measured or citable ones, labeled with a patch. (owner, 2026-10-29)
- **AoE4 English economy and Blacksmith tech gaps (owner review of rules/english.json, 2026-10-31).** Owner flagged
  wood and food gather upgrades, Wheelbarrow and the basic Blacksmith upgrades
  (https://ageofempires.fandom.com/wiki/Blacksmith_(Age_of_Empires_IV)) as missing; owner accepts them as follow-ups.
  Checked against `data/aoe4-build-order/aoe4world/english.json` on main 68e004a: wheelbarrow, crosscut-saw,
  lumber-preservation, horticulture, fertilization, survival-techniques, professional-scouts and all twelve Blacksmith
  techs plus siege-works are in the snapshot; `rules/english.json` holds only the hand-entered overlay. Real gaps:
  `double-broadax-2` is in the snapshot too (age 2, 50 food 100 gold, 45 s, wood gather x1.15; matches the owner's cost). (2) `forestry` effect is `unknown`, so
  the engine rejects it; (3) crosscut-saw's +5 wood carry is not modeled (SGS-014 known data gap); (4) Blacksmith
  techs are combat-only, so by the v1 coverage decision they cost resources and queue time but their effects are
  ignored. Decide whether a follow-up adds overlay rows for (2)-(3).

- AoE4 acceptance coverage removed by SGS-098 (owner chose deletion over re-pin, Q14): pinned timelines and bank values (prebuilt English build, house lead time, spend/population, depletion-engine vs pre-depletion engine), veterancy-conversion counts, the contract 200-body example, edges result-shape, markers at a truncated horizon, triggers infinite-node timings, the house-warnings knight/longbow held warning, spear/longbow men-at-arms timing and 1200 s gold. Uncovered at acceptance level; unit pins are current. Source: reports/SGS-098-ticket-1.md.
- acceptance/aoe4-small-screen.spec.ts:42 "run bar at 360x760 ... scrolls the results heading into view" failed once in a full npm run acceptance (1/734), passed 5/5 alone and on a second full run; likely load flake. (SGS-095 implementer-2)
- SGS-102 (useAutoRun hook): when auto-run rule 2 fires, the in-flight request's shown.selected keeps the old value, so the pin name can lag briefly; per spec, but the hook should expect it. (SGS-100 review 1)
- SGS-106 non-blocking review notes (reports/SGS-106-review-1.md): a cross-origin redirect would carry the bypass header (Node fetch and Playwright header override); the fallback `FAIL smoke:` line is untested and effectively unreachable; the spec helper reads a signal-killed run as exit 0; the "repeat run", "another directory" and usage spec rows inherit the shell's `VERCEL_AUTOMATION_BYPASS_SECRET`. From SGS-106.
- `isLineHidden` (aoe4 chart legend) strips a leading `pinned:` from any key, so a current series keyed `pinned:*` would hide wrongly; no such key exists today (SGS-113).
- docs/aoe4-build-order.md:~971 says the pinned line is "in the same color as the current series with that key", inexact for pinned-only series (SGS-113 review).
- Acceptance specs (SGS-118): wait briefly after `running` before reading the answered list so the new "no response before release" assertions are the first failure, not shadowed by earlier asserts.
- SGS-115 split-scroll spec cannot pin `overflow-y: auto` and `min-height: 0` separately (overflow-x: hidden already implies both); the declarations are redundant for the test.
- useChartLayout move/toggle compute from render-time layout, so two activations in one render lose one (SGS-114; not reachable by single clicks today).
- Memory-store "shares no named build between envs" test (build-store.test.ts, SGS-120) cannot fail on an env bug since each memory store has its own map; the existing builds env-isolation test has the same gap. (SGS-120 review 1)
- AoE4 build page (M9.12 fixed the run bar part): another tab clearing storage is not picked up until reload, and builds created in this tab are not capped at 50 until reload. (SGS-125 review 1)
- Named builds: if the page unmounts after the server created a build but before the 201 arrives, the edit secret is never stored and the build can never be edited (design accepts it). Also `recordCreated` puts the new entry at the front of the whole list, not the My builds group (invisible while the select groups by kind). (batch13 tech-lead, SGS-125)
- design/M9.md M9.9 criteria-map row describes one Tab walk after Save as copy reaching save-build then the link controls; no page state allows it (save-build is disabled whenever the link shows). Change to the two-state version. Source: SGS-141 re-spec, reports/SGS-141-ticket-2.md
- `components/apps/aoe4-build-order/pin-storage.ts:24` `readStoredPin` still calls `removeItem` on an unparseable pinned run, the pattern SGS-131 removed from my-builds; lower stakes (no secret). Reported by SGS-131 review.
- `design/M9.md` C14 (and SGS-140 ticket) assume 1rem = 16px but `styles/global.css:8` sets the root to 18px; other M9 rem sizing may share the assumption. Reported by SGS-140 review.
- `ARCHITECTURE.md` says blob-build-store.ts is the only file importing `@vercel/blob`; test files import it too (SGS-130).
- `useRunBarHeight` rounds with `Math.ceil`, which can leave the document 1px short of the bar page top; SGS-133/141 will be sensitive when bar height changes (SGS-132 implementer).
- SGS-133 criterion (a) expects run-bar top at 0 after scrolling to end; likely hits the same 1px rounding as SGS-132 and needs a <1px tolerance (SGS-132 re-spec).
- Three hand-written in-memory Blob fakes (blob-build-store.test.ts:36-63 counterBlob, blob-lost-writes.acceptance.test.ts:22-71, named-build-store.acceptance.test.ts); a shared test-support fake would replace all (SGS-130 review 3).
- components/apps/aoe4-build-order/chart-header.tsx / results.tsx: arrow keys pressed mid pointer-drag reorder charts and leave the drag start position stale (SGS-135 review-1, non-blocking).
- acceptance/aoe4-build-order-step-band.spec.ts:143 flakes in large parallel acceptance batches (failed once in a 380-spec run, passed 13/13 alone). Reported by SGS-133 implementer-2.
- design/M9.md row M9.12 (b): clearing the copy name (save-copy-name-error shown) is required for the (c) "notice below bar bottom at scrollTop 0" check (339px vs 306px content in a 287px bar); the ticket calls it optional. Make it required in the design row. Reported by SGS-133 review-1.
- components/apps/aoe4-build-order run bar (.runBar): focusing a control scrolled into the capped bar clips the top of its focus ring; `scroll-padding-block: 0.25rem` fixes it. Also `overflow-anchor: none` applies at narrow/tabs widths too - designer may want anchoring kept there. Reported by SGS-133 review-1.
- components/apps/aoe4-build-order Buildings view (units-produced, SGS-137 branch): on the default build "Abbey of Kings" is listed as a production building; check whether SGS-136 data should count it (it trains no units in-game? verify). Reported by SGS-137 review-1.
- acceptance/aoe4-split-tab-order.spec.ts: column-order and handle-before-caret assertions are masked by setup assertions under mutation (column swap trips 'every chart section is rendered'; caret-before-handle trips 'every chart section has a handle stop'); harden by taking the last chart's handle from the DOM. Reported by SGS-141 acceptance-test-1.
- lib/aoe4-build-order/blob-build-store.ts replaceNamed: live run (owner, 2026-11-12, npm run test:blob-live) shows put with ifMatch on a missing key raises a plain BlobError 'The specified key does not exist.' (SDK bad_request), not BlobNotFoundError/BlobPreconditionFailedError, so replaceNamed rethrows and PUT on a named build deleted between read and write answers 503 instead of the 409 changed reply. Fix: on a put error that is not 'landed', head the key and return 'conflict' when it is absent. Also blob-build-store.live.test.ts test 1 passes on any Error (it passed on BlobOidcEnvironmentNotAllowedError); assert the class. Reported by SGS-130 owner live verification.
