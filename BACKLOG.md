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
- `lib/aoe4-build-order/blob-build-store.ts`: during a Blob outage, the SDK's own retries (up to 10) multiply with the 3 compare-and-swap counter attempts. (Remainder of SGS-101 tech-lead batch 8; M8 covers the refused-save counter write.)
- No acceptance test pins the split-layout Tab order (select, duration, Text/Table, Save, link, Copy, Build, Results); M8 changes the save controls, so pin the order after M8. Evidence: reports/batch10-tech-lead-1.md. (Remainder of the SGS-105 item; M8 covers the query and ref parts.)
- SGS-106 non-blocking review notes (reports/SGS-106-review-1.md): a cross-origin redirect would carry the bypass header (Node fetch and Playwright header override); the fallback `FAIL smoke:` line is untested and effectively unreachable; the spec helper reads a signal-killed run as exit 0; the "repeat run", "another directory" and usage spec rows inherit the shell's `VERCEL_AUTOMATION_BYPASS_SECRET`. From SGS-106.
- Verify once against a real Vercel Blob store what `put` with `allowOverwrite: true` and `ifMatch` does on a missing key; if it creates the blob, SGS-120's "missing key -> conflict" rule breaks silently in production (`lib/aoe4-build-order` blob-build-store.ts). Reported by SGS-120 re-spec.
- `isLineHidden` (aoe4 chart legend) strips a leading `pinned:` from any key, so a current series keyed `pinned:*` would hide wrongly; no such key exists today (SGS-113).
- docs/aoe4-build-order.md:~971 says the pinned line is "in the same color as the current series with that key", inexact for pinned-only series (SGS-113 review).
- Acceptance specs (SGS-118): wait briefly after `running` before reading the answered list so the new "no response before release" assertions are the first failure, not shadowed by earlier asserts.
- Fake-storage helper is similar in pin-storage.test.ts and chart-layout.test.ts; a shared test helper could replace both (SGS-114).
- SGS-115 split-scroll spec cannot pin `overflow-y: auto` and `min-height: 0` separately (overflow-x: hidden already implies both); the declarations are redundant for the test.
- tsconfig has strict:false, so typed callbacks across the codebase get weaker checks than they appear to; turning strict on is its own ticket (SGS-112).
- Split-scroll page (SGS-115 review): clearing `duration-error` at 1280x800 scrolled to end drops scrollY 244->151 (scroll anchoring); `overflow-anchor: none` on the section/.workbenchSplit may fix.
- my-builds-storage.test.ts copies fake/throwing Storage from pin-storage.test.ts; ARCHITECTURE.md says shared helpers live in lib/aoe4-build-order/test-helpers.ts (SGS-123; same item as SGS-114 fake-storage note).
- ARCHITECTURE.md:47-48 names shared test helpers only in lib/aoe4-build-order/test-helpers.ts; add components/apps/aoe4-build-order/fetch-test-helpers.ts (SGS-122). Also saved-build-loader.test.ts:13-17,40 still has its own stubFetch/json duplicating it.
- readMyBuilds deletes the whole localStorage key when the stored value fails to parse, losing every stored edit secret (SGS-123, C5 mandates); the wiring ticket should decide log vs backup.
- useChartLayout move/toggle compute from render-time layout, so two activations in one render lose one (SGS-114; not reachable by single clicks today).
- Memory-store "shares no named build between envs" test (build-store.test.ts, SGS-120) cannot fail on an env bug since each memory store has its own map; the existing builds env-isolation test has the same gap. Also: a lost response to a conditional Blob `put` retried by the SDK returns 412, so `replaceNamed` reports `conflict` for a write that landed (extends the SDK-retry item above). (SGS-120 review 1)
- design/M8.md C3 gives `ReplyTarget.end(): void`; SGS-121 made it `end(chunk?: string)` (lib/aoe4-build-order/api-route.ts). Update C3 at the next designer pass. Also `sendReply` detects its own ETag case-sensitively, so a reply setting `etag` would lose it. (SGS-121 review 1)
- design/M8.md:562 says Escape focuses "the button that saved"; after Save a new version that button is disabled, so SGS-125 focuses Save as copy (ticket updated, rework 1). Update the design text at the next designer pass. (SGS-125 review 1)
- AoE4 build page at 1280x720 with the copy form, link and storage warning open: the sticky run bar covers ~52% of the viewport. Also: another tab clearing storage is not picked up until reload, and builds created in this tab are not capped at 50 until reload. (SGS-125 review 1)
- Named builds: if the page unmounts after the server created a build but before the 201 arrives, the edit secret is never stored and the build can never be edited (design accepts it). Also `recordCreated` puts the new entry at the front of the whole list, not the My builds group (invisible while the select groups by kind). (batch13 tech-lead, SGS-125)
