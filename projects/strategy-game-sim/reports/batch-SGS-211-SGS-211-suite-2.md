# Suite gate: batch-SGS-211-SGS-211 (SGS-211)

Verdict: **PASS**

- Branch: `sgs-211-repeat-paste-text-and-table-field`
- Tip SHA: `c6e5c14bfbce8a9291e7db0341c81ee32116481b`
- Base: `main` (e396ca3)
- Scratch checkout: `suite-SGS-211-SGS-211` (created at the tip SHA, removed after this report)

## Commands run

| Step | Command | Result |
|------|---------|--------|
| Runtime check | `run.sh <scratch> "node -v"` (shellSetup loaded) | v24.22.2 |
| acceptanceSetup | not run | The unit suite is Vitest and does not need Chromium |
| codegen | not run | `commands.codegen` is empty |
| unit | `run.sh <scratch> "npm test"` (`vitest run`), log at `$TMPDIR/suite-SGS-211-SGS-211/suite-SGS-211-SGS-211.unit.log` | see summary |

Unit summary line:

```
Test Files  95 passed | 1 skipped (96)
Tests       3098 passed | 15 skipped (3113)
```

The log has no failure or error lines. Duration was about 6.6 s.

The full `commands.unit` was the verdict. `build` and `lint` were not run, because `commands.unit` is set.

## Tree check

`git status --porcelain` on the scratch checkout after the run is empty. The tree is clean, and HEAD is still `c6e5c14`.

## Environment

- Declared: `engines.node` = `24.x` in `package.json`. `REPO.md` `shellSetup` is `nvm use 24`. No `.nvmrc`, `.node-version`, or `.tool-versions` exists.
- Installed through run.sh: v24.22.2. This matches the declared range, so there is no mismatch.

## Failures

None.

## Cleanup

Scratch checkout removal is run after this report is written. The log is in `$TMPDIR`, outside the checkout.
