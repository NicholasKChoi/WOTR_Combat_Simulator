# SGS-012 review 2 (delta, rework 1)

Verdict: **APPROVE**

Scope: `623a5ff..da77a09` on `sgs-012-upgrade-dependencies` (local tip da77a09 "Pin Node to 24.x"; not yet on origin, which is still at 623a5ff). Reviewed in a separate detached worktree at da77a09, which has since been removed.

## Blocking findings

None.

## Diff

- `package.json:9`: `engines.node` `">=22.12.0"` -> `"24.x"`.
- `package-lock.json:24` (root `packages[""]` entry): `engines.node` `">=22.12.0"` -> `"24.x"`.
- That is the whole change: 2 files, 1 line each. No resolved version, integrity or other package entry changed.

## Rework 1 required fixes

- [x] `engines.node` is `"24.x"`, and the only lockfile change is the root entry's `engines` field. Running `npm install --package-lock-only` on the tip gives no further change. The only diff is the top-level `name`, which comes from the review worktree's directory name because `package.json` has no `name`. It is an artifact and was reverted.
- [x] On local Node v22.17.0, `npm ci` exits 0 and prints only the expected `EBADENGINE` warning (78 packages, 0 vulnerabilities). `npx tsc --noEmit` exits 0. `npm test` (Vitest 5.0.5) passes: 4 files, 57 tests.
- [ ] The Vercel log showing Node 24.x is checked after the push, so it is left for the manager or tech-lead.

## Acceptance criteria tagged (rework 1)

- Line 110-111, `engines.node` is `24.x`: **pass**. It was already ticked.
- Line 139, the Vercel check is green and its log shows Node 24.x with no override warning: **unverifiable**, because da77a09 is not pushed. I left it unchecked.

## Invariants touched

None. The change is runtime metadata only, and no source, route or API changed.

## Lint / bot

The lint step is `npx tsc --noEmit`, and it exits 0. `reviewBot.cli` and `rulesFile` are empty in REPO.md, so there is nothing to reconcile.

## Non-blocking notes

- Ticket line 14 has an "On merge" step that updates the REPO.md `acceptanceHarness` text to "the Node floor this ticket sets (22.12+)". That is stale after rework 1: the requirement is now Node 24.x. Local Node 22 still installs, with a warning, because `engine-strict` is unset. Whoever does the on-merge REPO.md edit should write "Node 24.x" or "Node 22.12+ works locally, production pins 24.x", not "22.12+".
- Ticket line 151 (respec 1 notes) says "`engines.node >=22.12.0` stands". That is historical and is superseded by the rework 1 text at lines 88-90. No action is needed.

## Coverage

Reviewed `package.json` and `package-lock.json` (the full delta). Ran `npm ci`, `tsc` and `npm test` on da77a09. Checked that there is no `.nvmrc`, `.node-version` or `vercel.json` that could conflict with the pin. I did not review the Vercel build, because it needs the push.
