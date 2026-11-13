# SGS-155 spec gate 2

Verdict: READY. Risk `low` confirmed.

Both gate-1 gaps are closed:
- Test location: Scope puts tests in `lib/aoe4-build-order/*.test.ts` importing the `.mjs` files. vitest `include` at origin/main covers `lib/**`, and tsconfig has `allowJs: true`, so a `.ts` import of `.mjs` typechecks. A criterion requires the tests to appear in `npm test` output.
- Shared constants: Scope names a side-effect-free module that holds the repo, kinds, civ, `filterEnglish` and `getJson`. Both scripts import it. The check never imports `refresh-snapshot.mjs`, which writes `english.json` on load. I read `refresh-snapshot.mjs` at origin/main: the top-level argv check, `process.exit`, fetch and `writeFileSync` all exist as described, and the extraction is feasible.

Other checks (read at origin/main):
- No `.github/workflows` exists.
- Node 24 matches `engines`.
- REPO.md line 51 (the `babysit` comment) and line 80 (the "No GitHub Actions workflows" note) are the stale items named in On merge. On merge is well formed.
- Nothing in lib, utils or the other tickets references `refresh-snapshot`, apart from README lines 11 and 19, which Scope covers. TASK-GRAPH has no overlapping ticket.
- Invariant A1 adjacency is correct.
- No input-validation trigger: the script only compares fetched JSON.
- Unverified assumptions cover the happy path (GitHub API and raw access) and the notification behavior.

## Notes (non-blocking)
- Criterion 11 ("no README text claims the snapshot is only ever refreshed with no automated freshness signal") has no matching text in today's README. It is harmless but vacuous. "README describes the check" is the real criterion.
- Because the check script's main flow is `.mjs` with a default `fetch` parameter, TypeScript infers that parameter's type from the default. A test passing a fake fetch may need a cast. The implementer can handle this.
- The README file-table row for `refresh-snapshot.mjs` stays true. Add a row for the new module and for the check script.
