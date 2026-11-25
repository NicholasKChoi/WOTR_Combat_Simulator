# Suite report: batch-SGS-215-SGS-215 (suite-2)

Verdict: **PASS**

- Branch: sgs-215-production-past-population-cap
- Top-of-stack SHA: 1871d68d5d6339e7119d8bd64d1ebc7d94842ef2 (scratch checkout HEAD matches)
- Base: main
- Scratch: suite-SGS-215-SGS-215 (created via checkout.sh scratch, exit 0)

## Command run

- `commands.unit` = `npm test` (Vitest, `vitest run`), run through run.sh in the scratch checkout.
- Log: /tmp/claude-1000/suite-SGS-215-SGS-215/suite-SGS-215-SGS-215.unit.log
- `commands.codegen` is empty; no codegen run.
- `commands.acceptanceSetup` not run: the Vitest include/exclude config excludes `acceptance/**`, so the unit suite does not need Chromium. Dependencies were installed with `bash /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/bin/link-node-modules.sh .`, the install step of `commands.acceptanceSetup`.

## Summary line

```
Test Files  96 passed | 1 skipped (97)
Tests       3136 passed | 15 skipped (3151)
```

No failures. The 15 skipped tests and 1 skipped file are skips declared in the repo, not failures.

## Working tree

`git status --porcelain` after the run: empty (clean). No codegen step, so no generated files were added.

## Environment

- Runtime: Node v24.22.2, npm 11.19.1 (via run.sh, shellSetup `source ~/.nvm/nvm.sh && nvm use 24`).
- Declared: `engines.node` = `24.x` in package.json. No `.nvmrc`, `.node-version`, or `.tool-versions` in the repo.
- Match: yes, no mismatch.

## Cleanup

Scratch removal attempted after this report was written; see the handback for its result.
