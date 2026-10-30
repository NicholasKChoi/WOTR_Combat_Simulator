# batch3 tech-lead: SGS-006

**Decision: no blockers. Draft PR opened.**

- PR #21 https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/21 - head `sgs-006-fight-api-contract` @ 2979b3d, base `main` (11038fe), draft.
- Pushed `sgs-006-fight-api-contract` to origin (no new commits; 3 commits, all authored choinickolas@gmail.com). `git push -u` pushed the ref but could not write upstream tracking (`.git/config` lock file exists); the remote ref is confirmed at 2979b3d.
- Body set via `gh api -X PATCH .../pulls/21 -F body=@file`. Single PR, so no gh-stack link and no stack footer.

## Merge risk
**medium** - publishes a public API contract (`docs/api/openapi.json`, exported types) and adds a devDependency, but the wire format is unchanged and a revert fully undoes it.

## Review focus
- No hotspots: runtime code changes are type annotations only (the compiler covers every call site), and every documented field, range, status and example in the spec is exercised against the live endpoint by the contract check.

## What I reviewed
- Range 11038fe..2979b3d (a92b2ef implementation, ee34dac acceptance spec `fight-api-spec-surface.spec.ts`, 2979b3d warm-up via postFight).
- 11 files, +1248/-36 total; hand-written logic +67/-35 (fight-api.ts, simulate.ts, fight.ts, two JSDoc lines, package.json). Read in full: all non-data diffs; openapi.json info/400/FightRequest/FightOutcomes descriptions; lockfile additions (ajv + fast-deep-equal, fast-uri, json-schema-traverse, require-from-string, dev-only).
- Invariants: S1 holds (types in lib/combat-simulator); S3 holds (no new input, caps documented); W1 no rules restated; W2 untouched (no runtime change). No open question answered (CONTEXT open questions are AoE4 only). No irreversibility, no security surface, no concurrency, no consumer contract break (removed simulate.ts exports had no importers; tsc clean).

## PR-body notes included per manager
- Mutation table (implementer's runs plus review's independent re-runs).
- Confirmation that renaming a field in FightResponse alone fails `npx tsc --noEmit`.
- Two pre-existing out-of-scope issues: "malformed JSON runs no battle" never reaches Invalid JSON; GET /api/models/army logs "resolver is not a function".
- These satisfy the two unchecked ticket criteria (mutation note, tsc rename note).

## Non-blocking notes
1. `lib/combat-simulator/simulate.ts:126` `outcomes as FightOutcomes` is nominal for a custom kind list (test-only); `simulate.test.ts:61` relies on non-strict indexing.
2. `pages/api/fight.ts:109` `req.body as FightRequest` claims a shape before validation; harmless since `validateFightForm` takes `unknown`.
3. `SGS-006-acceptance.md` named in the gate evidence is not present in reports/; I relied on the manager's PASS (209).
4. Follow-up tickets worth filing for the two pre-existing issues above.
