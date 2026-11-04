# SGS-094 review 1

Verdict: **APPROVE**

Branch sgs-094-aoe4-deer-pack-2450 at 2782f95 (local only; origin has no such branch yet), base origin/main d950413. Reviewed in a detached worktree at that SHA. Diff: 8 files, 13 lines changed.

## Blocking findings

None.

## Re-pin of the four digests in simulate-house-warnings.test.ts: justified

`digestTimeline` hashes `{ spawnedPopulation, spent, steps, populationCapReachedAt, depletions, markers }`. `depletions` always lists every finite node with its starting `amount`, so the deer amount is part of every digest. Changing the shipped default changes all of them, whether or not any villager touches deer.

I checked this myself with a scratch Vitest file (now deleted) covering the late-house run and the three shipped builds at 1800 s:
- With `nodeAmounts.deer: 1750`, each run reproduces its old pin exactly (67af1a20a5434d6f, 42b0afc54e5e8bf8, 95876b5e98214174, 082d524201cfafbd).
- Taking the default (2450) timeline and the 1750-override timeline, changing the deer `amount` in the 1750 one to 2450 makes the two deep-equal, and that patched object hashes to each new pin (975a4c07971b6e6d, 499e09e55f47604b, 91057a4051aa15eb, ba508ab49dcb2d6f).
- Taking the full `SimulationResult` (warnings and everything else included) and dropping the deer depletion entry, the default and 1750 runs are deep-equal.
- The deer entry is `depletedAt: null` in both runs for all four. Nobody gathers deer, so the only thing that changed is the reported starting amount, not any timing.

So the pins moved only because they include the deer amount, which is what the ticket changes. That is the change item 5 meant to allow; it is not the "moved for any other reason" case it guards against. The commit message gives the reason, as item 5 requires.

**Ticket wording (non-blocking).** Item 5 only allows a re-pin "when the build or test sends villagers to deer". That misses pins that embed the deer starting amount itself (digests or snapshots over `depletions`). Suggested replacement for that sentence: "re-pin it only when the build or test sends villagers to deer (or a `deer` reaction/trigger) so that the larger stock moves the value, or when the pin embeds the deer starting `amount` itself (a digest or snapshot over `depletions`) and re-running it with `nodeAmounts.deer: 1750` reproduces the old pin exactly; state that reason in the commit message and report". This is worth carrying into future data-value tickets that touch node amounts.

## Acceptance criteria

1. base.json deer amount is `{ value: 2450, source: "owner-supplied starting total (2026-11-04): deer pack, 2450 food", unverified: true }`, and that is the only field changed. PASS (diff).
2. A default run gives a deer depletion with amount 2450. PASS: shown in the scratch run, and by the acceptance `default node amounts` DEFAULTS. `data.test.ts` `node amounts` fails if the value is reverted (the implementer's mutation check). The table compares the full `{ value, source, unverified }` object with `toEqual`, so reverting the source text also fails it.
3. Explicit `nodeAmounts.deer` overrides still apply. PASS: the override tests are unchanged and pass, and my scratch runs used the override and got amount 1750.
4. `git grep -n -E "deer: 1750|7 deer x 250"` finds no match. Both `"node": "deer"` examples in openapi.json (lines 705, 1704) show 2450. PASS.
5. No doc or comment states 1750 for deer or the 7 x 250 derivation. PASS: grepping `1750` under lib, acceptance, docs, data, app, components, pages and the root docs finds only the unrelated aoe4world hitpoints.
6. Each of the three shipped builds has amount 2450 by default. PASS: verified, with depletedAt null before and after. The only pins that changed are the digests justified above.
7. The implementer report lists the edited tests and the before/after values. PASS: amounts 1750 to 2450 and depletedAt null to null. The implementer inferred depletedAt rather than printing it; I printed it and confirmed it.
8. `npm test` (48 files, 1488 passed, 10 skipped), `npx tsc --noEmit` and lint:dup (0 clones) all pass. `npm run acceptance`: 738 passed and 1 failed, `aoe4-build-order-step-band.spec.ts:101` (keyboard focus band). That spec passed 27/27 on a 3x repeat run on its own, it is a UI focus test the deer amount cannot affect, and the implementer's full run passed 739/739. I'm treating it as a flake under full-suite load. PASS.
9. No invariant regressions. PASS (see below).

## Invariants touched

- A1 (numbers from labelled data files): holds. The value lives in base.json with a source label and `unverified: true`.
- A2 (resources never go negative): untouched, since no engine code changed.
- A3 (determinism): holds. The default and override runs are deterministic, and the old digests reproduce exactly.
- S1 to S3, W*, H*: not touched.

## spec-checklist

Contracts: `nodeAmounts` and `depletions` field names are unchanged. Scope: no engine, rate, capacity, other-node or golang change. No invented constant: 2450 is the owner's figure. Naming: no new names.

## Conventions

- In `data.test.ts`, the deer row uses its own literal source string, the same way the gold row next to it does (`lib/aoe4-build-order/data.test.ts:115`), because the shared `owner` constant has the 2026-11-01 date. This is consistent with the gold row.
- The other test edits only change the value inside existing default tables, which keeps their shape as the ticket asks.
- The commit author is choinickolas@gmail.com, as Vercel requires. The commit message has no ticket ids. It mentions "7 deer x 250" as history, which is fine in a commit message and is not covered by the repo grep.

## Lint

`npx tsc --noEmit` is clean. `npm run lint:dup` found 0 clones.

## Bot reconciliation

`reviewBot.cli` is empty, so no bot ran. `rulesFile` is empty.

## Review checklist (REPO.md)

- Every diff: `npx next build` succeeds. I did not load the page by hand with `npm run dev`. The change is data only, and the full acceptance suite loads `/apps/aoe4-build-order` through its UI specs (738 passed).
- AoE4 build order: no helper or constant was copied. `docs/aoe4-build-order.md` describes amounts in general terms and gives no deer figure, so no doc sentence is contradicted. No UI or layout change.

## Non-blocking notes

- Ticket item 5 wording: see the suggested replacement above.
- `aoe4-build-order-step-band.spec.ts:101` flaked once under full-suite load. It is unrelated to this diff, but a candidate for the LESSONS rule on reading rects in one evaluate, if it recurs.

## Coverage

I reviewed all 8 changed files plus the `digestTimeline` helper and its test context, and the `node amounts` describe in `data.test.ts`. I ran a scratch digest check (deleted afterwards), unit tests, tsc, lint:dup, next build, the deer-relevant acceptance specs (triggers, depletion-engine, prebuilt-plans, prebuilt-farms, knight-longbow, spear-longbow: 120 passed), and the full acceptance suite. Not done: a manual `npm run dev` page load.
