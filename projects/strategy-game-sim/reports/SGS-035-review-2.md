# SGS-035 review 2

Verdict: **APPROVE**

Delta review of `6dec3b1..e33fbf7` (rework 1). Round 1 verified all code at 6dec3b1.

## Blocking findings

None.

## Rework check

- PASS (rework 1): `ARCHITECTURE.md:42-44` now says "The AoE4 build order is checked for copied code. `npm run lint:dup` (config `.jscpd.json`) fails on any duplicated block of at least 8 lines and 70 tokens in its lib, components or API route". That matches `.jscpd.json` (`minLines: 8`, `minTokens: 70`, `threshold: 0`, paths `lib/aoe4-build-order`, `components/apps/aoe4-build-order`, `pages/api/aoe4-build-order`). The overstated "has no copied code" is gone. Only that sentence changed.
- PASS (rework 1, optional): the `RESOURCE_TOLERANCE` comment in `engine-common.ts:9` adds "The same margin absorbs float noise in the auto-house population shortfall." It is accurate: `houses.ts:24` (`shortfall <= RESOURCE_TOLERANCE`) and `simulate.ts:523` (`shortfall > RESOURCE_TOLERANCE`) use it. Comment only; no code changed.
- No other doc sentence overstates lint:dup. A grep for `lint:dup`, `jscpd`, `copied` and `duplicat` across `*.md`, `*.ts` and `*.tsx` finds only the ARCHITECTURE.md line. The other hits are unrelated: `docs/aoe4-build-order.md:72` and `:111` describe data copying and duplicate ids, and `golang/frontend/README.md` is CRA boilerplate.

## Commands (Node 24, fresh `npm ci` at e33fbf7)

- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones, exit 0.
- `npm test`: 29 files, 704 tests passed, the same count as round 1.
- `commands.lint`: none is configured beyond `lint:dup`. Round 1 covered this.

## Acceptance criteria

All 16 criteria are ticked. 15 rest on round-1 evidence at 6dec3b1, and this delta does not change code behavior. The `ARCHITECTURE.md` criterion now passes on wording as well as presence. Both rework items were already ticked.

## Invariants

The delta is a doc sentence and a comment, so it touches no invariant. Round-1 findings stand.

## Bot reconciliation

No `reviewBot.cli` or `rulesFile` is configured, so there are no bot findings.

## Non-blocking notes

- Carried from round 1: the PR body must say the lint:dup failure demo (a 10-line paste) was run and reverted.
- Carried from round 1: `type Resources` is declared in both `engine-common.ts` and `simulate.ts`.

## Coverage

Reviewed `ARCHITECTURE.md`, `lib/aoe4-build-order/engine-common.ts` (the diff), `.jscpd.json` and repo-wide doc mentions of the dup check. The branch was not on origin, so the review worktree was made at SHA e33fbf7 directly. The worktree has been removed.
